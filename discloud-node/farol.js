/**
 * AETHELKOV CORE - AETHEL-FAROL DAEMON
 * Runtime de presença ultraleve para execução na Discloud (TYPE=bot)
 * Sem dependência de discord.js | Zero Memory Cache (~1 MB RAM / bot)
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
const activeSessions = new Map();

async function logTelemetry(botId, level, message) {
  const formatted = `[${NODE_ID}] ${message}`;
  console.log(formatted);
  try {
    if (botId) {
      await supabase.from('aethel_logs').insert({
        bot_id: botId,
        log_level: level,
        message: formatted
      });
    }
  } catch (err) {
    // Falha silenciosa de telemetria para não sobrecarregar
  }
}

async function initMesh() {
  console.log('========================================================');
  console.log(`⚡ [Aethel-Farol] Inicializando Nó: ${NODE_ID}`);
  console.log(`⚡ [Aethel-Farol] Shard Range: ${SHARD_OFFSET} a ${SHARD_OFFSET + SHARD_LIMIT - 1}`);
  console.log(`⚡ [Aethel-Farol] Dispatcher: ${VERCEL_DISPATCH_URL}`);
  console.log('========================================================');

  // Busca bots do Shard atribuído a este nó
  const { data: bots, error } = await supabase
    .from('aethel_bots')
    .select('id, bot_name, token_encrypted')
    .eq('platform', 'DISCORD')
    .eq('status', 'ONLINE')
    .range(SHARD_OFFSET, SHARD_OFFSET + SHARD_LIMIT - 1);

  if (error) {
    console.error('[Aethel-Farol] Erro no bootstrap de bots:', error.message);
  } else if (bots && bots.length > 0) {
    console.log(`[Aethel-Farol] Conectando ${bots.length} instâncias alocadas...`);
    bots.forEach(bot => spawnPresenceSocket(bot.id, bot.token_encrypted, bot.bot_name));
  } else {
    console.log('[Aethel-Farol] Nenhuma instância aguardando conexão no momento.');
  }

  // Canal Realtime para comandos instantâneos via Supabase Realtime
  const meshChannel = supabase.channel(`mesh_control_${NODE_ID}`);

  meshChannel
    .on('broadcast', { event: 'SPAWN_BOT' }, payload => {
      const { botId, token, botName } = payload.payload;
      console.log(`[${NODE_ID}] Recebido comando SPAWN_BOT para: ${botName || botId}`);
      spawnPresenceSocket(botId, token, botName);
    })
    .on('broadcast', { event: 'KILL_BOT' }, payload => {
      const { botId } = payload.payload;
      console.log(`[${NODE_ID}] Recebido comando KILL_BOT para: ${botId}`);
      killPresenceSocket(botId);
    })
    .subscribe((status) => {
      console.log(`[${NODE_ID}] Canal Realtime Mesh conectado com status: ${status}`);
    });
}

function spawnPresenceSocket(botId, token, botName = 'Bot') {
  if (activeSessions.has(botId)) {
    console.log(`[${NODE_ID}] Bot ${botName} (${botId}) já está ativo.`);
    return;
  }

  if (!token) {
    console.error(`[${NODE_ID}] Token ausente para o bot: ${botId}`);
    return;
  }

  // JSON puro sem compressão zlib para economizar memória na Discloud
  const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
  let heartbeatTimer = null;
  let lastSequence = null;
  let isConnected = false;

  ws.on('open', () => {
    logTelemetry(botId, 'GATEWAY', `Conexão Gateway aberta para o bot: ${botName}`);
  });

  ws.on('message', (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      const { op, d, s, t } = message;

      if (s !== null) lastSequence = s;

      // Opcode 10: Hello do Discord com Heartbeat Interval
      if (op === 10) {
        isConnected = true;
        const interval = d.heartbeat_interval;

        // Inicia batimento cardíaco com Opcode 1
        heartbeatTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ op: 1, d: lastSequence }));
          }
        }, interval);

        // Opcode 2: Identity (Acende o status verde sem carregar caches na RAM)
        ws.send(JSON.stringify({
          op: 2,
          d: {
            token: token.trim(),
            intents: 513, // GUILDS (1) + GUILD_MESSAGES (512)
            properties: {
              os: 'linux',
              browser: 'aethelkov',
              device: 'aethelkov-grid'
            },
            presence: {
              status: 'online',
              activities: [{ name: 'Aethelkov Grid 24/7', type: 0 }]
            }
          }
        }));

        logTelemetry(botId, 'INFO', `Identificado com sucesso no Gateway (Heartbeat: ${interval}ms)`);
      }

      // Opcode 11: Heartbeat ACK do Discord
      if (op === 11) {
        // Heartbeat reconhecido com sucesso
      }

      // Opcode 1: Discord solicitando heartbeat imediato
      if (op === 1) {
        ws.send(JSON.stringify({ op: 1, d: lastSequence }));
      }

      // Opcode 7 ou 9: Reconnect ou Invalid Session
      if (op === 7 || op === 9) {
        console.warn(`[${NODE_ID}] Reconnect solicitado pelo Discord (Opcode ${op}).`);
        ws.close();
      }

      // Evento MESSAGE_CREATE: repassa para o runner serverless na Vercel
      if (t === 'MESSAGE_CREATE' && d && !d.author.bot) {
        dispatchToVercel({
          botId,
          token,
          event: 'MESSAGE_CREATE',
          data: d
        });
      }
    } catch (err) {
      console.error(`[${NODE_ID}] Erro de parsing de pacote:`, err.message);
    }
  });

  ws.on('close', (code) => {
    clearInterval(heartbeatTimer);
    activeSessions.delete(botId);
    logTelemetry(botId, 'WARN', `Conexão encerrada (Código ${code}). Reconectando em 5 segundos...`);
    
    // Auto-reconexão resiliente
    setTimeout(() => {
      // Verifica se o bot ainda está marcado como ONLINE no Supabase
      supabase
        .from('aethel_bots')
        .select('status')
        .eq('id', botId)
        .single()
        .then(({ data }) => {
          if (data && data.status === 'ONLINE') {
            spawnPresenceSocket(botId, token, botName);
          }
        });
    }, 5000);
  });

  ws.on('error', (err) => {
    logTelemetry(botId, 'ERROR', `Erro de Socket: ${err.message}`);
    try { ws.close(); } catch (_) {}
  });

  activeSessions.set(botId, { ws, timer: heartbeatTimer, botName });
}

function killPresenceSocket(botId) {
  const session = activeSessions.get(botId);
  if (session) {
    clearInterval(session.timer);
    try {
      session.ws.close(1000, 'Killed by Aethelkov Mesh');
    } catch (_) {}
    activeSessions.delete(botId);
    logTelemetry(botId, 'INFO', `Instância desconectada com sucesso.`);
  }
}

function dispatchToVercel(payload) {
  fetch(VERCEL_DISPATCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-aethel-secret': INTERNAL_SECRET
    },
    body: JSON.stringify(payload)
  }).catch(err => {
    console.error(`[${NODE_ID}] Falha ao despachar evento para Vercel:`, err.message);
  });
}

// Tratamento de sinais do processo
process.on('SIGINT', () => {
  console.log(`[${NODE_ID}] Encerrando nó...`);
  for (const [botId] of activeSessions) {
    killPresenceSocket(botId);
  }
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error(`[${NODE_ID}] Uncaught Exception:`, err);
});

initMesh();

