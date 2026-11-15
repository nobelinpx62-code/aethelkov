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
 * Registra a ativação de um plano por 30 dias
 */
export async function activatePlanSubscription(
  userId: string,
  planId: string,
  ramMb: number
): Promise<PlanSubscription> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const payload = {
    userId: userId || 'default-user',
    planId,
    ramMb,
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  // 1. Salva o registro de assinatura nos logs permanentes
  try {
    await supabase.from('aethel_logs').insert({
      log_level: 'INFO',
      message: `[PLAN_SUBSCRIPTION] ${JSON.stringify(payload)}`,
    });
  } catch (err) {
    console.error('[Subscription] Erro ao gravar log de assinatura:', err);
  }

  // 2. Atualiza a cota real no perfil
  try {
    if (userId && userId !== 'default-user' && userId !== 'anon') {
      await supabase
        .from('profiles')
        .update({ quota_limit_mb: ramMb, updated_at: now.toISOString() })
        .eq('id', userId);
    } else {
      await supabase
        .from('profiles')
        .update({ quota_limit_mb: ramMb, updated_at: now.toISOString() })
        .not('id', 'is', null);
    }
  } catch (err) {
    console.error('[Subscription] Erro ao atualizar quota_limit_mb:', err);
  }

  return {
    ...payload,
    daysRemaining: 30,
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
    // Busca a assinatura mais recente nos logs
    let query = supabase
      .from('aethel_logs')
      .select('*')
      .ilike('message', '[PLAN_SUBSCRIPTION]%')
      .order('id', { ascending: false })
      .limit(10);

    const { data: logs, error } = await query;
    if (error || !logs || logs.length === 0) {
      return defaultFree;
    }

    // Encontra o log do usuário correspondente
    let matchedLog = logs.find((l) => {
      try {
        const rawJson = l.message.replace('[PLAN_SUBSCRIPTION] ', '');
        const parsed = JSON.parse(rawJson);
        return !userId || parsed.userId === userId || parsed.userId === 'default-user';
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
        planId: subData.planId,
        ramMb: subData.ramMb,
        activatedAt: subData.activatedAt,
        expiresAt: subData.expiresAt,
        daysRemaining,
        isActive: true,
        isExpired: false,
      };
    }

    // ========================================================
    // PLANO EXPIRADO APÓS 30 DIAS: RETORNA AUTOMATICAMENTE AO FREE
    // ========================================================
    console.warn(`[Subscription] Plano ${subData.planId.toUpperCase()} do usuário expirou após 30 dias!`);

    // 1. Rebaixa a cota no perfil de volta para 100 MB
    try {
      if (userId && userId !== 'default-user') {
        await supabase
          .from('profiles')
          .update({ quota_limit_mb: 100, updated_at: now.toISOString() })
          .eq('id', userId);
      } else {
        await supabase
          .from('profiles')
          .update({ quota_limit_mb: 100, updated_at: now.toISOString() })
          .not('id', 'is', null);
      }
    } catch (_) {}

    // 2. Se tiver bots excedendo os 100 MB do Starter, pausa os bots excedentes
    try {
      const { data: userBots } = await supabase
        .from('aethel_bots')
        .select('id, ram_limit_mb, status');

      if (userBots && userBots.length > 1) {
        // Mantém apenas o primeiro bot e pausa os demais
        const botsToStop = userBots.slice(1).map((b) => b.id);
        await supabase
          .from('aethel_bots')
          .update({ status: 'STOPPED' })
          .in('id', botsToStop);
      }
    } catch (_) {}

    // 3. Registra log de expiração
    try {
      await supabase.from('aethel_logs').insert({
        log_level: 'WARN',
        message: `[PLAN_EXPIRED] Plano ${subData.planId.toUpperCase()} expirou após 30 dias. A cota foi rebaixada para 100 MB (Starter Free).`,
      });
    } catch (_) {}

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
