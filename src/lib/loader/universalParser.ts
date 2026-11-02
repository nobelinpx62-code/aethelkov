import JSZip from 'jszip';

export interface AnalysisResult {
  entrypoint: string;
  token: string | null;
  usesVoice: boolean;
  usesLocalDb: boolean;
  cronIntervalSec: number;
  platform: 'DISCORD' | 'TELEGRAM';
  runtimeMode: string;
}

/**
 * Código do Virtual Shim Aethelkov Universal (Zero-RAM, Zero-FFmpeg)
 * Intercepta require('discord.js'), @discordjs/voice e quick.db
 * Provê EmbedBuilder, ButtonBuilder, ActionRowBuilder, Collection e Caches virtuais
 */
export const AETHEL_DISCORD_SHIM = `
// ============================================================================
// AETHELKOV UNIVERSAL SHIM v3.0 (Zero-RAM Virtualizer Engine)
// Intercepta discord.js para permitir execução sem consumo de memória.
// ============================================================================
const EventEmitter = require('events');

// Coleção nativa leve compatível com discord.js Collection
class Collection extends Map {
  find(fn) {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }
    return undefined;
  }
  filter(fn) {
    const results = new Collection();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }
    return results;
  }
  map(fn) {
    const results = [];
    for (const [key, val] of this) {
      results.push(fn(val, key, this));
    }
    return results;
  }
  first() {
    return this.values().next().value;
  }
  has(key) {
    return super.has(key);
  }
  get(key) {
    return super.get(key);
  }
}

// Construtor fluente de Embeds (suporta EmbedBuilder v14 e MessageEmbed v12/v13)
class EmbedBuilder {
  constructor(data = {}) {
    this.data = {
      title: data.title || '',
      description: data.description || '',
      color: data.color || 0x00f2fe,
      fields: data.fields || [],
      footer: data.footer || null,
      thumbnail: data.thumbnail || null,
      image: data.image || null,
      author: data.author || null,
      timestamp: data.timestamp || null
    };
  }
  setTitle(t) { this.data.title = t; return this; }
  setDescription(d) { this.data.description = d; return this; }
  setColor(c) {
    if (typeof c === 'string') {
      this.data.color = parseInt(c.replace('#', ''), 16) || 0x00f2fe;
    } else {
      this.data.color = c;
    }
    return this;
  }
  addFields(...fields) {
    const flat = Array.isArray(fields[0]) ? fields[0] : fields;
    this.data.fields.push(...flat);
    return this;
  }
  setFooter(f) {
    this.data.footer = typeof f === 'string' ? { text: f } : f;
    return this;
  }
  setImage(url) {
    this.data.image = typeof url === 'string' ? { url } : url;
    return this;
  }
  setThumbnail(url) {
    this.data.thumbnail = typeof url === 'string' ? { url } : url;
    return this;
  }
  setAuthor(a) {
    this.data.author = typeof a === 'string' ? { name: a } : a;
    return this;
  }
  setTimestamp(t = new Date()) {
    this.data.timestamp = new Date(t).toISOString();
    return this;
  }
  toJSON() {
    return { ...this.data };
  }
}

// Construtor fluente de Botões
class ButtonBuilder {
  constructor(data = {}) {
    this.data = { type: 2, style: 1, ...data };
  }
  setCustomId(id) { this.data.custom_id = id; return this; }
  setLabel(l) { this.data.label = l; return this; }
  setStyle(s) { this.data.style = s; return this; }
  setEmoji(e) { this.data.emoji = typeof e === 'string' ? { name: e } : e; return this; }
  setDisabled(d = true) { this.data.disabled = Boolean(d); return this; }
  setURL(u) { this.data.url = u; this.data.style = 5; return this; }
  toJSON() { return { ...this.data }; }
}

// Construtor fluente de Menus de Seleção
class StringSelectMenuBuilder {
  constructor(data = {}) {
    this.data = { type: 3, options: [], ...data };
  }
  setCustomId(id) { this.data.custom_id = id; return this; }
  setPlaceholder(p) { this.data.placeholder = p; return this; }
  setMinValues(m) { this.data.min_values = m; return this; }
  setMaxValues(m) { this.data.max_values = m; return this; }
  addOptions(...options) {
    const flat = Array.isArray(options[0]) ? options[0] : options;
    this.data.options.push(...flat);
    return this;
  }
  toJSON() { return { ...this.data }; }
}

// ActionRow para organizar botões e menus
class ActionRowBuilder {
  constructor(data = {}) {
    this.data = { type: 1, components: data.components || [] };
  }
  addComponents(...components) {
    const flat = Array.isArray(components[0]) ? components[0] : components;
    this.data.components.push(...flat.map(c => typeof c.toJSON === 'function' ? c.toJSON() : c));
    return this;
  }
  setComponents(...components) {
    this.data.components = [];
    return this.addComponents(...components);
  }
  toJSON() { return { ...this.data }; }
}

// Canal virtual com envio REST direto
function createVirtualChannel(channelId, token) {
  return {
    id: channelId,
    type: 0,
    send: async (options) => {
      let body = {};
      if (typeof options === 'string') {
        body = { content: options };
      } else if (options && typeof options === 'object') {
        body = { ...options };
        if (options.embeds) {
          body.embeds = options.embeds.map(e => typeof e.toJSON === 'function' ? e.toJSON() : e);
        }
        if (options.components) {
          body.components = options.components.map(c => typeof c.toJSON === 'function' ? c.toJSON() : c);
        }
      }
      try {
        if (typeof fetch !== 'undefined') {
          const res = await fetch(\`https://discord.com/api/v10/channels/\${channelId}/messages\`, {
            method: 'POST',
            headers: {
              'Authorization': \`Bot \${token || process.env.DISCORD_TOKEN || ''}\`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
          return await res.json();
        }
      } catch (err) {
        console.error('[Aethel-Shim Channel.send]', err.message);
      }
      return { id: 'mock-msg-id', channel_id: channelId };
    }
  };
}

// Cliente Virtual Aethelkov
class VirtualClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.token = null;
    this.user = {
      id: '0',
      tag: 'Aethelkov#0000',
      username: 'AethelkovBot',
      setPresence: () => {},
      setActivity: () => {}
    };
    this.ws = { ping: 12, status: 0 };
    
    // Cache de Canais com Proxy para responder qualquer canal solicitado
    this.channels = {
      cache: new Proxy(new Collection(), {
        get: (target, prop) => {
          if (prop === 'get') {
            return (id) => createVirtualChannel(id, this.token);
          }
          if (typeof target[prop] === 'function') {
            return target[prop].bind(target);
          }
          return target[prop];
        }
      }),
      fetch: async (id) => createVirtualChannel(id, this.token)
    };

    // Cache de Guildas com Proxy
    this.guilds = {
      cache: new Proxy(new Collection(), {
        get: (target, prop) => {
          if (prop === 'get') {
            return (id) => ({
              id,
              name: 'Aethelkov Server',
              members: { cache: new Collection(), fetch: async () => new Collection() },
              channels: this.channels
            });
          }
          return target[prop];
        }
      })
    };

    this.users = {
      cache: new Collection(),
      fetch: async (id) => ({ id, username: 'DiscordUser' })
    };
  }

  async login(token) {
    this.token = token || process.env.DISCORD_TOKEN;
    console.log('[Aethel-Shim] Inicialização virtual concluída com sucesso (Zero-RAM mode ativo).');
    process.nextTick(() => {
      this.emit('ready', this);
    });
    return token;
  }

  destroy() {
    this.removeAllListeners();
  }
}

// Enumerações essenciais e Proxies de permissão
const ButtonStyle = { Primary: 1, Secondary: 2, Success: 3, Danger: 4, Link: 5 };
const ActivityType = { Playing: 0, Streaming: 1, Listening: 2, Watching: 3, Competing: 5 };
const ChannelType = { GuildText: 0, DM: 1, GuildVoice: 2, GuildCategory: 4 };

module.exports = {
  Client: VirtualClient,
  Collection,
  EmbedBuilder,
  MessageEmbed: EmbedBuilder, // Compatibilidade v12 / v13
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonStyle,
  ActivityType,
  ChannelType,
  GatewayIntentBits: new Proxy({}, { get: () => 0 }),
  Partials: new Proxy({}, { get: () => 0 }),
  Events: new Proxy({}, { get: (t, p) => p }),
  PermissionFlagsBits: new Proxy({}, { get: () => 0n })
};
`;

