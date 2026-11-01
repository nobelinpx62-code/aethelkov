import { ParsedConfig, BotPlatform } from './types';

/**
 * Parser duplo para aethel.config e discloud.config
 * Permite migração 100% retrocompatível de projetos da Discloud para o Aethelkov
 */
export function parseConfigFile(content: string, filename: string = 'aethel.config'): ParsedConfig {
  const lines = content.split(/\r?\n/);
  const rawLines: Record<string, string> = {};

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim().toUpperCase();
    const value = trimmed.slice(separatorIndex + 1).trim();
    rawLines[key] = value;
  }

  const isDiscloud = filename.toLowerCase().includes('discloud');
  const name = rawLines['NAME'] || rawLines['ID'] || 'aethel-bot';
  const main = rawLines['MAIN'] || 'index.js';
  
  // Limite estrito de 100 MB da franquia Aethelkov/Discloud Grátis
  let parsedRam = parseInt(rawLines['RAM'] || '100', 10);
  if (isNaN(parsedRam) || parsedRam > 100) {
    parsedRam = 100;
  }
  if (parsedRam < 25) {
    parsedRam = 25;
  }

  const type = rawLines['TYPE'] || 'bot';
  const autorestart = (rawLines['AUTORESTART'] || 'true').toLowerCase() === 'true';

  // Detecção de plataforma
  let platform: BotPlatform = 'DISCORD';
  if (rawLines['PLATFORM']) {
    platform = rawLines['PLATFORM'].toUpperCase() === 'TELEGRAM' ? 'TELEGRAM' : 'DISCORD';
  } else if (rawLines['TOKEN'] && /^\d{8,11}:[A-Za-z0-9_-]{35}/.test(rawLines['TOKEN'])) {
    platform = 'TELEGRAM';
  }

  return {
    name,
    platform,
    type,
    main,
    ram: parsedRam,
    autorestart,
    token: rawLines['TOKEN'] || undefined,
    configType: isDiscloud ? 'discloud' : 'aethel',
    rawLines,
  };
}

/**
 * Converte um objeto de configuração em formato aethel.config ou discloud.config
 */
export function stringifyConfig(config: Partial<ParsedConfig>, format: 'aethel' | 'discloud' = 'aethel'): string {
  const lines: string[] = [
    `# Configurado para Aethelkov Runtime (${format}.config)`,
    `NAME=${config.name || 'meu-bot'}`,
    `TYPE=${config.type || 'bot'}`,
    `MAIN=${config.main || 'index.js'}`,
    `RAM=${Math.min(config.ram || 100, 100)}`,
    `AUTORESTART=${config.autorestart ?? true}`,
  ];

  if (config.platform) {
    lines.push(`PLATFORM=${config.platform}`);
  }

  if (config.token) {
    lines.push(`TOKEN=${config.token}`);
  }

  return lines.join('\n') + '\n';
}

