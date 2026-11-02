import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateApiRequest } from '@/lib/serverApiAuth';
import { inspectZipBot } from '@/lib/botInspector';
import { parseAndShimZip } from '@/lib/loader/universalParser';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';

const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB limite estrito

/**
 * POST /api/v1/upload
 * Faz upload e implanta um novo bot via REST API com Universal Shim v3.0
 * Estilo Discloud: https://api.discloud.app/v2/upload
 */
export async function POST(req: NextRequest) {
  const auth = authenticateApiRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const manualToken = formData.get('token') as string | null;

    if (!file) {
      return NextResponse.json(
        { status: 'error', statusCode: 400, message: 'Nenhum arquivo ZIP enviado no campo "file".' },
        { status: 400 }
      );
    }

    if (file.size > MAX_STORAGE_BYTES) {
      return NextResponse.json(
        {
          status: 'error',
          statusCode: 413,
          message: `Arquivo excede o limite estrito de 100 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
        },
        { status: 413 }
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(fileBuffer);

    let totalUncompressedBytes = 0;
    zip.forEach((_, entry) => {
      const uncomp = (entry as any)._data?.uncompressedSize || 0;
      totalUncompressedBytes += uncomp;
    });

    if (totalUncompressedBytes > MAX_STORAGE_BYTES * 2) {
      return NextResponse.json(
        {
          status: 'error',
          statusCode: 413,
          message: `O conteúdo descompactado do bot excede o limite estrito da malha Aethel.`,
        },
        { status: 413 }
      );
    }

    const shimResult = await parseAndShimZip(fileBuffer);
    const inspected = await inspectZipBot(zip, manualToken || shimResult.metadata.token || undefined);
    const effectiveToken = inspected.token || shimResult.metadata.token;

    if (!effectiveToken) {
      return NextResponse.json(
        {
          status: 'error',
          statusCode: 400,
          message: 'Token de autenticação não encontrado nos arquivos do bot (discloud.config, aethel.config, .env ou código). Envie o token no campo "token" ou adicione ao projeto.',
        },
        { status: 400 }
      );
    }

    // Validação estrita de cota
    const { data: existingBots } = await supabase
      .from('aethel_bots')
      .select('id, bot_name, ram_limit_mb, token_encrypted');

    const matchingBot = (existingBots || []).find(
      (b) => b.token_encrypted === effectiveToken || b.bot_name.toLowerCase() === inspected.name.toLowerCase()
    );

    const userQuotaMb = 100;
    const requiredRam = Math.max(inspected.ramLimitMb || 100, 100);

    if (!matchingBot) {
      const currentReservedRam = (existingBots || []).reduce(
        (sum, b) => sum + Math.max(b.ram_limit_mb || 100, 100),
        0
      );

      if (currentReservedRam + requiredRam > userQuotaMb || (existingBots || []).length >= 1) {
        return NextResponse.json(
          {
            status: 'error',
            statusCode: 403,
            message: `Limite de Cota Excedido! Seu plano possui ${userQuotaMb} MB de limite e a reserva mínima por aplicação é 100 MB. Você já possui ${(existingBots || []).length} aplicação ativa consumindo ${currentReservedRam} MB. Para criar uma nova aplicação, exclua a existente primeiro via DELETE /api/v1/app/:id.`,
          },
          { status: 403 }
        );
      }
    }

    const storagePath = `deployments/${Date.now()}_api_${file.name}`;
    const uploadBuffer = shimResult.modifiedZip || Buffer.from(fileBuffer);

    await supabase.storage.from('aethel-deployments').upload(storagePath, uploadBuffer, {
      contentType: 'application/zip',
      upsert: true,
    });

    let botId: string;

    if (matchingBot) {
      botId = matchingBot.id;
      await supabase
        .from('aethel_bots')
        .update({
          bot_name: inspected.name,
          main_file: inspected.mainFile || shimResult.metadata.entrypoint,
          config_type: inspected.configType,
          ram_limit_mb: requiredRam,
          storage_size_bytes: file.size,
          status: 'ONLINE',
          last_restart_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', botId);
    } else {
      const { data: botData, error: dbError } = await supabase.rpc('register_or_update_bot', {
        p_user_id: 'api-user',
        p_bot_name: inspected.name,
        p_platform: inspected.platform,
        p_token_encrypted: effectiveToken,
        p_ram_limit_mb: requiredRam,
        p_main_file: inspected.mainFile || shimResult.metadata.entrypoint,
        p_config_type: inspected.configType,
        p_assigned_node: 'farol-alpha',
      });

      if (dbError) {
        return NextResponse.json(
          { status: 'error', statusCode: 500, message: dbError.message },
          { status: 500 }
        );
      }
      botId = botData?.bot_id;
    }

    if (botId) {
      await supabase
        .from('aethel_bots')
        .update({ storage_size_bytes: file.size })
        .eq('id', botId);

      try {
        await supabase
          .from('aethel_bots')
          .update({
            runtime_mode: 'UNIVERSAL_SHIM_v3',
            detected_entrypoint: shimResult.metadata.entrypoint,
            cron_interval_sec: shimResult.metadata.cronIntervalSec,
          })
          .eq('id', botId);
      } catch (_) {}

      if (inspected.platform === 'TELEGRAM') {
        const webhookUrl = `https://aethelkov.vercel.app/api/telegram?botId=${botId}`;
        try {
          await fetch(
            `https://api.telegram.org/bot${effectiveToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
          );
        } catch (_) {}
      }

      await supabase.from('aethel_logs').insert({
        bot_id: botId,
        log_level: 'INFO',
        message: `[API REST v3.0] Aplicação implantada com Universal Shim. Plataforma: ${inspected.platform}.`,
      });
    }

    return NextResponse.json({
      status: 'ok',
      statusCode: 200,
      message: 'Aplicação implantada com sucesso na malha Aethel Cloud (Universal Shim v3.0 ativo)!',
      app: {
        id: botId,
        name: inspected.name,
        platform: inspected.platform,
        main: inspected.mainFile || shimResult.metadata.entrypoint,
        ram: requiredRam,
        online: true,
        runtimeMode: 'UNIVERSAL_SHIM_v3',
        usesVoice: shimResult.metadata.usesVoice,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', statusCode: 500, message: err.message },
      { status: 500 }
    );
  }
}
