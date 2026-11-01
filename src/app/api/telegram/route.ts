import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get('botId');
  const action = searchParams.get('action');

  if (!botId) {
    return NextResponse.json({ error: 'Parâmetro botId obrigatório' }, { status: 400 });
  }

  // Busca o token do bot no Supabase
  const { data: bot, error } = await supabase
    .from('aethel_bots')
    .select('*')
    .eq('id', botId)
    .single();

  if (error || !bot) {
    return NextResponse.json({ error: 'Bot não encontrado' }, { status: 404 });
  }

  // Ação de registrar webhook no Telegram
  if (action === 'setWebhook') {
    const host = req.headers.get('host') || 'aethelkov.vercel.app';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const webhookUrl = `${protocol}://${host}/api/telegram?botId=${botId}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${bot.token_encrypted}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const tgData = await tgRes.json();

    await supabase.from('aethel_logs').insert({
      bot_id: botId,
      log_level: 'INFO',
      message: `[Telegram Webhook] Registro configurado: ${JSON.stringify(tgData)}`,
    });

    return NextResponse.json({ success: true, telegramResponse: tgData, webhookUrl });
  }

  return NextResponse.json({ status: 'AETHEL_TELEGRAM_ENDPOINT_READY', botName: bot.bot_name });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get('botId');

    const update = await req.json();

    if (!botId) {
      return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
    }

    const { data: bot } = await supabase
      .from('aethel_bots')
      .select('token_encrypted, bot_name')
      .eq('id', botId)
      .single();

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    const message = update.message;
    if (message && message.text) {
      const chatId = message.chat.id;
      const text = message.text.trim();
      const user = message.from.first_name || 'Usuário';

      await supabase.from('aethel_logs').insert({
        bot_id: botId,
        log_level: 'DISPATCH',
        message: `[Telegram] Mensagem recebida de ${user}: "${text.slice(0, 40)}"`,
      });

      let reply = `⚡ Olá **${user}**! Sou o bot **${bot.bot_name}**, rodando 100% serverless na plataforma **Aethelkov**.`;
      if (text === '/start' || text === '/help') {
        reply = `🤖 **${bot.bot_name} no Ar!**\n\nEste bot opera sem servidores dedicados através da arquitetura distribuída Aethelkov.\nComandos disponíveis:\n/ping - Testar latência de resposta\n/info - Detalhes da infraestrutura`;
      } else if (text === '/ping') {
        reply = `🏓 **Pong!** Executado em milissegundos via Vercel Edge Serverless.`;
      } else if (text === '/info') {
        reply = `🛰️ **Aethelkov Serverless Runner**\nCusto: R$ 0,00\nConsumo de RAM: 0 MB residente`;
      }

      // Envia resposta de volta via REST API do Telegram
      await fetch(`https://api.telegram.org/bot${bot.token_encrypted}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
          parse_mode: 'Markdown',
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Telegram] Erro:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

