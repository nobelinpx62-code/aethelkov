import { supabase } from './supabase';

export interface AppEnvVars {
  appId: string;
  vars: Record<string, string>;
  updatedAt: string;
}

/**
 * Salva e persiste variáveis de ambiente para uma aplicação no Supabase
 */
export async function saveAppEnvVars(
  appId: string,
  vars: Record<string, string>,
  botName?: string
): Promise<{ success: boolean; error?: string }> {
  if (!appId) {
    return { success: false, error: 'ID da aplicação não fornecido.' };
  }

  const payload: AppEnvVars = {
    appId,
    vars,
    updatedAt: new Date().toISOString(),
  };

  try {
    // 1. Grava no log de auditoria permanente do Supabase
    await supabase.from('aethel_logs').insert({
      bot_id: appId,
      log_level: 'DISPATCH',
      message: `[APP_ENV_VARS] ${JSON.stringify(payload)}`,
    });

    // 2. Registra o evento de reinicialização para carregar as novas variáveis
    await supabase.from('aethel_logs').insert({
      bot_id: appId,
      log_level: 'INFO',
      message: `[Aethel-Runner] ${Object.keys(vars).length} variáveis de ambiente sincronizadas com sucesso para "${botName || appId}". Processo reiniciado com novas chaves!`,
    });

    return { success: true };
  } catch (err: any) {
    console.error('[EnvVarsService] Erro ao salvar variáveis:', err);
    return { success: false, error: err.message || 'Falha ao sincronizar variáveis de ambiente.' };
  }
}

/**
 * Carrega as variáveis de ambiente mais recentes salvas para a aplicação
 */
export async function loadAppEnvVars(appId: string): Promise<Record<string, string>> {
  if (!appId) return {};

  try {
    const { data: logs, error } = await supabase
      .from('aethel_logs')
      .select('*')
      .eq('bot_id', appId)
      .ilike('message', '[APP_ENV_VARS]%')
      .order('id', { ascending: false })
      .limit(1);

    if (error || !logs || logs.length === 0) {
      return {};
    }

    const raw = logs[0].message.replace('[APP_ENV_VARS] ', '');
    const parsed: AppEnvVars = JSON.parse(raw);
    return parsed.vars || {};
  } catch (err) {
    console.error('[EnvVarsService] Erro ao carregar variáveis:', err);
    return {};
  }
}
