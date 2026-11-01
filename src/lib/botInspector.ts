import JSZip from 'jszip';
import { BotPlatform } from './types';

export interface InspectedBotData {
  name: string;
  platform: BotPlatform;
  token: string | null;
  mainFile: string;
  ramLimitMb: number;
  configType: 'aethel' | 'discloud';
  detectionDetails: {
    platformReason: string;
    tokenSource: string | null;
    dependencies: string[];
  };
}

// Padrões de Token RegEx
export const TELEGRAM_TOKEN_REGEX = /\b(\d{8,11}:[A-Za-z0-9_-]{35})\b/;
export const DISCORD_TOKEN_REGEX = /\b([A-Za-z0-9_-]{24,28}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,38})\b/;

// Pacotes que identificam a plataforma
const TELEGRAM_PACKAGES = [
  'grammy',
  'telegraf',
  'node-telegram-bot-api',
  'telegram',
  'mtkruto',
  'python-telegram-bot',
  'aiogram',
  'telebot',
  'pyrogram',
];

const DISCORD_PACKAGES = [
  'discord.js',
  'eris',
  'oceanic.js',
  'detritus-client',
  'discord-api-types',
  'discord.py',
  'disnake',
  'hikari',
  'nextcord',
];

/**
 * Inspeciona profundamente um arquivo ZIP para extrair configuração,
 * auto-detectar se é Telegram ou Discord e localizar o token no código ou ambiente.
 */
