import JSZip from 'jszip';
import { BotPlatform } from './types';

export interface InspectedBotData {
  name: string;
  platform: BotPlatform;
  token: string | null;
  mainFile: string;
  ramLimitMb: number;
  configType: 'aethel' | 'discloud';
  isSite?: boolean;
  subdomain?: string;
  language: 'python' | 'nodejs' | 'java' | 'other';
  hasDiscloudConfig: boolean;
  hasConfigFile?: boolean;
  configFileName?: 'aethel.config' | 'discloud.config' | null;
  generatedDiscloudConfig: string;
  detectedEnvVars: Record<string, string>;
  detectionDetails: {
    platformReason: string;
    tokenSource: string | null;
    dependencies: string[];
    detectedFeatures: string[];
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
  let detectedLanguage: 'python' | 'nodejs' | 'java' | 'other' = 'nodejs';
  const foundDependencies: string[] = [];
  const detectedFeatures: string[] = [];
  const detectedEnvVars: Record<string, string> = {};

  // Contagem de tipos de arquivos para determinar a linguagem
  let pythonFileCount = 0;
  let jsFileCount = 0;
  let javaFileCount = 0;
  const pythonMainCandidates: string[] = [];
  const jsMainCandidates: string[] = [];
  const javaMainCandidates: string[] = [];

  zip.forEach((path, entry) => {
    if (entry.dir) return;
    const lower = path.toLowerCase();
    if (lower.includes('node_modules') || lower.includes('.git') || lower.includes('__pycache__')) return;

    if (lower.endsWith('.py')) {
      pythonFileCount++;
      const base = path.split('/').pop() || '';
      if (['main.py', 'bot.py', 'app.py', 'run.py', 'client.py', 'index.py'].includes(base.toLowerCase())) {
        pythonMainCandidates.push(path);
      }
    } else if (lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.mjs') || lower.endsWith('.cjs')) {
      jsFileCount++;
      const base = path.split('/').pop() || '';
      if (['index.js', 'bot.js', 'main.js', 'app.js', 'server.js', 'index.ts', 'bot.ts'].includes(base.toLowerCase())) {
        jsMainCandidates.push(path);
      }
    } else if (lower.endsWith('.jar')) {
      javaFileCount++;
      javaMainCandidates.push(path);
    }
  });

  const hasRequirementsTxt = !!zip.file('requirements.txt') || zip.file(/^.*\/requirements\.txt$/i).length > 0;
  const hasPackageJson = !!zip.file('package.json') || zip.file(/^.*\/package\.json$/i).length > 0;

  // Determina a linguagem predominante
  if (pythonFileCount > 0 || hasRequirementsTxt) {
    if (pythonFileCount >= jsFileCount) {
      detectedLanguage = 'python';
      mainFile = pythonMainCandidates[0] || 'main.py';
    } else {
      detectedLanguage = 'nodejs';
      mainFile = jsMainCandidates[0] || 'index.js';
    }
  } else if (javaFileCount > 0) {
    detectedLanguage = 'java';
    mainFile = javaMainCandidates[0] || 'bot.jar';
  } else if (jsFileCount > 0 || hasPackageJson) {
    detectedLanguage = 'nodejs';
    mainFile = jsMainCandidates[0] || 'index.js';
  }

  // 1. Procura por aethel.config ou discloud.config
  const aethelEntry = zip.file('aethel.config') || zip.file(/^.*\/aethel\.config$/i)[0];
  const discloudEntry = zip.file('discloud.config') || zip.file(/^.*\/discloud\.config$/i)[0];
  const hasDiscloudConfig = !!discloudEntry;
  let configRaw: string | null = null;

  if (aethelEntry) {
    configRaw = await aethelEntry.async('string');
    configType = 'aethel';
  } else if (discloudEntry) {
    configRaw = await discloudEntry.async('string');
    configType = 'discloud';
  }

  let isSite = false;
  let detectedSubdomain: string | undefined = undefined;

  // Auto-detecção de Site Estático se contiver index.html
  const indexHtmlEntry = zip.file('index.html') || zip.file('index.htm');
  if (indexHtmlEntry) {
    isSite = true;
    mainFile = 'index.html';
    detectedPlatform = 'DISCORD';
    platformReason = 'Site Web Estático (index.html detectado)';
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
      if (key === 'TYPE' && val.toLowerCase() === 'site') {
        isSite = true;
        detectedPlatform = 'DISCORD'; // Compatível com enum do banco
        platformReason = 'Aplicação Web / Site';
      }
      if (key === 'SUBDOMAIN') {
        isSite = true;
        detectedSubdomain = val.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 32);
      }
      if (key === 'RAM') {
        const parsedRam = parseInt(val, 10);
        if (!isNaN(parsedRam)) ramLimitMb = Math.min(Math.max(parsedRam, 100), 8192);
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

  // Se for Site e não tiver token de bot, usa token interno de site
  if (isSite && !detectedToken) {
    detectedToken = `site:${detectedSubdomain || detectedName}`;
    tokenSource = 'Site Web';
  }

  // Se mainFile termina com .py, assegura linguagem Python
  if (mainFile.endsWith('.py')) {
    detectedLanguage = 'python';
  } else if (mainFile.endsWith('.jar')) {
    detectedLanguage = 'java';
  } else if (mainFile.endsWith('.html') || mainFile.endsWith('.htm')) {
    detectedLanguage = 'other';
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
      if (pkgJson.main && !configRaw) {
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

        if (lowerDep.includes('mercadopago') || lowerDep.includes('asaas') || lowerDep.includes('pix')) {
          detectedFeatures.push('Vendas / Pagamentos Pix');
        }
        if (lowerDep.includes('openai') || lowerDep.includes('@google/generative-ai') || lowerDep.includes('@anthropic')) {
          detectedFeatures.push('Inteligência Artificial');
        }
        if (lowerDep.includes('lavalink') || lowerDep.includes('poru') || lowerDep.includes('shoukaku') || lowerDep.includes('erela')) {
          detectedFeatures.push('Música / Lavalink');
        }
      }
    } catch {
      // Ignora erro de parse do package.json
    }
  }

  // 2b. Inspeciona requirements.txt (se existir)
  const reqEntry = zip.file('requirements.txt') || zip.file(/^.*\/requirements\.txt$/i)[0];
  if (reqEntry) {
    try {
      const reqStr = await reqEntry.async('string');
      const lines = reqStr.split(/\r?\n/);
      for (const line of lines) {
        const dep = line.trim().split(/[=><~]/)[0].trim();
        if (!dep || dep.startsWith('#')) continue;
        foundDependencies.push(dep);
        const lowerDep = dep.toLowerCase();
        if (lowerDep.includes('discord')) {
          detectedPlatform = 'DISCORD';
          platformReason = `Biblioteca Python "${dep}" em requirements.txt`;
        } else if (lowerDep.includes('telegram') || lowerDep.includes('telebot') || lowerDep.includes('aiogram')) {
          detectedPlatform = 'TELEGRAM';
          platformReason = `Biblioteca Python "${dep}" em requirements.txt`;
        }
        if (lowerDep.includes('mercadopago') || lowerDep.includes('pix')) {
          detectedFeatures.push('Vendas / Pagamentos Pix');
        }
        if (lowerDep.includes('openai') || lowerDep.includes('google-generativeai')) {
          detectedFeatures.push('Inteligência Artificial');
        }
      }
    } catch (_) {}
  }

  // 3. Inspeciona arquivos de ambiente (.env, .env.production, .env.local)
  const envEntries = zip.file(/^\.env(\.[a-zA-Z0-9_-]+)?$/i);
  for (const envEntry of envEntries) {
    try {
      const envContent = await envEntry.async('string');
      const envLines = envContent.split(/\r?\n/);
      for (const line of envLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const sep = trimmed.indexOf('=');
        if (sep === -1) continue;
        const key = trimmed.slice(0, sep).trim().toUpperCase();
        const val = trimmed.slice(sep + 1).trim().replace(/^["']|["']$/g, '');

        if (key && val) {
          detectedEnvVars[key] = val;
        }

        if (
          !detectedToken &&
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
        }
      }
    } catch (_) {}
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

  // 6. Gera configuração Discloud padrão caso não exista
  const cleanName = detectedName.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 30) || 'aethel-bot';
  const generatedDiscloudConfig = [
    `NAME=${cleanName}`,
    `TYPE=bot`,
    `MAIN=${mainFile}`,
    `RAM=${ramLimitMb}`,
    `AUTORESTART=true`,
    `VERSION=latest`,
    `APT=tools`,
  ].join('\n') + '\n';

  return {
    name: detectedName,
    platform: detectedPlatform,
    token: detectedToken,
    mainFile,
    ramLimitMb,
    configType,
    isSite,
    subdomain: detectedSubdomain,
    language: detectedLanguage,
    hasDiscloudConfig,
    hasConfigFile: !!(aethelEntry || discloudEntry),
    configFileName: aethelEntry ? 'aethel.config' : discloudEntry ? 'discloud.config' : null,
    generatedDiscloudConfig,
    detectedEnvVars,
    detectionDetails: {
      platformReason,
      tokenSource,
      dependencies: Array.from(new Set(foundDependencies)),
      detectedFeatures: Array.from(new Set(detectedFeatures)),
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

