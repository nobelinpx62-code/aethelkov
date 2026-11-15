import { supabase } from './supabase';
import { checkUserSubscription } from './subscriptionManager';

export interface SubdomainBinding {
  subdomain: string;
  appId: string;
  appName: string;
  userId: string;
  url: string;
  createdAt: string;
  status: 'ONLINE' | 'STOPPED';
}

export interface SubdomainQuota {
  maxSubdomains: number;
  usedSubdomains: number;
  remaining: number;
  planId: string;
}

const RESERVED_SUBDOMAINS = new Set([
  'api', 'admin', 'app', 'www', 'mail', 'dashboard', 'status',
  'ns1', 'ns2', 'farol', 'discloud', 'staging', 'dev', 'internal',
  'aethel', 'aethelkov', 'root', 'webhook', 'webhooks', 'auth',
]);

const SUBDOMAIN_LIMITS_BY_TIER: Record<string, number> = {
  free: 1,
  '1gb': 5,
  '2gb': 10,
  '4gb': 15,
  '8gb': 20,
};

/**
 * Valida formato do subdomínio:
 * Deve ter de 3 a 32 caracteres, apenas letras minúsculas, números e hífens.
 */
export function validateSubdomainFormat(subdomain: string): { valid: boolean; error?: string } {
  const clean = subdomain.trim().toLowerCase();
  if (clean.length < 3) {
    return { valid: false, error: 'O subdomínio deve ter pelo menos 3 caracteres.' };
  }
  if (clean.length > 32) {
    return { valid: false, error: 'O subdomínio pode ter no máximo 32 caracteres.' };
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(clean)) {
    return {
      valid: false,
      error: 'O subdomínio só pode conter letras minúsculas, números e hífens (não pode iniciar ou terminar com hífen).',
    };
  }
  if (RESERVED_SUBDOMAINS.has(clean)) {
    return { valid: false, error: `O subdomínio "${clean}" é reservado pelo sistema.` };
  }
  return { valid: true };
}

/**
 * Consulta a cota de subdomínios do usuário com base no plano ativo
 */
export async function getUserSubdomainQuota(userId?: string): Promise<SubdomainQuota> {
  const sub = await checkUserSubscription(userId);
  const planId = sub.isActive ? sub.planId : 'free';
  const maxSubdomains = SUBDOMAIN_LIMITS_BY_TIER[planId] || 1;

  const userSubdomains = await listUserSubdomains(userId);
  const usedSubdomains = userSubdomains.length;

  return {
    maxSubdomains,
    usedSubdomains,
    remaining: Math.max(0, maxSubdomains - usedSubdomains),
    planId,
  };
}

/**
 * Lista todos os subdomínios do usuário
 */
export async function listUserSubdomains(userId?: string): Promise<SubdomainBinding[]> {
  const cleanUserId = userId ? String(userId).trim().toLowerCase() : '';

  try {
    // 1. Busca todos os registros de subdomínios vinculados
    const { data: logs, error } = await supabase
      .from('aethel_logs')
      .select('*')
      .ilike('message', '[SUBDOMAIN_%')
      .order('id', { ascending: false })
      .limit(100);

    if (error || !logs) return [];

    // Mapeia histórico para o estado mais recente de cada subdomínio
    const bindingsMap = new Map<string, SubdomainBinding>();

    // Processa do mais antigo para o mais novo
    const reversed = [...logs].reverse();
    for (const log of reversed) {
      if (log.message.startsWith('[SUBDOMAIN_BIND] ')) {
        try {
          const raw = log.message.replace('[SUBDOMAIN_BIND] ', '');
          const data = JSON.parse(raw);
          if (data.subdomain) {
            bindingsMap.set(data.subdomain.toLowerCase(), {
              subdomain: data.subdomain.toLowerCase(),
              appId: data.appId || '',
              appName: data.appName || data.subdomain,
              userId: data.userId || 'default-user',
              url: `https://${data.subdomain.toLowerCase()}.linkthelkov.online`,
              createdAt: data.createdAt || log.created_at,
              status: data.status || 'ONLINE',
            });
          }
        } catch (_) {}
      } else if (log.message.startsWith('[SUBDOMAIN_UNBIND] ')) {
        try {
          const raw = log.message.replace('[SUBDOMAIN_UNBIND] ', '');
          const data = JSON.parse(raw);
          if (data.subdomain) {
            bindingsMap.delete(data.subdomain.toLowerCase());
          }
        } catch (_) {}
      }
    }

    // Filtra pelo usuário se fornecido
    const results = Array.from(bindingsMap.values());
    if (!cleanUserId) return results;

    return results.filter((b) => {
      const bUser = String(b.userId || '').trim().toLowerCase();
      if (!cleanUserId || bUser === 'default-user' || bUser === 'anon') return true;
      if (bUser === cleanUserId) return true;
      return cleanUserId.startsWith(bUser.slice(0, 24)) || bUser.startsWith(cleanUserId.slice(0, 24));
    });
  } catch (err) {
    console.error('[SubdomainManager] Erro ao listar subdomínios:', err);
    return [];
  }
}

