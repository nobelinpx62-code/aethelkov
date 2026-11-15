import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { inspectZipBot } from '@/lib/botInspector';
import { parseAndShimZip } from '@/lib/loader/universalParser';
import { checkUserSubscription } from '@/lib/subscriptionManager';
import { registerSubdomain } from '@/lib/subdomainManager';
import { saveAppEnvVars } from '@/lib/envVarsService';
import JSZip from 'jszip';

const MAX_STORAGE_BYTES = 100 * 1024 * 1024; // 100 MB limite estrito

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const manualToken = formData.get('token') as string | null;
    const customEnvRaw = formData.get('env') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (file.size > MAX_STORAGE_BYTES) {
      return NextResponse.json({
        error: `Arquivo excede o limite estrito de 100 MB (${(file.size / (1024 * 1024)).toFixed(2)} MB detectados).`,
      }, { status: 413 });
    }

    const fileBuffer = await file.arrayBuffer();

    // Inspeciona e injeta o Universal Shim v3.0 transparente
    const zip = await JSZip.loadAsync(fileBuffer);

    // Parse de variáveis de ambiente personalizadas
    let parsedCustomEnv: Record<string, string> = {};
    if (customEnvRaw) {
      try {
        parsedCustomEnv = JSON.parse(customEnvRaw);
      } catch (_) {}
    }

    // Processamento do Universal Shim e extração profunda de metadados
    const shimResult = await parseAndShimZip(fileBuffer);
    const inspected = await inspectZipBot(zip, manualToken || shimResult.metadata.token || parsedCustomEnv['DISCORD_TOKEN'] || parsedCustomEnv['BOT_TOKEN'] || undefined);

    // Se discloud.config estiver faltando, cria e injeta automaticamente
    if (!inspected.hasDiscloudConfig) {
      zip.file('discloud.config', inspected.generatedDiscloudConfig);
    }

    // Combina variáveis de ambiente detectadas com variáveis fornecidas pelo usuário
    const combinedEnv = { ...inspected.detectedEnvVars, ...parsedCustomEnv };
    if (Object.keys(combinedEnv).length > 0) {
      const envContent = Object.entries(combinedEnv)
        .map(([k, v]) => `${k}=${v}`)
        .join('\n') + '\n';
      zip.file('.env', envContent);
    }

    // Sanitização inteligente: remove pastas pesadas desnecessárias (node_modules, __pycache__, .git)
    const filesToRemove: string[] = [];
    zip.forEach((path) => {
      const lower = path.toLowerCase();
      if (
        lower.startsWith('node_modules/') ||
        lower.includes('/node_modules/') ||
        lower.startsWith('__pycache__/') ||
        lower.includes('/__pycache__/') ||
        lower.startsWith('.git/') ||
        lower.includes('/.git/') ||
        lower.startsWith('.venv/') ||
        lower.includes('/.venv/')
      ) {
        filesToRemove.push(path);
      }
    });
    filesToRemove.forEach((p) => zip.remove(p));

    // Gera buffer sanitizado e otimizado
    const sanitizedBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

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

    const effectiveToken = inspected.token || shimResult.metadata.token;

    if (!effectiveToken) {
      return NextResponse.json({
        error: 'Não foi possível encontrar o token do bot nos arquivos (verificamos discloud.config, aethel.config, .env e o código-fonte). Por favor, informe o token no campo de autenticação.',
      }, { status: 400 });
    }

    // Validação estrita de cota de memória RAM:
    // O mínimo por aplicação é 100 MB. Com 100 MB de cota, o usuário só pode criar UMA aplicação.
    const { data: existingBots } = await supabase
      .from('aethel_bots')
      .select('id, bot_name, ram_limit_mb, token_encrypted');

    const matchingBot = (existingBots || []).find(
      (b) => b.token_encrypted === effectiveToken || b.bot_name.toLowerCase() === inspected.name.toLowerCase()
    );

    // Consulta cota real contratada no perfil do usuário (assinatura ativa nos logs)
    const sub = await checkUserSubscription();
    const userQuotaMb = Math.max(sub.isActive ? sub.ramMb : 100, 100);
    const maxAllowedApps = Math.max(1, Math.floor(userQuotaMb / 100));
    const requiredRam = Math.max(inspected.ramLimitMb || 100, 100);

    if (!matchingBot) {
      const currentReservedRam = (existingBots || []).reduce(
        (sum, b) => sum + Math.max(b.ram_limit_mb || 100, 100),
        0
      );

      if (currentReservedRam + requiredRam > userQuotaMb || (existingBots || []).length >= maxAllowedApps) {
        return NextResponse.json({
          error: `Limite de Cota de Memória Atingido! Seu plano possui ${userQuotaMb} MB de limite e você já possui ${(existingBots || []).length} aplicação(ões) ativa(s) consumindo ${currentReservedRam} MB (limite: ${maxAllowedApps} instâncias). Para criar mais bots ou alocar mais RAM, faça upgrade na aba Planos.`,
        }, { status: 403 });
      }
    }

    // Salva o arquivo ZIP sanitizado no Supabase Storage
    const storagePath = `deployments/${Date.now()}_${file.name}`;
    const uploadBuffer = sanitizedBuffer || shimResult.modifiedZip || Buffer.from(fileBuffer);

    const { error: storageError } = await supabase.storage
      .from('aethel-deployments')
      .upload(storagePath, uploadBuffer, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (storageError) {
      console.warn('[Upload] Aviso ao salvar no Storage:', storageError.message);
    }

    let botId: string;
    let resultBotData: any = null;

    if (matchingBot) {
      botId = matchingBot.id;
      resultBotData = { bot_id: botId, updated: true };
      await supabase
        .from('aethel_bots')
        .update({
          bot_name: inspected.name,
          main_file: inspected.mainFile || shimResult.metadata.entrypoint,
          config_type: inspected.configType,
          ram_limit_mb: requiredRam,
          storage_size_bytes: file.size,
          updated_at: new Date().toISOString(),
        })
        .eq('id', botId);
    } else {
      const { data: botData, error: dbError } = await supabase.rpc('register_or_update_bot', {
        p_user_id: 'default-user',
        p_bot_name: inspected.name,
        p_platform: inspected.platform,
        p_token_encrypted: effectiveToken,
        p_ram_limit_mb: requiredRam,
        p_main_file: inspected.mainFile || shimResult.metadata.entrypoint,
        p_config_type: inspected.configType,
        p_assigned_node: 'farol-alpha',
      });

      if (dbError) {
        return NextResponse.json({ error: dbError.message }, { status: 500 });
      }
      resultBotData = botData;
      botId = botData?.bot_id;
    }

    // Atualiza metadados v3.0 (com tolerância a esquemas legados)
    if (botId) {
      await supabase
        .from('aethel_bots')
        .update({ storage_size_bytes: file.size })
        .eq('id', botId);

      // Se for aplicação do tipo Site Web, vincula nó com prefixo site: e registra subdomínio
      if (inspected.isSite) {
        const assignedNode = inspected.subdomain ? `site:${inspected.subdomain}` : 'site:app';
        try {
          await supabase
            .from('aethel_bots')
            .update({ assigned_node: assignedNode })
            .eq('id', botId);
        } catch (_) {}

        if (inspected.subdomain) {
          try {
            await registerSubdomain({
              subdomain: inspected.subdomain,
              appId: botId,
              appName: inspected.name,
            });
          } catch (_) {}
        }
      }

      // Persiste variáveis de ambiente combinadas no serviço de banco
      if (Object.keys(combinedEnv).length > 0) {
        try {
          await saveAppEnvVars(botId, combinedEnv, inspected.name);
        } catch (_) {}
      }

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

      // Se for Discord, emite comando SPAWN_BOT para o nó do Farol via Realtime com metadados v3
      if (inspected.platform === 'DISCORD') {
        const channel = supabase.channel('mesh_control_farol-alpha');
        await channel.send({
          type: 'broadcast',
          event: 'SPAWN_BOT',
          payload: {
            botId,
            token: effectiveToken,
            botName: inspected.name,
            cronInterval: shimResult.metadata.cronIntervalSec,
            usesVoice: shimResult.metadata.usesVoice,
          },
        });
      }

      // Se for Telegram, ativa imediatamente o webhook no Telegram
      if (inspected.platform === 'TELEGRAM') {
        const webhookUrl = `https://aethelkov.vercel.app/api/telegram?botId=${botId}`;
        try {
          const tgRes = await fetch(
            `https://api.telegram.org/bot${effectiveToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
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

      // Registra log da auto-detecção com Universal Shim
      await supabase.from('aethel_logs').insert({
        bot_id: botId,
        log_level: 'INFO',
        message: `[Aethel-Core v3.0] Aplicação implantada com Universal Shim. Plataforma: ${inspected.platform} | Voz: ${shimResult.metadata.usesVoice ? 'Sim (Lavalink)' : 'Não'} | BD Local: ${shimResult.metadata.usesLocalDb ? 'Sim' : 'Não'}.`,
      });
    }

    return NextResponse.json({
      success: true,
      bot: resultBotData,
      botId,
      inspected: {
        name: inspected.name,
        platform: inspected.platform,
        language: inspected.language,
        mainFile: inspected.mainFile || shimResult.metadata.entrypoint,
        ramLimitMb: inspected.ramLimitMb,
        detectionReason: inspected.detectionDetails.platformReason,
        tokenSource: inspected.detectionDetails.tokenSource,
        usesVoice: shimResult.metadata.usesVoice,
        usesLocalDb: shimResult.metadata.usesLocalDb,
        cronIntervalSec: shimResult.metadata.cronIntervalSec,
        features: inspected.detectionDetails.detectedFeatures,
        hasDiscloudConfig: inspected.hasDiscloudConfig,
      },
      fileSizeMb: (file.size / (1024 * 1024)).toFixed(2),
    });
  } catch (err: any) {
    console.error('[Upload] Erro:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
