/**
 * AETHELKOV CORE v3.0 - AETHEL-FAROL DAEMON (UNIVERSAL MESH & AUDIO RELAY)
 * Runtime de presença ultraleve para execução na Discloud (TYPE=bot)
 * Suporte a Voz Gateway (Opcode 4), GUILD_VOICE_STATES e Áudio Lavalink v4 Integrado
 * Consumo médio: ~20 MB RAM | Zero FFmpeg Local
 */

require('dotenv').config();
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.AETHEL_SUPABASE_URL || 'https://rrxrcxutdzedkqaesdkm.supabase.co';
const SUPABASE_KEY = process.env.AETHEL_SUPABASE_KEY || 'sb_publishable_4Q59J9becXPLLqYWiOob0g_RnLJ2pvB';
const VERCEL_DISPATCH_URL = process.env.AETHEL_DISPATCH_URL || 'https://aethelkov.vercel.app/api/dispatch';
const INTERNAL_SECRET = process.env.AETHEL_INTERNAL_SECRET || 'aethel-secret-grid-master-key';

const NODE_ID = process.env.AETHEL_NODE_ID || 'farol-alpha';
const SHARD_OFFSET = parseInt(process.env.AETHEL_SHARD_OFFSET || '0', 10);
const SHARD_LIMIT = parseInt(process.env.AETHEL_SHARD_LIMIT || '50', 10);

const LAVALINK_NODES = [
  { host: 'lavalink-v4.triniumhost.com', port: 443, pass: 'free', secure: true },
  { host: 'lavalink.serenetia.com', port: 443, pass: 'BatuManaBisa', secure: true },
  { host: 'lava-v4.millohost.my.id', port: 443, pass: 'https://discord.gg/mjS5J2K3ep', secure: true },
  { host: 'lavalink.jirayu.net', port: 443, pass: 'youshallnotpass', secure: true },
];
let activeNodeIdx = 0;

function getActiveLavalinkNode() {
  return LAVALINK_NODES[activeNodeIdx] || LAVALINK_NODES[0];
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[FATAL] Variáveis do Supabase ausentes no Farol.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const activeSockets = new Map();
const activeTimers = new Map();

// Rastreamento de chamadas e membros em canais de voz
const latestUserVoiceChannel = new Map();
const userVoiceStates = new Map();
const voiceStates = new Map(); // guildId -> { token, endpoint, sessionId, channelId }
const pendingTracks = new Map(); // guildId -> track

// Lavalink v4 Client
let lavalinkWs = null;
let lavalinkSessionId = null;

function connectLavalink(botUserId = '1525726396117287073') {
  if (lavalinkWs && (lavalinkWs.readyState === WebSocket.OPEN || lavalinkWs.readyState === WebSocket.CONNECTING)) {
    return;
  }

  const node = getActiveLavalinkNode();
  const wsUrl = `${node.secure ? 'wss' : 'ws'}://${node.host}:${node.port}/v4/websocket`;

  try {
    lavalinkWs = new WebSocket(wsUrl, {
      headers: {
        Authorization: node.pass,
        'User-Id': botUserId,
        'Client-Name': `Aethelkov-Farol/${NODE_ID}`,
      },
    });

    lavalinkWs.on('open', () => {
      console.log(`[${NODE_ID}] Conectado ao cluster de áudio Lavalink v4 (${node.host})`);
      logTelemetry(null, 'GATEWAY', `[Lavalink] Conectado ao nó: ${node.host}`);
    });

    lavalinkWs.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.op === 'ready') {
          lavalinkSessionId = msg.sessionId;
          console.log(`[${NODE_ID}] Sessão Lavalink estabelecida! Session ID: ${lavalinkSessionId}`);
          logTelemetry(null, 'INFO', `[Lavalink] Sessão ativa estabelecida (${msg.sessionId}) no nó ${node.host}`);

          // Se houver guilds com dados de voz já salvos, sincroniza áudio imediatamente
          for (const guildId of voiceStates.keys()) {
            syncLavalinkPlayer(guildId);
          }
        }
      } catch (_) {}
    });

    lavalinkWs.on('close', (code, reason) => {
      console.warn(`[${NODE_ID}] Lavalink desconectado (${code} - ${reason}). Tentando próximo nó...`);
      lavalinkWs = null;
      lavalinkSessionId = null;
      activeNodeIdx = (activeNodeIdx + 1) % LAVALINK_NODES.length;
      setTimeout(() => connectLavalink(botUserId), 3000);
    });

    lavalinkWs.on('error', (err) => {
      console.error(`[${NODE_ID}] Erro Lavalink (${node.host}):`, err.message);
    });
  } catch (err) {
    console.error(`[${NODE_ID}] Falha ao conectar Lavalink:`, err.message);
  }
}

