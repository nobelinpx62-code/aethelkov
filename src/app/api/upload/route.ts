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

    // Validação estrita de cota de memória RAM:
    // O mínimo por aplicação é 100 MB (definido no aethel.config / discloud.config).
    // Com 100 MB de cota, o usuário só pode criar UMA aplicação.
    const { data: existingBots } = await supabase
      .from('aethel_bots')
      .select('id, bot_name, ram_limit_mb, token_encrypted');

    const matchingBot = (existingBots || []).find(
      (b) => b.token_encrypted === inspected.token || b.bot_name.toLowerCase() === inspected.name.toLowerCase()
    );

    const userQuotaMb = 100;
    const requiredRam = Math.max(inspected.ramLimitMb || 100, 100);

    if (!matchingBot) {
      const currentReservedRam = (existingBots || []).reduce(
        (sum, b) => sum + Math.max(b.ram_limit_mb || 100, 100),
        0
      );

      if (currentReservedRam + requiredRam > userQuotaMb || (existingBots || []).length >= 1) {
        return NextResponse.json({
          error: `Limite de Cota de Memória Atingido! Seu plano possui ${userQuotaMb} MB de limite e o consumo mínimo por aplicação é 100 MB (reservado para sua instância). Você já possui ${(existingBots || []).length} aplicação ativa consumindo ${currentReservedRam} MB. Para criar uma nova aplicação, você precisa excluir a existente primeiro.`,
        }, { status: 403 });
      }
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

    let botId: string;
    let resultBotData: any = null;

    if (matchingBot) {
      // Se for a mesma aplicação (mesmo token ou nome), atualiza os dados em vez de duplicar
      botId = matchingBot.id;
      resultBotData = { bot_id: botId, updated: true };
      await supabase
        .from('aethel_bots')
        .update({
          bot_name: inspected.name,
          main_file: inspected.mainFile,
          config_type: inspected.configType,
          ram_limit_mb: requiredRam,
          storage_size_bytes: file.size,
          updated_at: new Date().toISOString(),
        })
        .eq('id', botId);
    } else {
      // Registra o novo bot no banco de dados via RPC
      const { data: botData, error: dbError } = await supabase.rpc('register_or_update_bot', {
        p_user_id: 'default-user',
        p_bot_name: inspected.name,
        p_platform: inspected.platform,
        p_token_encrypted: inspected.token,
        p_ram_limit_mb: requiredRam,
        p_main_file: inspected.mainFile,
        p_config_type: inspected.configType,
        p_assigned_node: 'farol-alpha',
      });

      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
      resultBotData = botData;
      botId = botData?.bot_id;
    }

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
      bot: resultBotData,
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
