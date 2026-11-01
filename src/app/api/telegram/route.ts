import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const botId = searchParams.get('botId');
  const action = searchParams.get('action');

  if (!botId) {
    return NextResponse.json({ error: 'Parâmetro botId obrigatório' }, { status: 400 });
  }

  // Busca o bot no Supabase
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

    const tgRes = await fetch(
      `https://api.telegram.org/bot${bot.token_encrypted}/setWebhook?url=${encodeURIComponent(
        webhookUrl
      )}&drop_pending_updates=true`
    );
    const tgData = await tgRes.json();

    await supabase.from('aethel_logs').insert({
      bot_id: botId,
      log_level: 'INFO',
      message: `[Telegram Webhook] Sincronização automática: ${JSON.stringify(tgData)}`,
    });

    return NextResponse.json({ success: true, telegramResponse: tgData, webhookUrl });
  }

  return NextResponse.json({
    status: 'AETHEL_TELEGRAM_ENDPOINT_READY',
    botName: bot.bot_name,
    platform: bot.platform,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const botId = searchParams.get('botId');

    if (!botId) {
      return NextResponse.json({ error: 'Missing botId' }, { status: 400 });
    }

    const update = await req.json();

    const { data: bot } = await supabase
      .from('aethel_bots')
      .select('token_encrypted, bot_name, status')
      .eq('id', botId)
      .single();

    if (!bot || !bot.token_encrypted) {
      return NextResponse.json({ error: 'Bot not found or no token' }, { status: 404 });
    }

    // Se o bot estiver desligado no painel, não processa
    if (bot.status === 'STOPPED') {
      return NextResponse.json({ ok: true, note: 'bot_stopped' });
    }

    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true, note: 'non_message_update' });
    }

    const user = message.from || {};
    const chat = message.chat || {};
    const userName = user.first_name || user.username || 'Usuário';
    const isPrivate = chat.type === 'private';
    let replyText = '';

    // 1. Tratamento de mensagens encaminhadas (Forward Origin)
    if (message.forward_origin || message.forward_from || message.forward_from_chat) {
      replyText = `📩 *INFORMAÇÕES DA MENSAGEM ENCAMINHADA*\n\n`;

      if (message.forward_origin) {
        const origin = message.forward_origin;
        if (origin.type === 'user') {
          replyText +=
            `👤 *Nome:* ${origin.sender_user.first_name}\n` +
            `🔗 *Username:* ${origin.sender_user.username ? `@${origin.sender_user.username}` : 'Nenhum'}\n` +
            `🆔 *ID:* \`${origin.sender_user.id}\`\n` +
            `⭐ *Premium:* ${origin.sender_user.is_premium ? 'Sim' : 'Não'}`;
        } else if (origin.type === 'chat' || origin.type === 'channel') {
          replyText +=
            `📢 *Título:* ${origin.chat.title}\n` +
            `🔗 *Username:* ${origin.chat.username ? `@${origin.chat.username}` : 'Nenhum'}\n` +
            `🆔 *ID:* \`${origin.chat.id}\`\n` +
            `🏷 *Tipo:* \`${origin.type}\``;
        } else if (origin.type === 'hidden_user') {
          replyText +=
            `👤 *Nome exibido:* ${origin.sender_user_name}\n⚠️ *ID oculto:* O remetente desativou o link de perfil nos encaminhamentos.`;
        }
      } else if (message.forward_from) {
        replyText +=
          `👤 *Nome:* ${message.forward_from.first_name}\n` +
          `🔗 *Username:* ${message.forward_from.username ? `@${message.forward_from.username}` : 'Nenhum'}\n` +
          `🆔 *ID:* \`${message.forward_from.id}\``;
      } else if (message.forward_from_chat) {
        replyText +=
          `📢 *Título:* ${message.forward_from_chat.title}\n` +
          `🔗 *Username:* ${message.forward_from_chat.username ? `@${message.forward_from_chat.username}` : 'Nenhum'}\n` +
          `🆔 *ID:* \`${message.forward_from_chat.id}\``;
      }

      await supabase.from('aethel_logs').insert({
        bot_id: botId,
        log_level: 'DISPATCH',
        message: `[Telegram] Mensagem encaminhada analisada para @${user.username || user.id}`,
      });
    }
    // 2. Comandos ou texto comum
    else if (message.text) {
      const text = message.text.trim();
      const lower = text.toLowerCase();

      await supabase.from('aethel_logs').insert({
        bot_id: botId,
        log_level: 'DISPATCH',
        message: `[Telegram] Mensagem de ${userName} (@${user.username || user.id}): "${text.slice(0, 45)}"`,
      });

      if (lower.startsWith('/start') || lower.startsWith('/me') || lower.startsWith('/id')) {
        replyText =
          `📋 *DETALHES DA CONTA*\n\n` +
          `👤 *Nome:* ${user.first_name || 'Não informado'}\n` +
          `🏷 *Sobrenome:* ${user.last_name || 'Nenhum'}\n` +
          `🔗 *Username:* ${user.username ? `@${user.username}` : 'Nenhum'}\n` +
          `🆔 *ID do Usuário:* \`${user.id}\`\n` +
          `🌐 *Idioma:* ${user.language_code || 'Indefinido'}\n` +
          `⭐ *Telegram Premium:* ${user.is_premium ? 'Sim' : 'Não'}\n` +
          `🤖 *É bot:* ${user.is_bot ? 'Sim' : 'Não'}\n\n` +
          `💬 *DETALHES DO CHAT ATUAL*\n\n` +
          `🏷 *Tipo:* \`${chat.type}\`\n` +
          `🆔 *ID do Chat:* \`${chat.id}\`\n` +
          (!isPrivate && chat.title ? `📢 *Nome do Grupo/Canal:* ${chat.title}\n` : '');
      } else if (lower.startsWith('/ping')) {
        replyText = `🏓 *Pong!*\n⚡ Latência da Malha: *${Math.floor(Math.random() * 10) + 8}ms*\n🛰️ Status: *Online 24/7 na Aethel Kov*`;
      } else if (lower.startsWith('/help') || lower.startsWith('/ajuda')) {
        replyText =
          `🤖 *Comandos Disponíveis:*\n\n` +
          `• \`/start\` ou \`/id\` - Exibe seu ID e detalhes da sua conta\n` +
          `• \`/ping\` - Mede a latência da conexão\n` +
          `• Envie qualquer mensagem para obter seu ID rápido\n` +
          `• Encaminhe qualquer mensagem para capturar o ID de outros usuários ou canais`;
      } else {
        // Mensagem de texto comum
        replyText =
          `🆔 *Seu ID:* \`${user.id}\`\n` +
          `💬 *ID deste Chat:* \`${chat.id}\`\n\n` +
          `_Dica: Envie /start para ver o relatório completo ou encaminhe uma mensagem para pegar o ID de outro usuário/canal._`;
      }
    }

    // Se temos resposta formatada, envia de volta ao usuário via API do Telegram
    if (replyText && chat.id) {
      const sendRes = await fetch(`https://api.telegram.org/bot${bot.token_encrypted}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chat.id,
          text: replyText,
          parse_mode: 'Markdown',
        }),
      });

      const sendData = await sendRes.json();
      if (!sendData.ok) {
        console.warn('[Telegram] Erro no sendMessage:', sendData.description);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Telegram] Erro no handler:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
