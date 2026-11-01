import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const INTERNAL_SECRET = process.env.AETHEL_INTERNAL_SECRET || 'aethel-secret-grid-master-key';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-aethel-secret');
    if (authHeader !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized Access: Invalid Secret' }, { status: 401 });
    }

    const body = await req.json();
    const { botId, token, event, data } = body;

    if (!token) {
      return NextResponse.json({ error: 'Missing bot token' }, { status: 400 });
    }

    // Processamento sob demanda do evento MESSAGE_CREATE vindo do Farol
    if (event === 'MESSAGE_CREATE' && data) {
      const channelId = data.channel_id;
      const content = (data.content || '').trim();
      const author = data.author?.username || 'User';

      // Ignora mensagens de outros bots
      if (data.author?.bot) {
        return NextResponse.json({ status: 'SKIPPED_BOT_AUTHOR' });
      }

      // Log do evento recebido no Supabase
      if (botId) {
        await supabase.from('aethel_logs').insert({
          bot_id: botId,
          log_level: 'DISPATCH',
          message: `[Dispatch] Mensagem de @${author}: "${content.slice(0, 40)}${content.length > 40 ? '...' : ''}"`,
        });
      }

      let replyText: string | null = null;
      const lower = content.toLowerCase();

      // Handlers sob demanda super rápidos (< 50ms)
      if (lower.startsWith('!ping') || lower.startsWith('/ping')) {
        replyText = '🏓 **Pong!** Executado sob demanda via **Aethelkov Serverless Runner** (Zero CPU residual).';
      } else if (lower.includes('aethelkov') || lower.includes('oi tudo bem')) {
        replyText = `⚡ Olá **${author}**! Este bot está hospedado 24/7 na malha distribuída **Aethelkov** a custo R$ 0,00.`;
      } else if (lower.startsWith('!status') || lower.startsWith('!info')) {
        replyText = '🟢 **Status da Instância:** Online 24/7\n🛰️ **Nó Gateway:** Aethel-Farol (Discloud Node)\n⚙️ **Runner:** Vercel Serverless (<50ms execution)';
      }

      // Se houver resposta a enviar, dispara via Discord REST API
      if (replyText && channelId) {
        const discordRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: replyText,
            message_reference: { message_id: data.id },
          }),
        });

        if (!discordRes.ok) {
          const errText = await discordRes.text();
          console.error('[Dispatch] Discord REST error:', errText);
        }
      }
    }

    return NextResponse.json({ status: 'PROCESSED' });
  } catch (error: any) {
    console.error('[Dispatch] Internal error:', error);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}