export async function inspectZipBot(zip: JSZip, manualToken?: string | null): Promise<InspectedBotData> {
  let detectedName = 'meu-bot';
  let mainFile = 'index.js';
  let ramLimitMb = 100;
  let configType: 'aethel' | 'discloud' = 'aethel';
  let detectedToken: string | null = manualToken?.trim() || null;
  let tokenSource: string | null = manualToken ? 'Manual' : null;
  let detectedPlatform: BotPlatform = 'DISCORD';
  let platformReason = 'Padrão da plataforma';
  const foundDependencies: string[] = [];

  // 1. Procura por aethel.config ou discloud.config
  const aethelEntry = zip.file('aethel.config') || zip.file(/^.*\/aethel\.config$/i)[0];
  const discloudEntry = zip.file('discloud.config') || zip.file(/^.*\/discloud\.config$/i)[0];
  let configRaw: string | null = null;

  if (aethelEntry) {
    configRaw = await aethelEntry.async('string');
    configType = 'aethel';
  } else if (discloudEntry) {
    configRaw = await discloudEntry.async('string');
    configType = 'discloud';
  }

  if (configRaw) {
    const lines = configRaw.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;
      const sep = trimmed.indexOf('=');
      if (sep === -1) continue;
      const key = trimmed.slice(0, sep).trim().toUpperCase();
      const val = trimmed.slice(sep + 1).trim();

      if (key === 'NAME' || key === 'ID') detectedName = val;
      if (key === 'MAIN') mainFile = val;
      if (key === 'RAM') {
        const parsedRam = parseInt(val, 10);
        if (!isNaN(parsedRam)) ramLimitMb = Math.min(Math.max(parsedRam, 25), 100);
      }
      if (key === 'TOKEN' && !detectedToken && val) {
        detectedToken = val;
        tokenSource = `${configType}.config`;
      }
      if (key === 'PLATFORM') {
        if (val.toUpperCase() === 'TELEGRAM') {
          detectedPlatform = 'TELEGRAM';
          platformReason = `Definido no ${configType}.config`;
        } else if (val.toUpperCase() === 'DISCORD') {
          detectedPlatform = 'DISCORD';
          platformReason = `Definido no ${configType}.config`;
        }
      }
    }
  }

  // 2. Inspeciona package.json (se existir)
  const packageEntry = zip.file('package.json') || zip.file(/^.*\/package\.json$/i)[0];
  if (packageEntry) {
    try {
      const pkgStr = await packageEntry.async('string');
      const pkgJson = JSON.parse(pkgStr);
      if (pkgJson.name && detectedName === 'meu-bot') {
        detectedName = pkgJson.name;
      }
      if (pkgJson.main && mainFile === 'index.js' && !configRaw) {
        mainFile = pkgJson.main;
      }

      const allDeps = {
        ...(pkgJson.dependencies || {}),
        ...(pkgJson.devDependencies || {}),
      };

      for (const dep of Object.keys(allDeps)) {
        foundDependencies.push(dep);
        const lowerDep = dep.toLowerCase();
        if (TELEGRAM_PACKAGES.some((tg) => lowerDep.includes(tg))) {
          detectedPlatform = 'TELEGRAM';
          platformReason = `Biblioteca Telegram "${dep}" detectada no package.json`;
        } else if (DISCORD_PACKAGES.some((dc) => lowerDep.includes(dc))) {
          detectedPlatform = 'DISCORD';
          platformReason = `Biblioteca Discord "${dep}" detectada no package.json`;
        }
      }
    } catch {
      // Ignora erro de parse do package.json
    }
  }

  // 3. Inspeciona arquivos de ambiente (.env, .env.production, .env.local)
  if (!detectedToken) {
    const envEntries = zip.file(/^\.env(\.[a-zA-Z0-9_-]+)?$/i);
    for (const envEntry of envEntries) {
      const envContent = await envEntry.async('string');
      const envLines = envContent.split(/\r?\n/);
      for (const line of envLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const sep = trimmed.indexOf('=');
        if (sep === -1) continue;
        const key = trimmed.slice(0, sep).trim().toUpperCase();
        const val = trimmed.slice(sep + 1).trim().replace(/^["']|["']$/g, '');

        if (
          [
            'TOKEN',
            'BOT_TOKEN',
            'TELEGRAM_TOKEN',
            'DISCORD_TOKEN',
            'TG_TOKEN',
            'API_TOKEN',
            'DISCLOUD_TOKEN',
          ].includes(key) &&
          val
        ) {
          detectedToken = val;
          tokenSource = envEntry.name;
          break;
        }
      }
      if (detectedToken) break;
    }
  }

  // 4. Varredura profunda nos arquivos de código-fonte (.js, .ts, .py)
  // especialmente o arquivo principal (bot.js, index.js, app.js, etc.)
  const candidateFiles: string[] = [];
  zip.forEach((relativePath, entry) => {
    if (!entry.dir && /\.(js|ts|mjs|cjs|py)$/i.test(relativePath)) {
      if (!relativePath.includes('node_modules') && !relativePath.includes('.git')) {
        candidateFiles.push(relativePath);
      }
    }
  });

  // Prioriza o arquivo mainFile se estiver na lista
  candidateFiles.sort((a, b) => {
    if (a.toLowerCase() === mainFile.toLowerCase()) return -1;
    if (b.toLowerCase() === mainFile.toLowerCase()) return 1;
    return a.length - b.length;
  });

  for (const filePath of candidateFiles) {
    const fileEntry = zip.file(filePath);
    if (!fileEntry) continue;

    try {
      const content = await fileEntry.async('string');

      // Verifica se o código tem importações do Telegram
      if (
        /require\(["']grammy["']\)|from ["']grammy["']|require\(["']telegraf["']\)|from ["']telegraf["']|telebot|aiogram|TelegramBot/i.test(
          content
        )
      ) {
        detectedPlatform = 'TELEGRAM';
        platformReason = `Importação do Telegram identificada em "${filePath}"`;
      } else if (
        /require\(["']discord\.js["']\)|from ["']discord\.js["']|discord\.Client/i.test(
          content
        )
      ) {
        detectedPlatform = 'DISCORD';
        platformReason = `Importação do Discord identificada em "${filePath}"`;
      }

      // Procura Token do Telegram no código
      if (!detectedToken) {
        const tgMatch = content.match(TELEGRAM_TOKEN_REGEX);
        if (tgMatch && tgMatch[1]) {
          detectedToken = tgMatch[1];
          tokenSource = `Código-fonte (${filePath})`;
          detectedPlatform = 'TELEGRAM';
          platformReason = `Token no formato do Telegram (@BotFather) detectado em "${filePath}"`;
          break;
        }

        // Procura construtores comuns do Grammy / Telegraf
        const constructorMatch = content.match(
          /(?:new\s+Bot|new\s+Telegraf|new\s+TelegramBot)\s*\(\s*["']([^"']+)["']/i
        );
        if (constructorMatch && constructorMatch[1] && constructorMatch[1].length > 10) {
          detectedToken = constructorMatch[1];
          tokenSource = `Construtor em "${filePath}"`;
          detectedPlatform = 'TELEGRAM';
          platformReason = `Instanciação de bot Telegram detectada em "${filePath}"`;
          break;
        }

        // Procura Token do Discord no código
        const dcMatch = content.match(DISCORD_TOKEN_REGEX);
        if (dcMatch && dcMatch[1]) {
          detectedToken = dcMatch[1];
          tokenSource = `Código-fonte (${filePath})`;
          detectedPlatform = 'DISCORD';
          platformReason = `Token no formato do Discord detectado em "${filePath}"`;
          break;
        }

        // Procura client.login("token") do Discord
        const dcLoginMatch = content.match(
          /(?:client|bot)\.login\s*\(\s*["']([^"']+)["']/i
        );
        if (dcLoginMatch && dcLoginMatch[1] && dcLoginMatch[1].length > 20) {
          detectedToken = dcLoginMatch[1];
          tokenSource = `login() em "${filePath}"`;
          detectedPlatform = 'DISCORD';
          platformReason = `Instanciação de bot Discord detectada em "${filePath}"`;
          break;
        }
      }
    } catch {
      // Ignora erro na leitura de arquivo específico
    }
  }

  // 5. Se encontrou token, valida se o formato reclassifica a plataforma com certeza absoluta
  if (detectedToken) {
    if (TELEGRAM_TOKEN_REGEX.test(detectedToken)) {
      detectedPlatform = 'TELEGRAM';
      platformReason = 'Token válido do Telegram Bot API (@BotFather)';
    } else if (DISCORD_TOKEN_REGEX.test(detectedToken)) {
      detectedPlatform = 'DISCORD';
      platformReason = 'Token válido do Discord Developer Portal';
    }
  }

  return {
    name: detectedName,
    platform: detectedPlatform,
    token: detectedToken,
    mainFile,
    ramLimitMb,
    configType,
    detectionDetails: {
      platformReason,
      tokenSource,
      dependencies: foundDependencies,
    },
  };
}

/**
 * Detecta a plataforma baseada em um token fornecido manualmente
 */
export function detectPlatformFromToken(token: string): BotPlatform {
  const clean = token.trim();
  if (TELEGRAM_TOKEN_REGEX.test(clean)) {
    return 'TELEGRAM';
  }
  return 'DISCORD';
}

