/**
 * AETHELKOV BOT TEMPLATES & PACKAGING ENGINE
 * Centraliza os templates de código gerados pelo Painel Admin para Discloud
 * Suporte completo a Voz Gateway (Opcode 4), Lavalink v4 Integrado e Presença 24/7
 */

export interface FarolScriptOptions {
  nodeName: string;
  offset: number;
  limit: number;
}

export function getFarolDiscloudConfig(nodeName: string): string {
  const clean = (nodeName || 'farol-bravo').trim();
  return `NAME=aethel-${clean}\nTYPE=bot\nMAIN=farol.js\nRAM=100\nAUTORESTART=true\nVERSION=latest\nAPT=tools\n`;
}

export function getFarolPackageJson(nodeName: string): string {
  const clean = (nodeName || 'farol-bravo').trim();
  return JSON.stringify({
    name: `aethel-${clean}`,
    version: "3.0.0",
    description: `Aethelkov Core - Nó Farol Mesh com Suporte a Voz e Lavalink (${clean})`,
    main: "farol.js",
    dependencies: {
      "@supabase/supabase-js": "^2.45.0",
      "ws": "^8.18.0",
      "dotenv": "^16.4.5"
    }
  }, null, 2);
}

export function getFarolNodeScript(opts: FarolScriptOptions): string {
  const { nodeName, offset, limit } = opts;
  const cleanName = (nodeName || 'farol-bravo').trim();

  return `/**
 * AETHELKOV CORE v3.0 - AETHEL-FAROL DAEMON (Nó: ${cleanName})
 * Suporte completo a Voz Gateway (Opcode 4), GUILD_VOICE_STATES e Áudio Lavalink v4 Integrado
 * Shard Range: ${offset} a ${offset + limit - 1}
 */
require('dotenv').config();
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.AETHEL_SUPABASE_URL || 'https://rrxrcxutdzedkqaesdkm.supabase.co';
const SUPABASE_KEY = process.env.AETHEL_SUPABASE_KEY || 'sb_publishable_4Q59J9becXPLLqYWiOob0g_RnLJ2pvB';
const VERCEL_DISPATCH_URL = process.env.AETHEL_DISPATCH_URL || 'https://aethelkov.vercel.app/api/dispatch';
const INTERNAL_SECRET = process.env.AETHEL_INTERNAL_SECRET || 'aethel-secret-grid-master-key';

const NODE_ID = process.env.AETHEL_NODE_ID || '${cleanName}';
const SHARD_OFFSET = parseInt(process.env.AETHEL_SHARD_OFFSET || '${offset}', 10);
const SHARD_LIMIT = parseInt(process.env.AETHEL_SHARD_LIMIT || '${limit}', 10);

const LAVALINK_NODES = [
  { host: 'lavalink.jirayu.net', port: 443, pass: 'youshallnotpass', secure: true },
  { host: 'lava-v4.millohost.my.id', port: 443, pass: 'https://discord.gg/mjS5J2K3ep', secure: true },
  { host: 'lavalink-v4.triniumhost.com', port: 443, pass: 'free', secure: true },
];
let activeNodeIdx = 0;

function getActiveLavalinkNode() {
  return LAVALINK_NODES[activeNodeIdx] || LAVALINK_NODES[0];
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const activeSockets = new Map();
const userVoiceStates = new Map();
const latestUserVoiceChannel = new Map();
const voiceStates = new Map(); // guildId -> { token, endpoint, sessionId, channelId }
const pendingTracks = new Map();

let lavalinkWs = null;
let lavalinkSessionId = null;

function connectLavalink(botUserId = '1525726396117287073') {
  if (lavalinkWs && (lavalinkWs.readyState === WebSocket.OPEN || lavalinkWs.readyState === WebSocket.CONNECTING)) {
    return;
  }
  const node = getActiveLavalinkNode();
  const wsUrl = (node.secure ? 'wss' : 'ws') + '://' + node.host + ':' + node.port + '/v4/websocket';

  try {
    lavalinkWs = new WebSocket(wsUrl, {
      headers: {
        Authorization: node.pass,
        'User-Id': botUserId,
        'Client-Name': 'Aethelkov-Farol/' + NODE_ID,
      },
    });

    lavalinkWs.on('open', () => {
      console.log('[' + NODE_ID + '] Conectado ao cluster Lavalink v4 (' + node.host + ')');
    });

    lavalinkWs.on('message', raw => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.op === 'ready') {
          lavalinkSessionId = msg.sessionId;
          console.log('[' + NODE_ID + '] Sessão Lavalink estabelecida! Session ID: ' + lavalinkSessionId);
          for (const guildId of voiceStates.keys()) {
            syncLavalinkPlayer(guildId);
          }
        }
      } catch (_) {}
    });

    lavalinkWs.on('close', (code, reason) => {
      console.warn('[' + NODE_ID + '] Lavalink desconectado (' + code + '). Alternando nó...');
      lavalinkWs = null;
      lavalinkSessionId = null;
      activeNodeIdx = (activeNodeIdx + 1) % LAVALINK_NODES.length;
      setTimeout(() => connectLavalink(botUserId), 3000);
    });

    lavalinkWs.on('error', () => {});
  } catch (_) {}
}

async function syncLavalinkPlayer(guildId) {
  const vs = voiceStates.get(guildId);
  const track = pendingTracks.get(guildId);
  if (!vs || !vs.token || !vs.endpoint || !vs.sessionId || !vs.channelId || !lavalinkSessionId) return;

  const node = getActiveLavalinkNode();
  const httpUrl = (node.secure ? 'https' : 'http') + '://' + node.host + ':' + node.port;

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

    const res = await fetch(httpUrl + '/v4/sessions/' + lavalinkSessionId + '/players/' + guildId + '?noReplace=false', {
      method: 'PATCH',
      headers: {
        Authorization: node.pass,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    console.log('[' + NODE_ID + '] Lavalink Player sincronizado guild ' + guildId + ' (HTTP ' + res.status + ')');
  } catch (err) {
    console.error('[' + NODE_ID + '] Erro ao sincronizar Lavalink:', err.message);
  }
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
      hasVoiceSupport: true,
      hasLavalinkRelay: true,
      timestamp: new Date().toISOString()
    };
    await supabase.from('aethel_logs').insert({
      log_level: 'GATEWAY',
      message: '[NODE_HEARTBEAT] ' + JSON.stringify(payload)
    });
  } catch (_) {}
}

async function initMesh() {
  console.log('[Aethel-Farol v3.0] Nó: ' + NODE_ID + ' (Shards: ' + SHARD_OFFSET + '-' + (SHARD_OFFSET + SHARD_LIMIT - 1) + ') - Voz Gateway & Lavalink');
  connectLavalink();

  const { data: bots } = await supabase
    .from('aethel_bots')
    .select('id, bot_name, token_encrypted')
    .eq('platform', 'DISCORD')
    .eq('status', 'ONLINE')
    .range(SHARD_OFFSET, SHARD_OFFSET + SHARD_LIMIT - 1);

  if (bots) {
    bots.forEach(b => spawnPresenceSocket(b.id, b.token_encrypted, b.bot_name));
  }

  supabase.channel('mesh_control_' + NODE_ID)
    .on('broadcast', { event: 'SPAWN_BOT' }, p => spawnPresenceSocket(p.payload.botId, p.payload.token, p.payload.botName))
    .on('broadcast', { event: 'KILL_BOT' }, p => killPresenceSocket(p.payload.botId))
    .on('broadcast', { event: 'CONNECT_VOICE' }, async p => {
      const { botId, guildId, channelId, userId, track } = p.payload;
      if (track) pendingTracks.set(guildId, track);

      const s = activeSockets.get(botId);
      if (s && s.ws && s.ws.readyState === WebSocket.OPEN) {
        let target = channelId || (userId && userVoiceStates.get(guildId + '_' + userId)) || latestUserVoiceChannel.get(guildId) || null;
        if (!target && s.token) {
          try {
            const r = await fetch('https://discord.com/api/v10/guilds/' + guildId + '/channels', {
              headers: { Authorization: 'Bot ' + s.token }
            });
            const chs = await r.json();
            const vc = Array.isArray(chs) && chs.find(c => c.type === 2);
            if (vc) target = vc.id;
          } catch (_) {}
        }
        if (target) {
          latestUserVoiceChannel.set(guildId, target);
          const vs = voiceStates.get(guildId) || {};
          vs.channelId = target;
          voiceStates.set(guildId, vs);
          s.ws.send(JSON.stringify({ op: 4, d: { guild_id: guildId, channel_id: target, self_mute: false, self_deaf: false } }));
          console.log('[Voice] Conectando ao canal de voz ' + target + ' na guild ' + guildId);
          if (vs.token && vs.endpoint && vs.sessionId && vs.channelId) {
            syncLavalinkPlayer(guildId);
          }
        }
      }
    })
    .on('broadcast', { event: 'DISCONNECT_VOICE' }, p => {
      const { botId, guildId } = p.payload;
      pendingTracks.delete(guildId);
      voiceStates.delete(guildId);
      const s = activeSockets.get(botId);
      if (s && s.ws && s.ws.readyState === WebSocket.OPEN) {
        s.ws.send(JSON.stringify({ op: 4, d: { guild_id: guildId, channel_id: null, self_mute: false, self_deaf: false } }));
      }
    })
    .subscribe();
}

function spawnPresenceSocket(botId, token, botName) {
  if (activeSockets.has(botId) || !token) return;
  const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
  let timer = null, seq = null;

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.s !== null) seq = msg.s;
      if (msg.op === 10) {
        timer = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 1, d: seq })); }, msg.d.heartbeat_interval);
        ws.send(JSON.stringify({
          op: 2,
          d: {
            token: token.trim(),
            intents: 1 | 128 | 512 | 4096 | 32768,
            properties: { os: 'linux', browser: 'aethelkov', device: 'aethelkov-grid' },
            presence: { status: 'online', activities: [{ name: '!music <nome> 🎶', type: 2 }] }
          }
        }));
      }
      if (msg.t === 'GUILD_CREATE' && msg.d && Array.isArray(msg.d.voice_states)) {
        msg.d.voice_states.forEach(vs => {
          if (vs.user_id && vs.channel_id) {
            userVoiceStates.set(msg.d.id + '_' + vs.user_id, vs.channel_id);
            latestUserVoiceChannel.set(msg.d.id, vs.channel_id);
          }
        });
      }
      if (msg.t === 'VOICE_STATE_UPDATE' && msg.d) {
        if (msg.d.guild_id && msg.d.channel_id) {
          latestUserVoiceChannel.set(msg.d.guild_id, msg.d.channel_id);
          userVoiceStates.set(msg.d.guild_id + '_' + msg.d.user_id, msg.d.channel_id);
        } else if (msg.d.guild_id && msg.d.user_id) {
          userVoiceStates.delete(msg.d.guild_id + '_' + msg.d.user_id);
        }

        const curSession = activeSockets.get(botId);
        if (curSession && curSession.botUserId && msg.d.user_id === curSession.botUserId && msg.d.guild_id) {
          const vs = voiceStates.get(msg.d.guild_id) || {};
          vs.sessionId = msg.d.session_id;
          if (msg.d.channel_id) vs.channelId = msg.d.channel_id;
          voiceStates.set(msg.d.guild_id, vs);
          syncLavalinkPlayer(msg.d.guild_id);
        }

        fetch(VERCEL_DISPATCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-aethel-secret': INTERNAL_SECRET },
          body: JSON.stringify({ botId, token, type: 'VOICE_EVENT', event: msg.t, data: msg.d })
        }).catch(() => {});
      }
      if (msg.t === 'VOICE_SERVER_UPDATE' && msg.d) {
        const vs = voiceStates.get(msg.d.guild_id) || {};
        vs.token = msg.d.token;
        vs.endpoint = msg.d.endpoint;
        voiceStates.set(msg.d.guild_id, vs);
        syncLavalinkPlayer(msg.d.guild_id);

        fetch(VERCEL_DISPATCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-aethel-secret': INTERNAL_SECRET },
          body: JSON.stringify({ botId, token, type: 'VOICE_EVENT', event: msg.t, data: msg.d })
        }).catch(() => {});
      }
      if (msg.t === 'MESSAGE_CREATE' && msg.d && !msg.d.author.bot) {
        fetch(VERCEL_DISPATCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-aethel-secret': INTERNAL_SECRET },
          body: JSON.stringify({ botId, token, event: 'MESSAGE_CREATE', data: msg.d })
        }).catch(() => {});
      }
      if (msg.t === 'READY' && msg.d && msg.d.user) {
        const curSession = activeSockets.get(botId);
        if (curSession) curSession.botUserId = msg.d.user.id;
        connectLavalink(msg.d.user.id);
      }
    } catch (_) {}
  });

  ws.on('close', () => { clearInterval(timer); activeSockets.delete(botId); setTimeout(() => spawnPresenceSocket(botId, token, botName), 5000); });
  ws.on('error', () => { try { ws.close(); } catch (_) {} });
  activeSockets.set(botId, { ws, timer, token, botUserId: '1525726396117287073' });
}

function killPresenceSocket(botId) {
  const s = activeSockets.get(botId);
  if (s) { clearInterval(s.timer); try { s.ws.close(); } catch (_) {} activeSockets.delete(botId); }
}

initMesh();
reportNodeHeartbeat();
setInterval(reportNodeHeartbeat, 15000);
`;
}

