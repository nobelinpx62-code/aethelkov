import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateApiRequest } from '@/lib/serverApiAuth';
import { inspectZipBot } from '@/lib/botInspector';
import { parseAndShimZip } from '@/lib/loader/universalParser';
import JSZip from 'jszip';

export const dynamic = 'force-dynamic';

const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB limite estrito

/**
 * PUT /api/v1/app/[id]/commit
 * Atualiza os arquivos do bot via upload ZIP aplicando o Universal Shim v3.0
 * Estilo Discloud: https://api.discloud.app/v2/app/:id/commit
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authenticateApiRequest(req);
  if (!auth.authenticated) return auth.errorResponse!;

  const { id } = params;

  try {
    const { data: bot, error: botErr } = await supabase
      .from('aethel_bots')
      .select('*')
      .eq('id', id)
      .single();

    if (botErr || !bot) {
      return NextResponse.json(
        { status: 'error', statusCode: 404, message: `Aplicação com ID "${id}" não encontrada.` },
        { status: 404 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

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
    const shimResult = await parseAndShimZip(fileBuffer);
    const inspected = await inspectZipBot(zip, bot.token_encrypted);

    const storagePath = `deployments/${Date.now()}_commit_${file.name}`;
    const uploadBuffer = shimResult.modifiedZip || Buffer.from(fileBuffer);

    await supabase.storage.from('aethel-deployments').upload(storagePath, uploadBuffer, {
      contentType: 'application/zip',
      upsert: true,
    });

    const requiredRam = Math.max(inspected.ramLimitMb || 100, 100);

    await supabase
      .from('aethel_bots')
      .update({
        bot_name: inspected.name || bot.bot_name,
        main_file: inspected.mainFile || shimResult.metadata.entrypoint || bot.main_file,
        config_type: inspected.configType || bot.config_type,
        ram_limit_mb: requiredRam,
        storage_size_bytes: file.size,
        status: 'ONLINE',
        last_restart_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    try {
      await supabase
        .from('aethel_bots')
        .update({
          runtime_mode: 'UNIVERSAL_SHIM_v3',
          detected_entrypoint: shimResult.metadata.entrypoint,
          cron_interval_sec: shimResult.metadata.cronIntervalSec,
        })
        .eq('id', id);
    } catch (_) {}

    await supabase.from('aethel_logs').insert({
      bot_id: id,
      log_level: 'INFO',
      message: `[API REST Commit v3.0] Novo pacote com Universal Shim implantado via PUT /api/v1/app/${id}/commit (${(file.size / 1024).toFixed(1)} KB). Instância reiniciada.`,
    });

    if (bot.platform === 'TELEGRAM') {
      const token = inspected.token || bot.token_encrypted;
      if (token) {
        const webhookUrl = `https://aethelkov.vercel.app/api/telegram?botId=${id}`;
        try {
          await fetch(
            `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
          );
        } catch (_) {}
      }
    }

    return NextResponse.json({
      status: 'ok',
      statusCode: 200,
      message: `Commit realizado com sucesso! Aplicação "${bot.bot_name}" atualizada com Universal Shim v3.0.`,
      logs: `[Aethel-Deploy v3.0] Commit finalizado. Ponto de entrada: ${shimResult.metadata.entrypoint}. Voz: ${shimResult.metadata.usesVoice ? 'Sim' : 'Não'}.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', statusCode: 500, message: err.message },
      { status: 500 }
    );
  }
}