async function syncLavalinkPlayer(guildId) {
  const vs = voiceStates.get(guildId);
  const track = pendingTracks.get(guildId);
  if (!vs || !vs.token || !vs.endpoint || !vs.sessionId || !vs.channelId || !lavalinkSessionId) {
    return;
  }

  const node = getActiveLavalinkNode();
  const httpUrl = `${node.secure ? 'https' : 'http'}://${node.host}:${node.port}`;

  try {
    const payload = {
      voice: {
        token: vs.token,
        endpoint: vs.endpoint,
        sessionId: vs.sessionId,
        channelId: vs.channelId,
      },
      volume: 100,
      paused: false,
    };
    if (track && track.encoded) {
      payload.track = { encoded: track.encoded };
      pendingTracks.delete(guildId);
    }

    const res = await fetch(`${httpUrl}/v4/sessions/${lavalinkSessionId}/players/${guildId}?noReplace=false`, {
      method: 'PATCH',
      headers: {
        Authorization: node.pass,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const resText = await res.text();
    console.log(`[${NODE_ID}] Lavalink Player sincronizado para guild ${guildId} (HTTP ${res.status}): ${resText.slice(0, 100)}`);
    logTelemetry(null, res.ok ? 'GATEWAY' : 'WARNING', `[Lavalink-Player] Sincronização guild ${guildId} -> HTTP ${res.status}`);
  } catch (err) {
    console.error(`[${NODE_ID}] Erro ao sincronizar Lavalink:`, err.message);
  }
}

async function logTelemetry(botId, level, message) {
  const formatted = `[${NODE_ID}] ${message}`;
  console.log(formatted);
  try {
    if (botId) {
      await supabase.from('aethel_logs').insert({
        bot_id: botId,
        log_level: level,
        message: formatted,
      });
    }
  } catch (_) {}
}

async function initMesh() {
  console.log('========================================================');
  console.log(`⚡ [Aethel-Farol v3.0] Inicializando Nó: ${NODE_ID}`);
  console.log(`⚡ [Aethel-Farol v3.0] Shard Range: ${SHARD_OFFSET} a ${SHARD_OFFSET + SHARD_LIMIT - 1}`);
  console.log(`⚡ [Aethel-Farol v3.0] Dispatcher: ${VERCEL_DISPATCH_URL}`);
  console.log('========================================================');

  // Inicializa conexão Lavalink v4
  connectLavalink();

  const { data: bots, error } = await supabase
    .from('aethel_bots')
    .select('id, bot_name, token_encrypted')
    .eq('platform', 'DISCORD')
    .eq('status', 'ONLINE')
    .range(SHARD_OFFSET, SHARD_OFFSET + SHARD_LIMIT - 1);

  if (error) {
    console.error('[Aethel-Farol] Falha ao consultar bots:', error.message);
  } else if (bots && bots.length > 0) {
    console.log(`[Aethel-Farol] Conectando ${bots.length} instâncias alocadas...`);
    bots.forEach((bot) => {
      connectGateway(bot.id, bot.token_encrypted, bot.bot_name);
      scheduleCron(bot.id, 0, bot.token_encrypted);
    });
  } else {
    console.log('[Aethel-Farol] Nenhuma instância aguardando conexão no momento.');
  }

  // Escuta ordens da Vercel / Dashboard em tempo real
  const meshChannel = supabase.channel(`mesh_control_${NODE_ID}`);

  meshChannel
    .on('broadcast', { event: 'SPAWN_BOT' }, (p) => {
      const { botId, token, botName, cronInterval } = p.payload;
      console.log(`[${NODE_ID}] Recebido comando SPAWN_BOT para: ${botName || botId}`);
      connectGateway(botId, token, botName);
      scheduleCron(botId, cronInterval || 0, token);
    })
    .on('broadcast', { event: 'KILL_BOT' }, (p) => {
      const { botId } = p.payload;
      console.log(`[${NODE_ID}] Recebido comando KILL_BOT para: ${botId}`);
      disconnectGateway(botId);
    })
    .on('broadcast', { event: 'CONNECT_VOICE' }, async (p) => {
      const { botId, guildId, channelId, userId, track } = p.payload;
      console.log(`[${NODE_ID}] Recebido comando CONNECT_VOICE para guild: ${guildId}`);
      if (track) pendingTracks.set(guildId, track);

      const session = activeSockets.get(botId);
      if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
        let target = channelId || (userId && userVoiceStates.get(`${guildId}_${userId}`)) || latestUserVoiceChannel.get(guildId) || null;
        if (!target && session.token) {
          try {
            const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
              headers: { Authorization: `Bot ${session.token}` },
            });
            const channels = await res.json();
            const vc = Array.isArray(channels) && channels.find((c) => c.type === 2);
            if (vc) target = vc.id;
          } catch (_) {}
        }
        if (target) {
          latestUserVoiceChannel.set(guildId, target);
          const vs = voiceStates.get(guildId) || {};
          vs.channelId = target;
          voiceStates.set(guildId, vs);

          session.ws.send(
            JSON.stringify({
              op: 4,
              d: {
                guild_id: guildId,
                channel_id: target,
                self_mute: false,
                self_deaf: false,
              },
            })
          );
          logTelemetry(botId, 'GATEWAY', `[Voice-Connect] Conectando ao canal de voz: ${target}`);

          if (vs.token && vs.endpoint && vs.sessionId && vs.channelId) {
            syncLavalinkPlayer(guildId);
          }
        }
      }
    })
    .on('broadcast', { event: 'DISCONNECT_VOICE' }, (p) => {
      const { botId, guildId } = p.payload;
      console.log(`[${NODE_ID}] Recebido comando DISCONNECT_VOICE para guild: ${guildId}`);
      pendingTracks.delete(guildId);
      voiceStates.delete(guildId);
      const session = activeSockets.get(botId);
      if (session && session.ws && session.ws.readyState === WebSocket.OPEN) {
        session.ws.send(
          JSON.stringify({
            op: 4,
            d: {
              guild_id: guildId,
              channel_id: null,
              self_mute: false,
              self_deaf: false,
            },
          })
        );
        logTelemetry(botId, 'GATEWAY', `[Voice-Disconnect] Desconectado da call com sucesso.`);
      }
    })
    .subscribe((status) => {
      console.log(`[${NODE_ID}] Canal Realtime Mesh conectado com status: ${status}`);
    });
}