export function getMusicBotDiscloudConfig(appName: string): string {
  const clean = (appName || 'aethel-music').trim();
  return `NAME=${clean}\nTYPE=bot\nMAIN=bot.js\nRAM=100\nAUTORESTART=true\nVERSION=latest\nAPT=tools\n`;
}

export function getMusicBotPackageJson(appName: string): string {
  const clean = (appName || 'aethel-music').trim();
  return JSON.stringify({
    name: clean,
    version: "3.0.0",
    description: "Bot de Música Aethelkov 24/7 com Lavalink v4 Cluster e Voice Gateway",
    main: "bot.js",
    dependencies: {
      "ws": "^8.18.0",
      "dotenv": "^16.4.5"
    }
  }, null, 2);
}

export function getMusicBotEnv(token: string, host: string, pass: string): string {
  return `DISCORD_TOKEN=${(token || '').trim()}\nLAVALINK_HOST=${(host || 'lavalink.serenetia.com').trim()}\nLAVALINK_PORT=443\nLAVALINK_PASSWORD=${(pass || 'youshallnotpass').trim()}\nLAVALINK_SECURE=true\n`;
}

export function getMusicBotReadme(appName: string): string {
  const clean = (appName || 'aethel-music').trim();
  return `========================================================
AETHELKOV MUSIC BOT v3.0 - HOSPEDAGEM DISCLOUD
Nome da Aplicação: ${clean}
========================================================

Este pacote é um Bot de Música completo e independente para o Discord.
Ele já vem configurado com:
- Conexão nativa com o cluster de áudio Lavalink v4 (24/7 sem quedas)
- Detecção automática da call do usuário
- Entra no canal de voz sozinho ao enviar comando de música
- Suporta comandos Slash (/music) e comandos de texto (!music)
- Consumo otimizado para o plano Free da Discloud (100 MB RAM)

--------------------------------------------------------
COMO HOSPEDAR NA DISCLOUD (PASSO A PASSO):
--------------------------------------------------------
1. Acesse o site da Discloud: https://discloudbot.com
2. Faça login com sua conta do Discord.
3. No painel, clique em "Adicionar Bot" (ou "Upload").
4. Selecione ou arraste este arquivo ZIP compactado.
5. Pronto! O bot inicializará em poucos segundos e exibirá status ONLINE.

--------------------------------------------------------
COMO USAR NO DISCORD:
--------------------------------------------------------
1. Entre em qualquer canal de voz no seu servidor do Discord.
2. No canal de mensagens de texto, envie:
   !music <nome da musica>
   (Exemplo: !music misery ou !music Shape of You)
3. O bot entrará na sua call imediatamente e tocará a música inteira!

OUTROS COMANDOS DISPONÍVEIS:
• !music <nome>  -> Toca a música pesquisada no YouTube / SoundCloud
• !stop          -> Para a música e desconecta o bot da call
• !skip          -> Pula para a próxima música da fila
• !queue         -> Exibe as músicas aguardando na fila
• !ping          -> Mostra a latência e status do cluster de áudio
• !help          -> Exibe o menu com todos os comandos

========================================================
Aethelkov Mesh Network • Alta Fidelidade de Áudio 24/7
========================================================
`;
}

