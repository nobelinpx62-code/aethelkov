import { supabase } from './supabase';

export interface PlanSubscription {
  userId: string;
  planId: string;
  ramMb: number;
  activatedAt: string;
  expiresAt: string;
  daysRemaining: number;
  isActive: boolean;
  isExpired: boolean;
}

/**
 * Registra a ativação ou upgrade de um plano
 * Se isUpgrade = true, mantém os dias restantes da assinatura atual (continua nos mesmos dias)
 */
export async function activatePlanSubscription(
  userId: string,
  planId: string,
  ramMb: number,
  isUpgrade: boolean = false
): Promise<PlanSubscription> {
  const now = new Date();
  let expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Se for upgrade de plano ativo, mantém exatamente a mesma data de expiração da assinatura atual
  if (isUpgrade) {
    try {
      const currentSub = await checkUserSubscription(userId);
      if (currentSub.isActive && currentSub.expiresAt) {
        expiresAt = new Date(currentSub.expiresAt);
      }
    } catch (_) {}
  }

  const payload = {
    userId: userId || 'default-user',
    planId: planId || '1gb',
    ramMb: ramMb || 1024,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    isUpgrade,
  };

  // 1. Salva o registro de assinatura nos logs permanentes do Supabase
  try {
    await supabase.from('aethel_logs').insert({
      log_level: 'INFO',
      message: `[PLAN_SUBSCRIPTION] ${JSON.stringify(payload)}`,
    });
  } catch (err) {
    console.error('[Subscription] Erro ao gravar log de assinatura:', err);
  }

  // 2. Tenta atualizar a cota no perfil (caso RLS permita)
  try {
    if (userId && userId !== 'default-user' && userId !== 'anon') {
      await supabase
        .from('profiles')
        .update({ quota_limit_mb: ramMb, updated_at: now.toISOString() })
        .eq('id', userId);
    }
  } catch (_) {}

  const msRemaining = expiresAt.getTime() - now.getTime();
  const daysRemaining = Math.max(1, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

  return {
    ...payload,
    daysRemaining,
    isActive: true,
    isExpired: false,
  };
}

/**
 * Consulta o status da assinatura do usuário, calcula dias restantes e expira se passar dos 30 dias
 */
export async function checkUserSubscription(userId?: string): Promise<PlanSubscription> {
  const defaultFree: PlanSubscription = {
    userId: userId || 'default-user',
    planId: 'free',
    ramMb: 100,
    activatedAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(),
    daysRemaining: 0,
    isActive: false,
    isExpired: false,
  };

  try {
    // Busca as assinaturas mais recentes nos logs do Supabase
    const { data: logs, error } = await supabase
      .from('aethel_logs')
      .select('*')
      .ilike('message', '[PLAN_SUBSCRIPTION]%')
      .order('id', { ascending: false })
      .limit(25);

    if (error || !logs || logs.length === 0) {
      return defaultFree;
    }

    // Encontra o log do usuário correspondente (tolerante a prefixos UUID)
    const cleanUserId = userId ? String(userId).trim().toLowerCase() : '';

    let matchedLog = logs.find((l) => {
      try {
        const rawJson = l.message.replace('[PLAN_SUBSCRIPTION] ', '');
        const parsed = JSON.parse(rawJson);
        const subUserId = String(parsed.userId || '').trim().toLowerCase();

        if (!cleanUserId || subUserId === 'default-user' || subUserId === 'anon') return true;
        if (subUserId === cleanUserId) return true;
        // Tolera UUID cortado
        if (cleanUserId.startsWith(subUserId.slice(0, 24)) || subUserId.startsWith(cleanUserId.slice(0, 24))) return true;

        return false;
      } catch {
        return false;
      }
    });

    if (!matchedLog) {
      return defaultFree;
    }

    const rawJson = matchedLog.message.replace('[PLAN_SUBSCRIPTION] ', '');
    const subData = JSON.parse(rawJson);

    const now = new Date();
    const expiresDate = new Date(subData.expiresAt);
    const msRemaining = expiresDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

    // Se ainda está no prazo dos 30 dias
    if (msRemaining > 0) {
      return {
        userId: subData.userId,
        planId: subData.planId || '1gb',
        ramMb: subData.ramMb || 1024,
        activatedAt: subData.activatedAt,
        expiresAt: subData.expiresAt,
        daysRemaining,
        isActive: true,
        isExpired: false,
      };
    }

    // Plano expirado após 30 dias
    return {
      userId: subData.userId,
      planId: subData.planId,
      ramMb: 100,
      activatedAt: subData.activatedAt,
      expiresAt: subData.expiresAt,
      daysRemaining: 0,
      isActive: false,
      isExpired: true,
    };
  } catch (err) {
    console.error('[Subscription] Erro ao verificar assinatura:', err);
    return defaultFree;
  }
}
