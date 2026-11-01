export type BotPlatform = 'DISCORD' | 'TELEGRAM';

export type BotStatus = 'ONLINE' | 'STOPPED' | 'CRASHED' | 'BOOTING';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'GATEWAY' | 'DISPATCH';

export interface AethelBot {
  id: string;
  user_id: string;
  bot_name: string;
  platform: BotPlatform;
  token_encrypted: string;
  status: BotStatus;
  assigned_node: string;
  ram_limit_mb: number;
  main_file: string;
  config_type: 'aethel' | 'discloud';
  storage_size_bytes?: number;
  created_at: string;
  updated_at: string;
}

export interface AethelLog {
  id: number;
  bot_id: string;
  log_level: LogLevel;
  message: string;
  created_at: string;
}

export interface ClusterStats {
  total_bots: number;
  online_bots: number;
  discord_bots: number;
  telegram_bots: number;
  estimated_ram_mb: number;
  discloud_quota_mb: number;
  monthly_cost_brl: number;
}

export interface ParsedConfig {
  name: string;
  platform: BotPlatform;
  type: string;
  main: string;
  ram: number;
  autorestart: boolean;
  token?: string;
  configType: 'aethel' | 'discloud';
  rawLines: Record<string, string>;
}

