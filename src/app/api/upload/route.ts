import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { inspectZipBot } from '@/lib/botInspector';
import JSZip from 'jszip';

const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB limite estrito

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const manualToken = formData.get('token') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (file.size > MAX_STORAGE_BYTES) {
      return NextResponse.json({
        error: `Arquivo excede o limite estrito de 100 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB detectados).`,
      }, { status: 413 });
    }

    const fileBuffer = await file.arrayBuffer();

    // Inspeciona o arquivo ZIP
    const zip = await JSZip.loadAsync(fileBuffer);

    // Validação de cota descompactada
    let totalUncompressedBytes = 0;
    zip.forEach((_, entry) => {
      const uncomp = (entry as any)._data?.uncompressedSize || 0;
      totalUncompressedBytes += uncomp;
    });

    if (totalUncompressedBytes > MAX_STORAGE_BYTES * 2) {
      return NextResponse.json({
        error: `O conteúdo descompactado do bot (${(totalUncompressedBytes / (1024 * 1024)).toFixed(2)} MB) excede o limite da cota. Remova dependências excessivas ou pastas pesadas.`,
      }, { status: 413 });
    }

    // Inspeção profunda e inteligente de token, plataforma e configuração
    const inspected = await inspectZipBot(zip, manualToken);

    if (!inspected.token) {
      return NextResponse.json({
        error: 'Não foi possível encontrar o token do bot nos arquivos (verificamos discloud.config, aethel.config, .env e o código-fonte). Por favor, informe o token no campo de autenticação.',
      }, { status: 400 });
    }

    // Salva o arquivo ZIP no Supabase Storage
    const storagePath = `deployments/${Date.now()}_${file.name}`;
    const { error: storageError } = await supabase.storage
      .from('aethel-deployments')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (storageError) {
      console.warn('[Upload] Aviso ao salvar no Storage:', storageError.message);
    }

    // Registra o bot no banco de dados via RPC
    const { data: botData, error: dbError } = await supabase.rpc('register_or_update_bot', {
      p_user_id: 'default-user',
      p_bot_name: inspected.name,
      p_platform: inspected.platform,
      p_token_encrypted: inspected.token,
      p_ram_limit_mb: inspected.ramLimitMb,
      p_main_file: inspected.mainFile,
      p_config_type: inspected.configType,
      p_assigned_node: 'farol-alpha',
    });

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    const botId = botData?.bot_id;

    // Atualiza o tamanho do storage no registro
    if (botId) {
      await supabase
        .from('aethel_bots')
        .update({ storage_size_bytes: file.size })
        .eq('id', botId);

      // Se for Discord, emite comando SPAWN_BOT para o nó do Farol via Realtime
      if (inspected.platform === 'DISCORD') {
        const channel = supabase.channel('mesh_control_farol-alpha');
        await channel.send({
          type: 'broadcast',
          event: 'SPAWN_BOT',
          payload: { botId, token: inspected.token, botName: inspected.name },
        });
      }

      // Se for Telegram, ativa imediatamente o webhook no Telegram
      if (inspected.platform === 'TELEGRAM') {
        const webhookUrl = `https://aethelkov.vercel.app/api/telegram?botId=${botId}`;
        try {
          const tgRes = await fetch(
            `https://api.telegram.org/bot${inspected.token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
          );
          const tgData = await tgRes.json();
          await supabase.from('aethel_logs').insert({
            bot_id: botId,
            log_level: 'INFO',
            message: `[Telegram Webhook] Webhook registrado com sucesso: ${JSON.stringify(tgData)}`,
          });
        } catch (tgErr: any) {
          console.error('[Upload] Erro ao registrar webhook Telegram:', tgErr.message);
        }
      }

      // Registra log da auto-detecção
      await supabase.from('aethel_logs').insert({
        bot_id: botId,
        log_level: 'INFO',
        message: `[Aethel-Core] Aplicação detectada automaticamente como ${inspected.platform} (${inspected.detectionDetails.platformReason}). Token extraído de: ${inspected.detectionDetails.tokenSource || 'upload'}.`,
      });
    }

    return NextResponse.json({
      success: true,
      bot: botData,
      botId,
      inspected: {
        name: inspected.name,
        platform: inspected.platform,
        mainFile: inspected.mainFile,
        ramLimitMb: inspected.ramLimitMb,
        detectionReason: inspected.detectionDetails.platformReason,
        tokenSource: inspected.detectionDetails.tokenSource,
      },
      fileSizeMb: (file.size / (1024 * 1024)).toFixed(2),
    });
  } catch (err: any) {
    console.error('[Upload] Erro:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