/**
 * Verifica se um subdomínio está disponível para uso
 */
export async function isSubdomainAvailable(subdomain: string, currentAppId?: string): Promise<boolean> {
  const clean = subdomain.trim().toLowerCase();
  const formatCheck = validateSubdomainFormat(clean);
  if (!formatCheck.valid) return false;

  const allSubdomains = await listUserSubdomains();
  const existing = allSubdomains.find((s) => s.subdomain === clean);
  if (!existing) return true;
  if (currentAppId && existing.appId === currentAppId) return true;
  return false;
}

/**
 * Registra ou vincula um subdomínio a uma aplicação
 */
export async function registerSubdomain(params: {
  subdomain: string;
  appId: string;
  appName: string;
  userId?: string;
}): Promise<{ success: boolean; url?: string; error?: string }> {
  const clean = params.subdomain.trim().toLowerCase();

  // 1. Valida formato
  const formatCheck = validateSubdomainFormat(clean);
  if (!formatCheck.valid) {
    return { success: false, error: formatCheck.error };
  }

  // 2. Valida disponibilidade
  const available = await isSubdomainAvailable(clean, params.appId);
  if (!available) {
    return {
      success: false,
      error: `O subdomínio "${clean}.linkthelkov.online" já está em uso por outro projeto. Escolha outro nome.`,
    };
  }

  // 3. Valida cota do usuário
  const quota = await getUserSubdomainQuota(params.userId);
  const existingUserSubdomains = await listUserSubdomains(params.userId);
  const isUpdatingSameApp = existingUserSubdomains.some((s) => s.subdomain === clean && s.appId === params.appId);

  if (!isUpdatingSameApp && quota.usedSubdomains >= quota.maxSubdomains) {
    return {
      success: false,
      error: `Limite de subdomínios atingido! Seu plano atual permite até ${quota.maxSubdomains} subdomínio(s). Faça upgrade de plano para adicionar mais.`,
    };
  }

  const payload: SubdomainBinding = {
    subdomain: clean,
    appId: params.appId,
    appName: params.appName,
    userId: params.userId || 'default-user',
    url: `https://${clean}.linkthelkov.online`,
    createdAt: new Date().toISOString(),
    status: 'ONLINE',
  };

  try {
    await supabase.from('aethel_logs').insert({
      log_level: 'INFO',
      message: `[SUBDOMAIN_BIND] ${JSON.stringify(payload)}`,
    });

    // Se o botId existir, atualiza na tabela aethel_bots
    if (params.appId) {
      try {
        await supabase
          .from('aethel_bots')
          .update({
            assigned_node: `site:${clean}`,
          })
          .eq('id', params.appId);
      } catch (_) {}
    }

    return { success: true, url: payload.url };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao registrar subdomínio.' };
  }
}

/**
 * Remove / desvincula um subdomínio
 */
export async function deleteSubdomain(subdomain: string, userId?: string): Promise<{ success: boolean; error?: string }> {
  const clean = subdomain.trim().toLowerCase();

  try {
    await supabase.from('aethel_logs').insert({
      log_level: 'INFO',
      message: `[SUBDOMAIN_UNBIND] ${JSON.stringify({ subdomain: clean, userId: userId || 'default-user', removedAt: new Date().toISOString() })}`,
    });

    // Desvincula também do aethel_bots se houver
    try {
      await supabase
        .from('aethel_bots')
        .update({ assigned_node: 'farol-alpha' })
        .eq('assigned_node', `site:${clean}`);
    } catch (_) {}

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao desvincular subdomínio.' };
  }
}
