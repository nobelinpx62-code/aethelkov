import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { data: bots, error } = await supabase
      .from('aethel_bots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Busca estatísticas do cluster
    const { data: statsData } = await supabase.rpc('get_cluster_stats');

    return NextResponse.json({
      bots: bots || [],
      stats: statsData || {
        total_bots: bots?.length || 0,
        online_bots: bots?.filter(b => b.status === 'ONLINE').length || 0,
        discord_bots: bots?.filter(b => b.platform === 'DISCORD').length || 0,
        telegram_bots: bots?.filter(b => b.platform === 'TELEGRAM').length || 0,
        estimated_ram_mb: (bots?.filter(b => b.platform === 'DISCORD' && b.status === 'ONLINE').length || 0) * 1.05,
        discloud_quota_mb: 100,
        monthly_cost_brl: 0.0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bot_name, platform, token, ram_limit_mb, main_file, config_type, assigned_node } = body;

    if (!bot_name || !token || !platform) {
      return NextResponse.json({ error: 'Nome, token e plataforma são obrigatórios.' }, { status: 400 });
    }

    // Validação de cota de memória RAM: 100 MB por aplicação
    const { data: existingBots } = await supabase
      .from('aethel_bots')
      .select('id, bot_name, ram_limit_mb, token_encrypted');

    const matchingBot = (existingBots || []).find(
      (b) => b.token_encrypted === token || b.bot_name.toLowerCase() === bot_name.toLowerCase()
    );

    const userQuotaMb = 100;
    const requiredRam = Math.max(ram_limit_mb || 100, 100);

    if (!matchingBot) {
      const currentReservedRam = (existingBots || []).reduce(
        (sum, b) => sum + Math.max(b.ram_limit_mb || 100, 100),
        0
      );

      if (currentReservedRam + requiredRam > userQuotaMb || (existingBots || []).length >= 1) {
        return NextResponse.json({
          error: `Limite de Cota de Memória Atingido! Seu plano possui ${userQuotaMb} MB de limite e o consumo mínimo por aplicação é 100 MB. Você já possui ${(existingBots || []).length} aplicação ativa consumindo ${currentReservedRam} MB. Para criar uma nova aplicação, você precisa excluir a existente primeiro.`,
        }, { status: 403 });
      }
    }

    let botId: string;
    let resultBotData: any = null;

    if (matchingBot) {
      botId = matchingBot.id;
      resultBotData = { bot_id: botId, updated: true };
      await supabase
        .from('aethel_bots')
        .update({
          bot_name,
          platform,
          token_encrypted: token,
          ram_limit_mb: requiredRam,
          main_file: main_file || 'index.js',
          config_type: config_type || 'aethel',
          updated_at: new Date().toISOString(),
        })
        .eq('id', botId);
    } else {
      // Executa a função RPC do Supabase
      const { data, error } = await supabase.rpc('register_or_update_bot', {
        p_user_id: 'default-user',
        p_bot_name: bot_name,
        p_platform: platform,
        p_token_encrypted: token,
        p_ram_limit_mb: requiredRam,
        p_main_file: main_file || 'index.js',
        p_config_type: config_type || 'aethel',
        p_assigned_node: assigned_node || 'farol-alpha',
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      resultBotData = data;
      botId = data?.bot_id;
    }

    // Se for Discord, despacha SPAWN_BOT para o nó do Farol via Supabase Realtime Broadcast
    if (platform === 'DISCORD' && botId) {
      const node = assigned_node || 'farol-alpha';
      const channel = supabase.channel(`mesh_control_${node}`);
      await channel.send({
        type: 'broadcast',
        event: 'SPAWN_BOT',
        payload: { botId, token, botName: bot_name },
      });
    }

    // Se for Telegram, registra automaticamente o Webhook no Telegram
    if (platform === 'TELEGRAM' && botId) {
      const webhookUrl = `https://aethelkov.vercel.app/api/telegram?botId=${botId}`;
      try {
        await fetch(
          `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
        );
      } catch (_) {}
    }

    return NextResponse.json({ success: true, bot: resultBotData, botId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { botId, status } = body;

    if (!botId || !status) {
      return NextResponse.json({ error: 'botId e status são obrigatórios.' }, { status: 400 });
    }

    // Busca o bot para saber o token e nó
    const { data: bot, error: fetchErr } = await supabase
      .from('aethel_bots')
      .select('*')
      .eq('id', botId)
      .single();

    if (fetchErr || !bot) {
      return NextResponse.json({ error: 'Bot não encontrado.' }, { status: 404 });
    }

    // Atualiza status via RPC
    await supabase.rpc('set_bot_status', {
      p_bot_id: botId,
      p_status: status,
    });

    // Se for Discord, notifica o Farol via Realtime
    if (bot.platform === 'DISCORD') {
      const channel = supabase.channel(`mesh_control_${bot.assigned_node || 'farol-alpha'}`);
      if (status === 'ONLINE') {
        await channel.send({
          type: 'broadcast',
          event: 'SPAWN_BOT',
          payload: { botId, token: bot.token_encrypted, botName: bot.bot_name },
        });
      } else {
        await channel.send({
          type: 'broadcast',
          event: 'KILL_BOT',
          payload: { botId },
        });
      }
    } else if (bot.platform === 'TELEGRAM') {
      // Se for Telegram, ativa ou suspende o Webhook na API do Telegram
      if (status === 'ONLINE') {
        const webhookUrl = `https://aethelkov.vercel.app/api/telegram?botId=${botId}`;
        try {
          await fetch(
            `https://api.telegram.org/bot${bot.token_encrypted}/setWebhook?url=${encodeURIComponent(webhookUrl)}&drop_pending_updates=true`
          );
        } catch (_) {}
      } else {
        try {
          await fetch(
            `https://api.telegram.org/bot${bot.token_encrypted}/deleteWebhook`
          );
        } catch (_) {}
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get('id');

    if (!botId) {
      return NextResponse.json({ error: 'Parâmetro id obrigatório.' }, { status: 400 });
    }

    const { data: bot } = await supabase
      .from('aethel_bots')
      .select('assigned_node')
      .eq('id', botId)
      .single();

    if (bot) {
      const channel = supabase.channel(`mesh_control_${bot.assigned_node || 'farol-alpha'}`);
      await channel.send({
        type: 'broadcast',
        event: 'KILL_BOT',
        payload: { botId },
      });
    }

    const { error } = await supabase.from('aethel_bots').delete().eq('id', botId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedId: botId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