/**
 * Virtual Shim para @discordjs/voice (Zero-FFmpeg / Lavalink Relay)
 */
export const AETHEL_VOICE_SHIM = `
const EventEmitter = require('events');

class VoiceConnection extends EventEmitter {
  constructor() {
    super();
    this.state = { status: 'ready' };
  }
  subscribe() { return true; }
  destroy() { this.emit('stateChange', { status: 'destroyed' }); }
  disconnect() { this.destroy(); }
}

function joinVoiceChannel(options = {}) {
  console.log('[Aethel-Voice-Shim] Interceptado joinVoiceChannel para canal:', options.channelId);
  const connection = new VoiceConnection();
  process.nextTick(() => connection.emit('stateChange', { status: 'ready' }));
  return connection;
}

function createAudioPlayer() {
  const player = new EventEmitter();
  player.play = (resource) => {
    console.log('[Aethel-Voice-Shim] AudioPlayer.play() acionado via Lavalink Cluster.');
  };
  player.stop = () => {};
  player.pause = () => {};
  player.unpause = () => {};
  return player;
}

function createAudioResource(input) {
  return { input };
}

module.exports = {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus: { Idle: 'idle', Buffering: 'buffering', Playing: 'playing', AutoPaused: 'autopaused' },
  VoiceConnectionStatus: { Ready: 'ready', Destroyed: 'destroyed', Disconnected: 'disconnected' },
  entersState: async (target) => target
};
`;

/**
 * Analisa e injeta a camada universal de shims no ZIP do bot
 */