function connectGateway(botId, token, botName = 'Bot', attemptWithoutPrivileged = false) {
  if (activeSockets.has(botId)) return;
  if (!token) return;

  const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
  let heartbeat = null;
  let lastSeq = null;

  ws.on('open', () => {
    logTelemetry(botId, 'GATEWAY', `Conexão Gateway aberta para o bot: ${botName}`);
  });

  ws.on('message', (raw) => {
    try {
      const { op, d, s, t } = JSON.parse(raw.toString());

      if (s !== null && s !== undefined) {
        lastSeq = s;
      }

      // Opcode 10: Hello -> Iniciar Heartbeat e Identificar
      if (op === 10) {
        const interval = d.heartbeat_interval;
        heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 1, d: lastSeq }));
          }
        }, interval);

        // Intents universais: GUILDS (1) + GUILD_VOICE_STATES (128) + GUILD_MESSAGES (512) + GUILD_MESSAGE_REACTIONS (1024) + DIRECT (4096) + DIRECT_MESSAGE_REACTIONS (8192) + MESSAGE_CONTENT (32768)
        const finalIntents = attemptWithoutPrivileged
          ? 1 | 128 | 512 | 1024 | 4096 | 8192
          : 1 | 128 | 512 | 1024 | 4096 | 8192 | 32768;

        ws.send(
          JSON.stringify({
            op: 2,
            d: {
              token: token.trim(),
              intents: finalIntents,
              properties: {
                os: 'linux',
                browser: 'aethelkov',
                device: 'aethelkov-grid',
              },
              presence: {
                status: 'online',
                activities: [
                  {
                    name: '!music <nome> 🎶',
                    type: 2,
                  },
                ],
              },
            },
          })
        );

        logTelemetry(botId, 'INFO', `Identificado no Gateway com sucesso (Intents: ${finalIntents}). Status verde ativo!`);
      }

      // Opcode 1: Discord solicitando heartbeat imediato
      if (op === 1) {
        ws.send(JSON.stringify({ op: 1, d: lastSeq }));
      }

      // Rastreia onde os membros estão conectados em canais de voz
      if (t === 'GUILD_CREATE' && d && Array.isArray(d.voice_states)) {
        d.voice_states.forEach((vs) => {
          if (vs.user_id && vs.channel_id) {
            userVoiceStates.set(`${d.id}_${vs.user_id}`, vs.channel_id);
            latestUserVoiceChannel.set(d.id, vs.channel_id);
          }
        });
      }

      // Rastreia o canal de voz onde os usuários entram ou saem
      if (t === 'VOICE_STATE_UPDATE' && d) {
        if (d.guild_id && d.channel_id) {
          latestUserVoiceChannel.set(d.guild_id, d.channel_id);
          userVoiceStates.set(`${d.guild_id}_${d.user_id}`, d.channel_id);
        } else if (d.guild_id && d.user_id) {
          userVoiceStates.delete(`${d.guild_id}_${d.user_id}`);
        }

        // Se for o próprio bot conectado na call, atualiza sessionId de voz e sincroniza Lavalink
        const curSession = activeSockets.get(botId);
        if (curSession && curSession.botUserId && d.user_id === curSession.botUserId && d.guild_id) {
          const vs = voiceStates.get(d.guild_id) || {};
          vs.sessionId = d.session_id;
          if (d.channel_id) vs.channelId = d.channel_id;
          voiceStates.set(d.guild_id, vs);
          syncLavalinkPlayer(d.guild_id);
        }

        // Repassa eventos de voz para que a Vercel e o Lavalink coordenem o áudio
        postToVercel({
          botId,
          token,
          type: 'VOICE_EVENT',
          event: t,
          data: d,
        });
      }

      if (t === 'VOICE_SERVER_UPDATE' && d) {
        const vs = voiceStates.get(d.guild_id) || {};
        vs.token = d.token;
        vs.endpoint = d.endpoint;
        voiceStates.set(d.guild_id, vs);
        syncLavalinkPlayer(d.guild_id);

        postToVercel({
          botId,
          token,
          type: 'VOICE_EVENT',
          event: t,
          data: d,
        });
      }

      // Repassa mensagens de chat comuns
      if (t === 'MESSAGE_CREATE' && d && !d.author.bot) {
        postToVercel({
          botId,
          token,
          type: 'DISCORD_EVENT',
          event: 'MESSAGE_CREATE',
          data: d,
        });
      }

      // Repassa Slash Commands e cliques de botão (INTERACTION_CREATE)
      if (t === 'INTERACTION_CREATE' && d) {
        postToVercel({
          botId,
          token,
          type: 'DISCORD_EVENT',
          event: 'INTERACTION_CREATE',
          data: d,
        });
      }

      // Repassa reações de mensagens (Reaction Roles, Tickets, Enquetes)
      if ((t === 'MESSAGE_REACTION_ADD' || t === 'MESSAGE_REACTION_REMOVE') && d) {
        postToVercel({
          botId,
          token,
          type: 'DISCORD_EVENT',
          event: t,
          data: d,
        });
      }

      // Repassa novos membros que entraram no servidor (Boas-vindas / Auto-role)
      if (t === 'GUILD_MEMBER_ADD' && d) {
        postToVercel({
          botId,
          token,
          type: 'DISCORD_EVENT',
          event: t,
          data: d,
        });
      }

      // READY: Captura ID do próprio bot e conecta no Lavalink
      if (t === 'READY' && d && d.user) {
        const curSession = activeSockets.get(botId);
        if (curSession) curSession.botUserId = d.user.id;
        connectLavalink(d.user.id);
      }
    } catch (err) {
      console.error(`[${NODE_ID}] Erro de parsing WebSocket:`, err);
    }
  });

  ws.on('close', (code) => {
    if (heartbeat) clearInterval(heartbeat);
    activeSockets.delete(botId);
    logTelemetry(botId, 'WARNING', `Gateway desconectado (Code: ${code}). Tentando reconectar em 5 segundos...`);

    // Código 4014: Intent não privilegiada bloqueada
    if (code === 4014 && !attemptWithoutPrivileged) {
      console.warn(`[${NODE_ID}] Tentando fallback sem Message Content para bot ${botName}...`);
      setTimeout(() => connectGateway(botId, token, botName, true), 3000);
      return;
    }

    setTimeout(() => connectGateway(botId, token, botName, attemptWithoutPrivileged), 5000);
  });

  ws.on('error', (err) => {
    console.error(`[${NODE_ID}] Erro no WebSocket do Gateway:`, err.message);
  });

  activeSockets.set(botId, { ws, heartbeat, botName, token, botUserId: '1525726396117287073' });
}

