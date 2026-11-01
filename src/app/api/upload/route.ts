import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parseConfigFile } from '@/lib/configParser';
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

    // Procura por aethel.config ou discloud.config
    let configContent: string | null = null;
    let configFilename = 'aethel.config';

    const aethelFile = zip.file('aethel.config') || zip.file(/^.*\/aethel\.config$/i)[0];
    const discloudFile = zip.file('discloud.config') || zip.file(/^.*\/discloud\.config$/i)[0];

    if (aethelFile) {
      configContent = await aethelFile.async('string');
      configFilename = 'aethel.config';
    } else if (discloudFile) {
      configContent = await discloudFile.async('string');
      configFilename = 'discloud.config';
    }

    if (!configContent) {
      return NextResponse.json({
        error: 'Arquivo de configuração não encontrado no ZIP. Inclua um "aethel.config" ou "discloud.config".',
      }, { status: 400 });
    }

    // Faz o parse do arquivo
    const parsed = parseConfigFile(configContent, configFilename);
    const effectiveToken = manualToken || parsed.token;

    if (!effectiveToken) {
      return NextResponse.json({
        error: 'Token do bot não foi informado nem encontrado no arquivo de configuração.',
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
      p_bot_name: parsed.name,
      p_platform: parsed.platform,
      p_token_encrypted: effectiveToken,
      p_ram_limit_mb: parsed.ram,
      p_main_file: parsed.main,
      p_config_type: parsed.configType,
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
      if (parsed.platform === 'DISCORD') {
        const channel = supabase.channel('mesh_control_farol-alpha');
        await channel.send({
          type: 'broadcast',
          event: 'SPAWN_BOT',
          payload: { botId, token: effectiveToken, botName: parsed.name },
        });
      }
    }

    return NextResponse.json({
      success: true,
      bot: botData,
      parsedConfig: parsed,
      fileSizeMb: (file.size / (1024 * 1024)).toFixed(2),
    });
  } catch (err: any) {
    console.error('[Upload] Erro:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