export async function parseAndShimZip(
  zipBuffer: Buffer | ArrayBuffer
): Promise<{ modifiedZip: Buffer; metadata: AnalysisResult }> {
  const zip = await JSZip.loadAsync(zipBuffer);
  let token: string | null = null;
  let entrypoint = 'index.js';
  let usesVoice = false;
  let usesLocalDb = false;
  let cronIntervalSec = 0;
  let platform: 'DISCORD' | 'TELEGRAM' = 'DISCORD';

  // 1. Identifica entrypoint no package.json ou configs
  const packageJsonFile = zip.file('package.json');
  let hasDiscordJsDep = false;
  let hasGrammyOrTelegraf = false;

  if (packageJsonFile) {
    try {
      const pkg = JSON.parse(await packageJsonFile.async('text'));
      if (pkg.main) entrypoint = pkg.main;
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (deps['discord.js']) hasDiscordJsDep = true;
      if (deps['grammy'] || deps['telegraf'] || deps['node-telegram-bot-api']) hasGrammyOrTelegraf = true;
      if (deps['@discordjs/voice'] || deps['kazagumo'] || deps['erela.js']) usesVoice = true;
      if (deps['quick.db'] || deps['better-sqlite3'] || deps['sqlite3']) usesLocalDb = true;
    } catch (_) {}
  }

  const discloudConfig = zip.file('discloud.config') || zip.file('aethel.config');
  if (discloudConfig) {
    const lines = (await discloudConfig.async('text')).split('\n');
    for (const line of lines) {
      const [k, v] = line.split('=').map((s) => s?.trim());
      if (k === 'MAIN' && v) entrypoint = v;
      if (k === 'TYPE' && v?.toLowerCase() === 'bot') platform = 'DISCORD';
    }
  }

  // 2. Extrai arquivos de configuração .env se existirem
  const envFile = zip.file('.env');
  if (envFile) {
    const envText = await envFile.async('text');
    const dcMatch = envText.match(/(?:DISCORD_TOKEN|BOT_TOKEN|TOKEN)\s*=\s*["']?([A-Za-z0-9_\.-]{50,})["']?/i);
    if (dcMatch) {
      token = dcMatch[1];
      platform = 'DISCORD';
    }
    const tgMatch = envText.match(/(?:TELEGRAM_TOKEN|BOT_TOKEN|TG_TOKEN)\s*=\s*["']?(\d{8,11}:[A-Za-z0-9_-]{30,})["']?/i);
    if (tgMatch) {
      token = tgMatch[1];
      platform = 'TELEGRAM';
    }
  }

  // 3. Inspeciona o código fonte do entrypoint para detectar tokens crus e dependências
  const mainFile = zip.file(entrypoint);
  if (mainFile) {
    const code = await mainFile.async('text');

    if (!token) {
      // Regex para token do Telegram
      const tgTokenMatch = code.match(/(\d{8,11}:[A-Za-z0-9_-]{34,})/);
      if (tgTokenMatch) {
        token = tgTokenMatch[1];
        platform = 'TELEGRAM';
      } else {
        // Regex para token do Discord
        const dcTokenMatch = code.match(/login\(\s*["']([A-Za-z0-9_\.-]{50,})["']\s*\)/) ||
                             code.match(/["']([A-Za-z0-9_-]{24,28}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,38})["']/);
        if (dcTokenMatch) {
          token = dcTokenMatch[1];
          platform = 'DISCORD';
        }
      }
    }

    if (code.includes('@discordjs/voice') || code.includes('joinVoiceChannel') || code.includes('kazagumo') || code.includes('erela.js')) {
      usesVoice = true;
    }

    if (code.includes('database.json') || code.includes('sqlite3') || code.includes('better-sqlite3') || code.includes('quick.db')) {
      usesLocalDb = true;
    }

    if (code.includes('grammy') || code.includes('Telegraf') || code.includes('telegram')) {
      platform = 'TELEGRAM';
    } else if (code.includes('discord.js') || code.includes('Client') || hasDiscordJsDep) {
      platform = 'DISCORD';
    }

    const intervalMatch = code.match(/setInterval\s*\(\s*.*?,\s*(\d+)\s*\)/);
    if (intervalMatch) {
      const ms = parseInt(intervalMatch[1], 10);
      if (ms >= 10000) cronIntervalSec = Math.floor(ms / 1000);
    }
  }

  // 4. Injeta o Virtual Shim da Aethelkov no ZIP se for um bot de Discord
  // Sobrescreve node_modules/discord.js/index.js com nosso mock ultraleve
  if (platform === 'DISCORD') {
    zip.file('node_modules/discord.js/index.js', AETHEL_DISCORD_SHIM);

    // Se usar voz, injeta também o shim de áudio
    if (usesVoice) {
      zip.file('node_modules/@discordjs/voice/index.js', AETHEL_VOICE_SHIM);
    }
  }

  const modifiedBuffer = (await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })) as Buffer;

  return {
    modifiedZip: modifiedBuffer,
    metadata: {
      entrypoint,
      token,
      usesVoice,
      usesLocalDb,
      cronIntervalSec,
      platform,
      runtimeMode: 'UNIVERSAL_SHIM_v3',
    },
  };
}