function disconnectGateway(botId) {
  const session = activeSockets.get(botId);
  if (session) {
    if (session.heartbeat) clearInterval(session.heartbeat);
    try {
      session.ws.close(1000, 'Killed by Master Dashboard');
    } catch (_) {}
    activeSockets.delete(botId);
  }

  const cronTimer = activeTimers.get(botId);
  if (cronTimer) {
    clearInterval(cronTimer);
    activeTimers.delete(botId);
  }
}

function scheduleCron(botId, intervalSec, token) {
  if (activeTimers.has(botId)) {
    clearInterval(activeTimers.get(botId));
    activeTimers.delete(botId);
  }

  if (!intervalSec || intervalSec <= 0) return;

  const timer = setInterval(() => {
    postToVercel({
      botId,
      token,
      type: 'CRON_TICK',
      data: { timestamp: new Date().toISOString() },
    });
  }, intervalSec * 1000);

  activeTimers.set(botId, timer);
}

async function postToVercel(payload) {
  try {
    const res = await fetch(VERCEL_DISPATCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-aethel-secret': INTERNAL_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[${NODE_ID}] Resposta não-OK da Vercel: ${res.status}`);
    }
  } catch (err) {
    console.error(`[${NODE_ID}] Falha de rede ao despachar para Vercel:`, err.message);
  }
}

async function reportNodeHeartbeat() {
  try {
    const memory = process.memoryUsage();
    const rssMb = parseFloat((memory.rss / 1024 / 1024).toFixed(2));

    const payload = {
      nodeId: NODE_ID,
      status: 'ONLINE',
      ramUsedMb: rssMb,
      ramTotalMb: 100,
      shardOffset: SHARD_OFFSET,
      shardLimit: SHARD_LIMIT,
      activeBots: activeSockets.size,
      uptimeSec: Math.floor(process.uptime()),
      version: 'v3.0-universal',
      hasVoiceSupport: true,
      hasLavalinkRelay: true,
      timestamp: new Date().toISOString(),
    };

    await supabase.from('aethel_logs').insert({
      log_level: 'GATEWAY',
      message: `[NODE_HEARTBEAT] ${JSON.stringify(payload)}`,
    });
  } catch (_) {}
}

initMesh();
reportNodeHeartbeat();
setInterval(reportNodeHeartbeat, 15000);
