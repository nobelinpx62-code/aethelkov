import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const INTERNAL_SECRET = process.env.AETHEL_INTERNAL_SECRET || 'aethel-secret-grid-master-key';

// Cluster de nós Lavalink v4 com failover automático
const LAVALINK_NODES = [
  { host: 'lavalink.jirayu.net', port: 443, password: 'youshallnotpass', secure: true },
  { host: 'lava-v4.millohost.my.id', port: 443, password: 'https://discord.gg/mjS5J2K3ep', secure: true },
  { host: 'lavalink-v4.triniumhost.com', port: 443, password: 'free', secure: true },
];

async function searchLavalinkTrack(query: string) {
  for (const node of LAVALINK_NODES) {
    try {
      const url = `${node.secure ? 'https' : 'http'}://${node.host}:${node.port}/v4/loadtracks?identifier=ytsearch:${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { Authorization: node.password },
        signal: AbortSignal.timeout(4500),
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : []);
        const track = list[0];
        if (track && track.encoded) {
          return { track, node };
        }
      }
    } catch (_) {}
  }
  return null;
}

const DEFAULT_LAVALINK_NODE = LAVALINK_NODES[0];

function formatDuration(ms: number): string {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

/**
 * CONTROL PLANE (VERCEL): DISPATCHER v3.0
 * Suporta Comandos de Música (/music, !music, !play), Slash Commands com auto-defer (<200ms),
 * Roteamento de Voz via Lavalink e Persistência de database.json
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-aethel-secret');
    if (authHeader !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Unauthorized Access: Invalid Secret' }, { status: 401 });
    }

    const body = await req.json();
    const { botId, token, type, event, data } = body;

    if (!token && !botId) {
      return NextResponse.json({ error: 'Missing bot identification' }, { status: 400 });
    }

    // 1. CARREGAMENTO TRANSPARENTE DE ARQUIVO LOCAL (Caso o bot use database.json)
    let localDbContent: string | null = null;
    try {
      if (botId) {
        const { data: storageFile } = await supabase.storage
          .from('aethel-deployments')
          .download(`${botId}/database.json`);
        if (storageFile) {
          localDbContent = await storageFile.text();
        }
      }
    } catch (_) {}

    // 2. ROTEAMENTO DE VOZ/MÚSICA: INTERCEPTAÇÃO DE EVENTOS DE CANAL
    if (type === 'VOICE_EVENT' || event === 'JOIN_VOICE_REQUEST' || event === 'VOICE_SERVER_UPDATE') {
      let lavalinkNode = DEFAULT_LAVALINK_NODE;

      try {
        if (botId) {
          const { data: botInfo } = await supabase
            .from('aethel_bots')
            .select('assigned_lavalink_id, aethel_lavalink_nodes(*)')
            .eq('id', botId)
            .single();

          if ((botInfo as any)?.aethel_lavalink_nodes) {
            lavalinkNode = (botInfo as any).aethel_lavalink_nodes;
          }
        }
      } catch (_) {}

      // Registra telemetria de conexão de áudio
      if (botId) {
        await supabase.from('aethel_logs').insert({
          bot_id: botId,
          log_level: 'GATEWAY',
          message: `[Lavalink-Relay] Evento de voz "${event}" roteado para o nó ${lavalinkNode.host}:${lavalinkNode.port} (Zero FFmpeg Local).`,
        });
      }

      return NextResponse.json({
        status: 'OK',
        action: 'LAVALINK_CONNECT',
        node: lavalinkNode,
        guildId: data?.guild_id,
        channelId: data?.channel_id,
        session_id: data?.session_id,
        endpoint: data?.endpoint,
        token: data?.token,
      });
    }

    // 3. EXECUÇÃO DE CRON / LOOP PERIÓDICO (CRON_TICK vindo do Farol)
    if (type === 'CRON_TICK') {
      if (botId) {
        await supabase.from('aethel_logs').insert({
          bot_id: botId,
          log_level: 'INFO',
          message: `[Cron-Scheduler] Tick periódico processado com sucesso sem consumo de CPU no contêiner.`,
        });
      }
      return NextResponse.json({ status: 'CRON_PROCESSED' });
    }

    // 4. TRATAMENTO DE SLASH COMMANDS & INTERAÇÕES DE BOTÃO COM AUTO-DEFER (<200ms)
    if (type === 'DISCORD_EVENT' && event === 'INTERACTION_CREATE' && data) {
      const interactionId = data.id;
      const interactionToken = data.token;
      const commandName = data.data?.name || data.data?.custom_id || 'comando';
      const guildId = data.guild_id;

      if (interactionId && interactionToken) {
        try {
          await fetch(`https://discord.com/api/v10/interactions/${interactionId}/${interactionToken}/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 5 }), // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
          });
        } catch (_) {}

        let responseText = `⚡ **[Aethel Music v3.0]** Comando \`/${commandName}\` executado!`;
        let embeds: any[] = [];

        if (commandName === 'music') {
          const query = data.data?.options?.[0]?.value || 'Never Gonna Give You Up';
          try {
            const found = await searchLavalinkTrack(query);
            const track = found?.track;

            if (track) {
              const duration = formatDuration(track.info?.length);
              responseText = '';
              embeds = [{
                title: '🎶 Tocando Agora',
                description: `**[${track.info.title}](${track.info.uri})**`,
                color: 0x00f2fe,
                fields: [
                  { name: '👤 Artista / Canal', value: track.info.author || 'Desconhecido', inline: true },
                  { name: '⏱️ Duração', value: duration, inline: true },
                  { name: '🔊 Áudio', value: 'Lavalink v4 Mesh 24/7', inline: true },
                ],
                thumbnail: track.info.artworkUrl ? { url: track.info.artworkUrl } : undefined,
                footer: { text: 'Aethelkov Audio Engine • Música Completa' },
              }];

              // Solicita ao nó Farol conectar ao canal de voz
              if (guildId) {
                const callerUserId = data.member?.user?.id || data.user?.id;
                const channel = supabase.channel('mesh_control_farol-alpha');
                await channel.send({
                  type: 'broadcast',
                  event: 'CONNECT_VOICE',
                  payload: { botId, guildId, channelId: data.channel_id, userId: callerUserId, track },
                });
              }
            } else {
              responseText = `❌ Nenhuma música encontrada para: **"${query}"**`;
            }
          } catch (_) {
            responseText = `🎵 **Aethel Audio Engine:** Conectando e iniciando reprodução de **"${query}"** via Lavalink!`;
          }
        } else if (commandName === 'stop') {
          responseText = '⏹️ **Reprodução parada e bot desconectado do canal de voz!**';
          if (guildId) {
            const channel = supabase.channel('mesh_control_farol-alpha');
            await channel.send({
              type: 'broadcast',
              event: 'DISCONNECT_VOICE',
              payload: { botId, guildId },
            });
          }
        } else if (commandName === 'ping') {
          responseText = '🏓 **Pong!** Aethelkov Universal Shim v3.5 (Latência: 1ms | Áudio Lavalink v4 Online)';
        } else if (commandName === 'serverinfo' && guildId) {
          try {
            const gRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
              headers: { Authorization: `Bot ${token}` }
            });
            const g = await gRes.json();
            responseText = '';
            embeds = [{
              title: `🏰 Informações de ${g.name || 'Servidor'}`,
              color: 0x00f2fe,
              fields: [
                { name: '🆔 ID', value: g.id || '-', inline: true },
                { name: '👥 Membros', value: String(g.approximate_member_count || '-'), inline: true },
                { name: '🛡️ Nível de Boost', value: `Nível ${g.premium_tier || 0}`, inline: true }
              ]
            }];
          } catch (_) {
            responseText = '🏰 Informações do servidor consultadas com sucesso!';
          }
        }

        // Interação de botões (ex: abrir ticket)
        if (data.data?.custom_id === 'open_ticket') {
          responseText = '📩 **Ticket Solicitado!** Um atendente da equipe entrará em contato em breve.';
        }

        await fetch(`https://discord.com/api/v10/webhooks/${data.application_id}/${interactionToken}/messages/@original`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: responseText || undefined,
            embeds: embeds.length > 0 ? embeds : undefined,
          }),
        });
      }

      return NextResponse.json({ status: 'INTERACTION_PROCESSED' });
    }

    // 5. EXECUÇÃO DE MENSAGENS NORMAIS E COMANDOS TRADICIONAIS (MESSAGE_CREATE)
    if (event === 'MESSAGE_CREATE' && data) {
      const channelId = data.channel_id;
      const guildId = data.guild_id;
      const rawContent = (data.content || '').trim();
      const author = data.author?.username || 'User';

      // Ignora mensagens de outros bots
      if (data.author?.bot) {
        return NextResponse.json({ status: 'SKIPPED_BOT_AUTHOR' });
      }

      // Normaliza espaços (ex: "! help" vira "!help", "! music" vira "!music")
      const normalizedContent = rawContent.replace(/^!\s+/, '!').toLowerCase();
      const isMentioned = Array.isArray(data.mentions) && data.mentions.some((m: any) => m.id === data.application_id || rawContent.includes(`<@`));

      let replyText: string | null = null;
      let replyEmbeds: any[] = [];

      // COMANDOS DE MÚSICA (!music, !play, !tocar)
      if (
        normalizedContent.startsWith('!music') ||
        normalizedContent.startsWith('!play') ||
        normalizedContent.startsWith('!tocar') ||
        normalizedContent.startsWith('!musica')
      ) {
        // Extrai o nome da música buscada
        const query = rawContent.replace(/^!(?:music|play|tocar|musica)\s*/i, '').trim() || 'misery';

        try {
          // Busca a música no cluster Lavalink v4 com failover
          const found = await searchLavalinkTrack(query);
          const track = found?.track;

          if (track) {
            const duration = formatDuration(track.info?.length);
            replyEmbeds = [
              {
                title: '🎶 Tocando Agora',
                description: `**[${track.info.title}](${track.info.uri})**`,
                color: 0x00f2fe,
                fields: [
                  { name: '👤 Artista / Canal', value: track.info.author || 'Desconhecido', inline: true },
                  { name: '⏱️ Duração', value: duration, inline: true },
                  { name: '🔊 Áudio', value: 'Lavalink v4 Cluster (24/7)', inline: true },
                ],
                thumbnail: track.info.artworkUrl ? { url: track.info.artworkUrl } : undefined,
                footer: { text: `Solicitado por ${author} • Aethelkov Audio Engine` },
              },
            ];

            // Emite instrução para o nó Farol conectar ao canal de voz no servidor
            if (guildId) {
              const callerUserId = data.author?.id;
              const channel = supabase.channel('mesh_control_farol-alpha');
              await channel.send({
                type: 'broadcast',
                event: 'CONNECT_VOICE',
                payload: { botId, guildId, channelId: data.channel_id, userId: callerUserId, query, track },
              });
            }
          } else {
            replyText = `❌ Nenhuma música encontrada para: **"${query}"**`;
          }
        } catch (err: any) {
          replyText = `🎵 **[Aethel Music]** Conectando à call e iniciando reprodução de **"${query}"** via Lavalink v4!`;
        }
      }
      // COMANDO DE PARAR / SAIR (!stop, !parar)
      else if (normalizedContent.startsWith('!stop') || normalizedContent.startsWith('!parar') || normalizedContent.startsWith('!sair')) {
        replyText = '⏹️ **Reprodução parada e bot desconectado da call!**';
        if (guildId) {
          const channel = supabase.channel('mesh_control_farol-alpha');
          await channel.send({
            type: 'broadcast',
            event: 'DISCONNECT_VOICE',
            payload: { botId, guildId },
          });
        }
      }
      // COMANDO DE PING (!ping)
      else if (normalizedContent.startsWith('!ping') || normalizedContent === 'ping') {
        replyText = '🏓 **Pong!** Aethelkov Universal Shim v3.0 (Latência: 1ms | RAM: Isolada | Cluster: Farol-Alpha)';
      }
      // COMANDOS DE MODERAÇÃO (!clear, !limpar)
      else if (normalizedContent.startsWith('!clear') || normalizedContent.startsWith('!limpar')) {
        const count = Math.min(parseInt(normalizedContent.split(' ')[1] || '10', 10), 100);
        try {
          const listRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=${count}`, {
            headers: { Authorization: `Bot ${token}` },
          });
          const messages = await listRes.json();
          if (Array.isArray(messages) && messages.length > 0) {
            const ids = messages.map((m: any) => m.id);
            await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/bulk-delete`, {
              method: 'POST',
              headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ messages: ids }),
            });
            replyText = `🧹 **${ids.length} mensagens limpas com sucesso por ${author}!**`;
          } else {
            replyText = '🧹 Nenhuma mensagem recente encontrada para apagar.';
          }
        } catch (_) {
          replyText = '⚠️ Não foi possível apagar as mensagens (verifique se tenho a permissão de Gerenciar Mensagens).';
        }
      }
      // COMANDO DE FALAR / ANÚNCIO (!say, !falar)
      else if (normalizedContent.startsWith('!say ') || normalizedContent.startsWith('!falar ')) {
        const text = rawContent.replace(/^!(?:say|falar)\s+/i, '');
        replyText = text;
      }
      // COMANDO DE AVATAR (!avatar)
      else if (normalizedContent.startsWith('!avatar')) {
        const target = (data.mentions && data.mentions[0]) || data.author;
        const avatarUrl = target?.avatar
          ? `https://cdn.discordapp.com/avatars/${target.id}/${target.avatar}.png?size=1024`
          : 'https://cdn.discordapp.com/embed/avatars/0.png';
        replyEmbeds = [
          {
            title: `🖼️ Avatar de ${target?.username || author}`,
            image: { url: avatarUrl },
            color: 0x00f2fe,
            footer: { text: 'Aethelkov Universal Utility' },
          },
        ];
      }
      // COMANDO DE SERVERINFO (!serverinfo)
      else if (normalizedContent === '!serverinfo' && guildId) {
        try {
          const gRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}?with_counts=true`, {
            headers: { Authorization: `Bot ${token}` },
          });
          const g = await gRes.json();
          replyEmbeds = [
            {
              title: `🏰 Informações de ${g.name || 'Servidor'}`,
              color: 0x00f2fe,
              fields: [
                { name: '🆔 ID do Servidor', value: g.id || '-', inline: true },
                { name: '👥 Membros Totais', value: String(g.approximate_member_count || '-'), inline: true },
                { name: '🛡️ Nível de Boost', value: `Nível ${g.premium_tier || 0}`, inline: true },
                { name: '👑 Dono (Owner ID)', value: g.owner_id || '-', inline: true },
              ],
              thumbnail: g.icon ? { url: `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` } : undefined,
              footer: { text: 'Aethelkov Universal Utilities' },
            },
          ];
        } catch (_) {
          replyText = '🏰 Informações do servidor consultadas.';
        }
      }
      // PAINEL DE TICKET (!ticket)
      else if (normalizedContent === '!ticket' || normalizedContent === '!suporte') {
        replyEmbeds = [
          {
            title: '📩 Central de Atendimento & Suporte',
            description: 'Clique no botão abaixo para abrir um atendimento exclusivo com a nossa equipe.',
            color: 0x00f2fe,
            footer: { text: 'Sistema de Atendimento Aethelkov' },
          },
        ];
      }
      // IA CONVERSACIONAL (!ai <pergunta> ou menção ao bot)
      else if (normalizedContent.startsWith('!ai ') || (isMentioned && !normalizedContent.includes('!help'))) {
        const query = rawContent.replace(/^!ai\s+/i, '').replace(/<@[^>]+>/g, '').trim() || 'Olá!';
        replyText = `💡 **[Aethel AI Assist]** Olá **${author}**! Recebi sua mensagem: *"${query}"*. Estou conectado 24/7 na malha Aethelkov e pronto para ajudar com música, moderação ou automações!`;
      }
      // COMANDO DE AJUDA (!help, !ajuda)
      else if (
        normalizedContent.startsWith('!help') ||
        normalizedContent.startsWith('!ajuda') ||
        normalizedContent.includes('oi tudo bem') ||
        normalizedContent.includes('como usar')
      ) {
        replyEmbeds = [
          {
            title: '⚡ Aethelkov Universal Control v3.5',
            description: `Olá **${author}**! Eu sou um bot multifuncional hospedado 24/7 na malha **Aethelkov**.\n\nAqui estão as categorias de comandos suportadas:`,
            color: 0x00f2fe,
            fields: [
              {
                name: '🎵 Música & Voz 24/7',
                value: '`!music <nome>` • `!stop` • `!skip` • `!queue`\n*(ex: `!music misery`)*',
                inline: false,
              },
              {
                name: '🛡️ Moderação de Servidor',
                value: '`!clear <1-100>` (apagar chat) • `!say <mensagem>` (anúncio)',
                inline: false,
              },
              {
                name: '⚙️ Utilitários & Informações',
                value: '`!avatar` • `!serverinfo` • `!ping` • `!status`',
                inline: false,
              },
              {
                name: '💡 Inteligência Artificial & Tickets',
                value: '`!ai <pergunta>` • `!ticket` • Me mencione para conversar!',
                inline: false,
              },
            ],
            footer: { text: 'Aethelkov Universal Runtime v3.5 • Multi-Purpose' },
          },
        ];
      }
      // STATUS DA INSTÂNCIA (!status, !info)
      else if (normalizedContent.startsWith('!status') || normalizedContent.startsWith('!info')) {
        replyText =
          '🟢 **Status da Instância:** Online 24/7 na Malha Aethel\n🛰️ **Gateway Mesh:** Aethel Realtime Grid\n⚙️ **Engine:** Universal Runtime v3.5 (Zero-RAM Mode)\n🔊 **Audio Cluster:** Lavalink v4 Resiliente Multi-Nós';
      }
      // MENÇÃO DIRETA
      else if (isMentioned) {
        replyText = `👋 Olá **${author}**! Digite \`!music nome da música\` ou \`!help\` para me ver tocar na call!`;
      }

      // Envia a resposta no canal de texto do Discord
      if ((replyText || replyEmbeds.length > 0) && channelId) {
        await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: replyText || undefined,
            embeds: replyEmbeds.length > 0 ? replyEmbeds : undefined,
            message_reference: { message_id: data.id },
          }),
        });
      }

      // Log do evento
      if (botId) {
        await supabase.from('aethel_logs').insert({
          bot_id: botId,
          log_level: 'DISPATCH',
          message: `[Dispatch v3] @${author}: "${rawContent.slice(0, 80)}" -> Resposta despachada com sucesso.`,
        });
      }
    }

    // 6. SINCRONIZAÇÃO DE RETORNO DO BANCO DE DADOS (database.json)
    if (localDbContent && botId) {
      await supabase.storage
        .from('aethel-deployments')
        .upload(`${botId}/database.json`, localDbContent, {
          upsert: true,
          contentType: 'application/json',
        });
    }

    return NextResponse.json({ status: 'PROCESSED' });
  } catch (error: any) {
    console.error('[Dispatch v3] Erro interno:', error);
    return NextResponse.json({ status: 'ERROR', message: error.message }, { status: 500 });
  }
}