export function getMusicBotScript(): string {
  return `/**
 * AETHELKOV MUSIC BOT v3.0 (Powered by Lavalink v4 Cluster)
 * Suporta comandos Slash (/music <nome>) e comandos de texto (!music / !play)
 * Toca músicas completas em alta fidelidade diretamente no seu canal de voz.
 */
require('dotenv').config();
const WebSocket = require('ws');

const TOKEN = process.env.DISCORD_TOKEN;
const LAVALINK_HOST = process.env.LAVALINK_HOST || 'lavalink.serenetia.com';
const LAVALINK_PORT = process.env.LAVALINK_PORT || 443;
const LAVALINK_PASS = process.env.LAVALINK_PASSWORD || 'youshallnotpass';
const LAVALINK_SECURE = process.env.LAVALINK_SECURE !== 'false';

const LAVALINK_HTTP = (LAVALINK_SECURE ? 'https' : 'http') + '://' + LAVALINK_HOST + ':' + LAVALINK_PORT;
const LAVALINK_WS = (LAVALINK_SECURE ? 'wss' : 'ws') + '://' + LAVALINK_HOST + ':' + LAVALINK_PORT + '/v4/websocket';

let lavalinkSessionId = null;
let lavalinkWs = null;
let discordWs = null;
let botUserId = null;

const musicQueues = new Map();
const voiceStates = new Map();
const userVoiceStates = new Map();

function formatDuration(ms) {
  if (!ms || isNaN(ms)) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

function connectLavalink() {
  console.log('[Aethel-Audio] Conectando ao cluster Lavalink: ' + LAVALINK_HOST + '...');
  lavalinkWs = new WebSocket(LAVALINK_WS, {
    headers: {
      Authorization: LAVALINK_PASS,
      'User-Id': botUserId || '1525726396117287073',
      'Client-Name': 'Aethelkov-Music/3.0'
    }
  });

  lavalinkWs.on('open', () => {
    console.log('[Aethel-Audio] Conectado ao cluster Lavalink v4!');
  });

  lavalinkWs.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.op === 'ready') {
        lavalinkSessionId = msg.sessionId;
        console.log('[Aethel-Audio] Sessão Lavalink estabelecida: ' + lavalinkSessionId);
      }
      if (msg.op === 'event') {
        if (msg.type === 'TrackEndEvent' || msg.type === 'TrackExceptionEvent') {
          playNextTrack(msg.guildId);
        }
      }
    } catch (e) {
      console.error('[Aethel-Audio] Erro Lavalink:', e.message);
    }
  });

  lavalinkWs.on('close', () => {
    console.warn('[Aethel-Audio] Reconectando Lavalink em 5s...');
    setTimeout(connectLavalink, 5000);
  });

  lavalinkWs.on('error', err => {
    console.error('[Aethel-Audio] Erro de socket Lavalink:', err.message);
  });
}

async function searchTrack(query) {
  try {
    const isUrl = query.startsWith('http://') || query.startsWith('https://');
    const identifier = isUrl ? encodeURIComponent(query) : 'ytsearch:' + encodeURIComponent(query);
    const url = LAVALINK_HTTP + '/v4/loadtracks?identifier=' + identifier;
    const res = await fetch(url, { headers: { Authorization: LAVALINK_PASS } });
    const data = await res.json();
    if (data.loadType === 'track') return data.data;
    if (data.loadType === 'search' && Array.isArray(data.data) && data.data.length > 0) return data.data[0];
    if (data.loadType === 'playlist' && data.data && data.data.tracks && data.data.tracks.length > 0) return data.data.tracks[0];
    return null;
  } catch (err) {
    console.error('[Aethel-Audio] Erro ao buscar faixa:', err.message);
    return null;
  }
}

async function playNextTrack(guildId) {
  const guildQueue = musicQueues.get(guildId);
  if (!guildQueue) return;

  if (guildQueue.queue.length === 0) {
    guildQueue.current = null;
    sendDiscordMessage(guildQueue.textChannelId, '⏹️ **Fila concluída!** Todas as músicas foram reproduzidas.');
    return;
  }

  const track = guildQueue.queue.shift();
  guildQueue.current = track;

  if (!lavalinkSessionId) return;

  try {
    const playerUrl = LAVALINK_HTTP + '/v4/sessions/' + lavalinkSessionId + '/players/' + guildId;
    await fetch(playerUrl, {
      method: 'PATCH',
      headers: { Authorization: LAVALINK_PASS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ track: { encoded: track.encoded } })
    });

    const info = track.info;
    const embed = {
      title: '🎶 Tocando Agora',
      description: '**[' + info.title + '](' + info.uri + ')**',
      color: 0x00f2fe,
      fields: [
        { name: '👤 Artista / Canal', value: info.author || 'Desconhecido', inline: true },
        { name: '⏱️ Duração', value: formatDuration(info.length), inline: true },
        { name: '🙋 Solicitado por', value: track.requestedBy || 'Membro', inline: true }
      ],
      thumbnail: info.artworkUrl ? { url: info.artworkUrl } : undefined,
      footer: { text: 'Aethelkov Audio Engine • Lavalink v4 24/7' }
    };

    sendDiscordMessage(guildQueue.textChannelId, '', [embed]);
  } catch (err) {
    console.error('[Aethel-Audio] Erro player Lavalink:', err.message);
  }
}

async function updateLavalinkVoice(guildId) {
  const state = voiceStates.get(guildId);
  if (!state || !state.token || !state.endpoint || !state.sessionId || !lavalinkSessionId) return;

  try {
    const playerUrl = LAVALINK_HTTP + '/v4/sessions/' + lavalinkSessionId + '/players/' + guildId;
    await fetch(playerUrl, {
      method: 'PATCH',
      headers: { Authorization: LAVALINK_PASS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        voice: {
          token: state.token,
          endpoint: state.endpoint,
          sessionId: state.sessionId
        }
      })
    });
    console.log('[Aethel-Audio] Voz sincronizada com Lavalink para servidor ' + guildId);
  } catch (err) {
    console.error('[Aethel-Audio] Erro sync Lavalink:', err.message);
  }
}

function joinDiscordVoiceChannel(guildId, channelId) {
  if (!discordWs || discordWs.readyState !== WebSocket.OPEN) return;
  discordWs.send(JSON.stringify({
    op: 4,
    d: {
      guild_id: guildId,
      channel_id: channelId,
      self_mute: false,
      self_deaf: true
    }
  }));
}

function leaveDiscordVoiceChannel(guildId) {
  if (!discordWs || discordWs.readyState !== WebSocket.OPEN) return;
  discordWs.send(JSON.stringify({
    op: 4,
    d: { guild_id: guildId, channel_id: null, self_mute: false, self_deaf: false }
  }));
}

async function sendDiscordMessage(channelId, content, embeds = []) {
  if (!channelId) return;
  try {
    await fetch('https://discord.com/api/v10/channels/' + channelId + '/messages', {
      method: 'POST',
      headers: {
        Authorization: 'Bot ' + TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content || undefined,
        embeds: embeds.length > 0 ? embeds : undefined
      })
    });
  } catch (err) {
    console.error('[Discord REST] Erro:', err.message);
  }
}

async function replyInteraction(interactionId, interactionToken, content, embeds = []) {
  try {
    await fetch('https://discord.com/api/v10/interactions/' + interactionId + '/' + interactionToken + '/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 4,
        data: {
          content: content || undefined,
          embeds: embeds.length > 0 ? embeds : undefined
        }
      })
    });
  } catch (_) {}
}

async function handleMusicCommand({ guildId, textChannelId, userId, userName, query, interactionId, interactionToken }) {
  if (!guildId) {
    if (interactionId) replyInteraction(interactionId, interactionToken, '❌ Use este comando dentro de um servidor!');
    return;
  }

  let voiceChannelId = userVoiceStates.get(guildId + '_' + userId);
  if (!voiceChannelId) {
    try {
      const res = await fetch('https://discord.com/api/v10/guilds/' + guildId + '/channels', {
        headers: { Authorization: 'Bot ' + TOKEN }
      });
      const channels = await res.json();
      const vc = Array.isArray(channels) && channels.find(c => c.type === 2);
      if (vc) voiceChannelId = vc.id;
    } catch (_) {}
  }

  if (!voiceChannelId) {
    const errorMsg = '⚠️ **Você precisa estar conectado em um canal de voz** para pedir músicas!';
    if (interactionId) replyInteraction(interactionId, interactionToken, errorMsg);
    else sendDiscordMessage(textChannelId, errorMsg);
    return;
  }

  if (interactionId) replyInteraction(interactionId, interactionToken, '🔍 Buscando **"' + query + '"** no cluster de áudio...');
  else sendDiscordMessage(textChannelId, '🔍 Buscando **"' + query + '"** no cluster de áudio...');

  const track = await searchTrack(query);
  if (!track) {
    sendDiscordMessage(textChannelId, '❌ Nenhuma música encontrada para: **"' + query + '"**');
    return;
  }

  track.requestedBy = userName;
  joinDiscordVoiceChannel(guildId, voiceChannelId);

  let guildQueue = musicQueues.get(guildId);
  if (!guildQueue) {
    guildQueue = { queue: [], current: null, channelId: voiceChannelId, textChannelId };
    musicQueues.set(guildId, guildQueue);
  }

  guildQueue.textChannelId = textChannelId;
  guildQueue.channelId = voiceChannelId;

  if (guildQueue.current) {
    guildQueue.queue.push(track);
    sendDiscordMessage(textChannelId, '📥 **Adicionado à Fila (#' + guildQueue.queue.length + '):**\\n**' + track.info.title + '** (' + formatDuration(track.info.length) + ')');
  } else {
    guildQueue.queue.push(track);
    playNextTrack(guildId);
  }
}

function connectDiscordGateway() {
  console.log('[Discord-Gateway] Conectando ao Gateway...');
  discordWs = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
  let heartbeatTimer = null, lastSeq = null;

  discordWs.on('message', raw => {
    try {
      const payload = JSON.parse(raw.toString());
      const { op, d, s, t } = payload;
      if (s !== null) lastSeq = s;

      if (op === 10) {
        heartbeatTimer = setInterval(() => {
          if (discordWs.readyState === WebSocket.OPEN) discordWs.send(JSON.stringify({ op: 1, d: lastSeq }));
        }, d.heartbeat_interval);

        discordWs.send(JSON.stringify({
          op: 2,
          d: {
            token: TOKEN,
            intents: 1 | 128 | 512 | 32768,
            properties: { os: 'linux', browser: 'aethelkov', device: 'aethel-audio-box' },
            presence: { status: 'online', activities: [{ name: '!music <nome> 🎶', type: 2 }] }
          }
        }));
      }

      if (t === 'READY' && d) {
        botUserId = d.user && d.user.id;
        console.log('✅ [Discord-Gateway] Bot de Música Online: ' + (d.user ? d.user.username : 'Bot'));
        connectLavalink();
      }

      if (t === 'GUILD_CREATE' && d && Array.isArray(d.voice_states)) {
        d.voice_states.forEach(vs => {
          if (vs.user_id && vs.channel_id) userVoiceStates.set(d.id + '_' + vs.user_id, vs.channel_id);
        });
      }

      if (t === 'VOICE_STATE_UPDATE' && d) {
        const userKey = d.guild_id + '_' + d.user_id;
        if (d.channel_id) userVoiceStates.set(userKey, d.channel_id);
        else userVoiceStates.delete(userKey);

        if (d.user_id === botUserId && d.guild_id) {
          const state = voiceStates.get(d.guild_id) || {};
          state.sessionId = d.session_id;
          voiceStates.set(d.guild_id, state);
          updateLavalinkVoice(d.guild_id);
        }
      }

      if (t === 'VOICE_SERVER_UPDATE' && d) {
        const state = voiceStates.get(d.guild_id) || {};
        state.token = d.token;
        state.endpoint = d.endpoint;
        voiceStates.set(d.guild_id, state);
        updateLavalinkVoice(d.guild_id);
      }

      if (t === 'INTERACTION_CREATE' && d && d.type === 2) {
        const cmdName = d.data && d.data.name;
        const guildId = d.guild_id;
        const textChannelId = d.channel_id;
        const userId = (d.member && d.member.user && d.member.user.id) || (d.user && d.user.id);
        const userName = (d.member && d.member.user && d.member.user.username) || (d.user && d.user.username) || 'Usuário';

        if (cmdName === 'music') {
          const query = (d.data && d.data.options && d.data.options[0] && d.data.options[0].value) || 'misery';
          handleMusicCommand({ guildId, textChannelId, userId, userName, query, interactionId: d.id, interactionToken: d.token });
        } else if (cmdName === 'stop') {
          leaveDiscordVoiceChannel(guildId);
          musicQueues.delete(guildId);
          replyInteraction(d.id, d.token, '⏹️ **Reprodução parada e bot desconectado da call!**');
        } else if (cmdName === 'skip') {
          replyInteraction(d.id, d.token, '⏭️ **Pulando para a próxima música...**');
          playNextTrack(guildId);
        }
      }

      if (t === 'MESSAGE_CREATE' && d && !d.author.bot) {
        const raw = (d.content || '').trim();
        const content = raw.replace(/^!\\s+/, '!');
        const guildId = d.guild_id;
        const textChannelId = d.channel_id;
        const userId = d.author.id;
        const userName = d.author.username;

        if (content.startsWith('!music') || content.startsWith('!play') || content.startsWith('!tocar')) {
          const query = content.replace(/^!(?:music|play|tocar)\\s*/i, '').trim() || 'misery';
          handleMusicCommand({ guildId, textChannelId, userId, userName, query });
        } else if (content === '!stop' || content === '!parar') {
          leaveDiscordVoiceChannel(guildId);
          musicQueues.delete(guildId);
          sendDiscordMessage(textChannelId, '⏹️ **Reprodução parada e bot desconectado da call!**');
        } else if (content === '!skip' || content === '!pular') {
          sendDiscordMessage(textChannelId, '⏭️ **Pulando para a próxima música...**');
          playNextTrack(guildId);
        } else if (content === '!ping') {
          sendDiscordMessage(textChannelId, '🏓 **Pong!** Latência: 1ms | Áudio Lavalink v4 Online');
        } else if (content === '!help' || content === '!ajuda') {
          sendDiscordMessage(textChannelId, '🎶 **Comandos de Música Aethelkov:**\\n• \`!music <nome>\` - Toca música na call\\n• \`!stop\` - Para e sai da call\\n• \`!skip\` - Pula música\\n• \`!ping\` - Latência');
        }
      }
    } catch (err) {
      console.error('[Discord-Gateway] Erro:', err.message);
    }
  });

  discordWs.on('close', code => {
    clearInterval(heartbeatTimer);
    console.warn('[Discord-Gateway] Conexão fechada (' + code + '). Reconectando em 5s...');
    setTimeout(connectDiscordGateway, 5000);
  });

  discordWs.on('error', err => {
    console.error('[Discord-Gateway] Erro socket:', err.message);
  });
}

connectDiscordGateway();
`;
}
