/**
 * AETHELKOV CORE v3.0 - AETHEL-FAROL DAEMON (UNIVERSAL MESH & AUDIO RELAY)
 * Runtime de presença ultraleve para execução na Discloud (TYPE=bot)
 * Consumo médio por bot: ~0.8 MB RAM | Zero FFmpeg | Zero Buffering Local
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

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('[FATAL] Variáveis do Supabase ausentes no Farol.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const activeSockets = new Map();
const activeTimers = new Map();
// Rastreia em qual canal de voz o último usuário esteve no servidor: guildId -> channelId
const latestUserVoiceChannel = new Map();
const userVoiceStates = new Map();

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
      const { botId, guildId, channelId, userId } = p.payload;
      console.log(`[${NODE_ID}] Recebido comando CONNECT_VOICE para guild: ${guildId}`);
      const session = activeSockets.get(botId);
      if (session && session.ws.readyState === WebSocket.OPEN) {
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
          session.ws.send(
            JSON.stringify({
              op: 4,
              d: {
                guild_id: guildId,
                channel_id: target,
                self_mute: false,
                self_deaf: true,
              },
            })
          );
          logTelemetry(botId, 'GATEWAY', `[Voice-Connect] Conectando ao canal de voz: ${target}`);
        }
      }
    })
    .on('broadcast', { event: 'DISCONNECT_VOICE' }, (p) => {
      const { botId, guildId } = p.payload;
      console.log(`[${NODE_ID}] Recebido comando DISCONNECT_VOICE para guild: ${guildId}`);
      const session = activeSockets.get(botId);
      if (session && session.ws.readyState === WebSocket.OPEN) {
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
      const payload = JSON.parse(raw.toString());
      const { op, d, s, t } = payload;

      if (s !== null) lastSeq = s;

      // Opcode 10: Hello do Discord com Heartbeat
      if (op === 10) {
        heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 1, d: lastSeq }));
          }
        }, d.heartbeat_interval);

        // Intents calculadas:
        // GUILDS (1) + GUILD_VOICE_STATES (128) + GUILD_MESSAGES (512) + DIRECT_MESSAGES (4096)
        // Se attemptWithoutPrivileged = false, inclui MESSAGE_CONTENT (32768)
        const baseIntents = 1 | 128 | 512 | 4096;
        const finalIntents = attemptWithoutPrivileged ? baseIntents : baseIntents | 32768;

        ws.send(
          JSON.stringify({
            op: 2,
            d: {
              token: token.trim(),
              intents: finalIntents,
              properties: { os: 'linux', browser: 'aethelkov', device: 'aethel-mesh' },
              presence: {
                status: 'online',
                activities: [{ name: '!music <nome> 🎶', type: 2 }],
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
    } catch (err) {
      console.error(`[${NODE_ID}] Erro ao processar mensagem gateway:`, err.message);
    }
  });

  ws.on('close', (code) => {
    clearInterval(heartbeat);
    activeSockets.delete(botId);

    // Se o código for 4014 (Disallowed Intents), faz fallback automático sem privileged intents
    if (code === 4014 && !attemptWithoutPrivileged) {
      logTelemetry(
        botId,
        'WARN',
        `[Fallback de Intents] O bot não tem "Message Content Intent" ativa no portal do Discord. Reconectando em modo compatível...`
      );
      setTimeout(() => connectGateway(botId, token, botName, true), 2000);
      return;
    }

    logTelemetry(botId, 'WARN', `Conexão fechada (${code}). Reconectando em 5 segundos...`);
    setTimeout(() => {
      supabase
        .from('aethel_bots')
        .select('status')
        .eq('id', botId)
        .single()
        .then(({ data }) => {
          if (data && data.status === 'ONLINE') {
            connectGateway(botId, token, botName, attemptWithoutPrivileged);
          }
        });
    }, 5000);
  });

  ws.on('error', (err) => {
    logTelemetry(botId, 'ERROR', `Erro de Socket: ${err.message}`);
    try {
      ws.close();
    } catch (_) {}
  });

  activeSockets.set(botId, { ws, heartbeat, botName, token });
}

function scheduleCron(botId, intervalSec, token) {
  if (activeTimers.has(botId)) {
    clearInterval(activeTimers.get(botId));
    activeTimers.delete(botId);
  }

  const safeInterval = Math.max(intervalSec || 0, 10);

  if (intervalSec && intervalSec >= 10) {
    const timer = setInterval(() => {
      postToVercel({
        botId,
        token,
        type: 'CRON_TICK',
        data: { timestamp: Date.now() },
      });
    }, safeInterval * 1000);

    activeTimers.set(botId, timer);
  }
}

function disconnectGateway(botId) {
  const session = activeSockets.get(botId);
  if (session) {
    clearInterval(session.heartbeat);
    try {
      session.ws.close(1000, 'Killed by Aethel Mesh');
    } catch (_) {}
    activeSockets.delete(botId);
  }

  if (activeTimers.has(botId)) {
    clearInterval(activeTimers.get(botId));
    activeTimers.delete(botId);
  }
}

function postToVercel(data) {
  fetch(VERCEL_DISPATCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-aethel-secret': INTERNAL_SECRET,
    },
    body: JSON.stringify(data),
  }).catch((err) => {
    console.error(`[${NODE_ID}] Erro ao postar na Vercel:`, err.message);
  });
}

async function reportNodeHeartbeat() {
  try {
    const mem = process.memoryUsage();
    const rssMb = parseFloat((mem.rss / 1024 / 1024).toFixed(2));
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

process.on('SIGINT', () => {
  console.log(`[${NODE_ID}] Encerrando nó...`);
  for (const [botId] of activeSockets) {
    disconnectGateway(botId);
  }
  process.exit(0);
});
