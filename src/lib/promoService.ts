'use client';

export interface PromoCode {
  id: string;
  code: string;
  ram_mb: number;
  is_temporary: boolean;
  duration_days?: number;
  max_uses: number;
  current_uses: number;
  created_at: string;
}

export interface UserGift {
  id: string;
  recipient: string; // ID do Discord ou E-mail
  ram_mb: number;
  is_temporary: boolean;
  duration_days?: number;
  reason: string;
  claimed: boolean;
  claimed_at?: string;
  created_at: string;
}

export interface UserQuotaBonus {
  extra_ram_mb: number;
  active_gifts: UserGift[];
  redeemed_codes: string[];
}

const STORAGE_KEY_PROMOS = 'aethel_promo_codes_v1';
const STORAGE_KEY_GIFTS = 'aethel_user_gifts_v1';
const STORAGE_KEY_USER_BONUS = 'aethel_user_bonus_ram_';

// Carrega códigos salvos
export function getPromoCodes(): PromoCode[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROMOS);
    if (!raw) {
      // Códigos de exemplo iniciais
      const initial: PromoCode[] = [
        {
          id: 'promo-welcome',
          code: 'AETHEL2026',
          ram_mb: 100,
          is_temporary: true,
          duration_days: 30,
          max_uses: 100,
          current_uses: 0,
          created_at: new Date().toISOString(),
        },
      ];
      localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Salva códigos
export function savePromoCodes(codes: PromoCode[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(codes));
}

// Cria novo código promocional
export function createPromoCode(params: {
  code: string;
  ram_mb: number;
  is_temporary: boolean;
  duration_days?: number;
  max_uses: number;
}): PromoCode {
  const codes = getPromoCodes();
  const normalized = params.code.trim().toUpperCase();

  if (Number(params.ram_mb) < 100) {
    throw new Error('O valor do bônus deve ser de no mínimo 100 MB (100 MB = 1 aplicação adicional). Valores menores não são permitidos.');
  }

  const existing = codes.find((c) => c.code === normalized);
  if (existing) {
    throw new Error(`O código "${normalized}" já existe! Crie um código diferente.`);
  }

  const newCode: PromoCode = {
    id: 'promo-' + Date.now(),
    code: normalized,
    ram_mb: Math.max(Number(params.ram_mb) || 100, 100),
    is_temporary: params.is_temporary,
    duration_days: params.is_temporary ? params.duration_days || 7 : undefined,
    max_uses: params.max_uses || 1,
    current_uses: 0,
    created_at: new Date().toISOString(),
  };

  const updated = [newCode, ...codes];
  savePromoCodes(updated);
  return newCode;
}

// Deleta código
export function deletePromoCode(id: string): void {
  const codes = getPromoCodes().filter((c) => c.id !== id);
  savePromoCodes(codes);
}

// Carrega presentes enviados
export function getUserGifts(): UserGift[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GIFTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Salva presentes
export function saveUserGifts(gifts: UserGift[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_GIFTS, JSON.stringify(gifts));
}

// Envia presente direto para um usuário (por ID ou E-mail)
export function sendUserGift(params: {
  recipient: string;
  ram_mb: number;
  is_temporary: boolean;
  duration_days?: number;
  reason: string;
}): UserGift {
  const gifts = getUserGifts();
  const safeRam = Math.max(Number(params.ram_mb) || 100, 100);

  const newGift: UserGift = {
    id: 'gift-' + Date.now(),
    recipient: params.recipient.trim(),
    ram_mb: safeRam,
    is_temporary: params.is_temporary,
    duration_days: params.is_temporary ? params.duration_days || 30 : undefined,
    reason: params.reason.trim() || 'Presente exclusivo da moderação Aethel Kov',
    claimed: false,
    created_at: new Date().toISOString(),
  };

  const updated = [newGift, ...gifts];
  saveUserGifts(updated);
  return newGift;
}

// Busca presentes pendentes para o usuário logado
export function findPendingGiftsForUser(identifiers: string[]): UserGift[] {
  const gifts = getUserGifts();
  const normalizedIds = identifiers.filter(Boolean).map((id) => id.trim().toLowerCase());

  return gifts.filter((g) => {
    if (g.claimed) return false;
    const recipientNorm = g.recipient.toLowerCase();
    return normalizedIds.some((id) => id === recipientNorm || id.includes(recipientNorm) || recipientNorm.includes(id));
  });
}

// Resgata um presente pendente
export function claimGift(giftId: string, userKey: string): UserGift | null {
  const gifts = getUserGifts();
  let claimedGift: UserGift | null = null;

  const updated = gifts.map((g) => {
    if (g.id === giftId && !g.claimed) {
      claimedGift = {
        ...g,
        claimed: true,
        claimed_at: new Date().toISOString(),
      };
      return claimedGift;
    }
    return g;
  });

  if (claimedGift) {
    saveUserGifts(updated);
    addBonusRamToUser(userKey, (claimedGift as UserGift).ram_mb);
  }

  return claimedGift;
}

// Resgata um código promocional
export function redeemCodeForUser(code: string, userKey: string): { success: boolean; message: string; ram_mb?: number } {
  const codes = getPromoCodes();
  const normalized = code.trim().toUpperCase();

  const target = codes.find((c) => c.code === normalized);
  if (!target) {
    return { success: false, message: 'Código promocional inválido ou expirado.' };
  }

  if (target.current_uses >= target.max_uses) {
    return { success: false, message: 'Este código já atingiu o limite máximo de resgates.' };
  }

  const userBonus = getUserBonusData(userKey);
  if (userBonus.redeemed_codes.includes(normalized)) {
    return { success: false, message: 'Você já resgatou este código anteriormente em sua conta.' };
  }

  // Incrementa usos
  target.current_uses += 1;
  savePromoCodes(codes);

  // Adiciona ao usuário
  userBonus.redeemed_codes.push(normalized);
  userBonus.extra_ram_mb += target.ram_mb;
  saveUserBonusData(userKey, userBonus);

  const durationText = target.is_temporary ? ` válidos por ${target.duration_days} dias` : ' permanente sem expiração';

  return {
    success: true,
    message: `Parabéns! Você resgatou +${target.ram_mb} MB de RAM extra (${durationText})!`,
    ram_mb: target.ram_mb,
  };
}

// Obter bônus de RAM acumulado do usuário (garante remoção do bônus residual de 25 MB)
export function getUserBonusData(userKey: string): UserQuotaBonus {
  if (typeof window === 'undefined' || !userKey) {
    return { extra_ram_mb: 0, active_gifts: [], redeemed_codes: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER_BONUS + userKey);
    if (!raw) return { extra_ram_mb: 0, active_gifts: [], redeemed_codes: [] };
    const parsed: UserQuotaBonus = JSON.parse(raw);

    // Remove imediatamente os 25 MB residuais da conta admin
    if (parsed.extra_ram_mb === 25) {
      parsed.extra_ram_mb = 0;
      saveUserBonusData(userKey, parsed);
    } else if (parsed.extra_ram_mb > 0 && parsed.extra_ram_mb % 100 !== 0) {
      parsed.extra_ram_mb = Math.floor(parsed.extra_ram_mb / 100) * 100;
      saveUserBonusData(userKey, parsed);
    }

    return parsed;
  } catch {
    return { extra_ram_mb: 0, active_gifts: [], redeemed_codes: [] };
  }
}

// Salvar bônus de RAM do usuário
export function saveUserBonusData(userKey: string, data: UserQuotaBonus): void {
  if (typeof window === 'undefined' || !userKey) return;
  localStorage.setItem(STORAGE_KEY_USER_BONUS + userKey, JSON.stringify(data));
}

// Adiciona RAM extra ao usuário
export function addBonusRamToUser(userKey: string, ramMb: number): void {
  const bonus = getUserBonusData(userKey);
  bonus.extra_ram_mb += ramMb;
  saveUserBonusData(userKey, bonus);
}

