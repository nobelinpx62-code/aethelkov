'use client';

export interface AethelSubdomain {
  id: string;
  user_id: string;
  subdomain: string;
  target_bot_id?: string | null;
  target_bot_name?: string | null;
  full_url: string;
  status: 'AVAILABLE' | 'LINKED';
  created_at: string;
  ssl_active: boolean;
  ram_allocated_mb: number;
}

const STORAGE_KEY = 'aethel_registered_subdomains';

const RESERVED_SUBDOMAINS = [
  'admin',
  'api',
  'auth',
  'login',
  'signup',
  'root',
  'aethel',
  'aethelkov',
  'farol',
  'discloud',
  'dashboard',
  'control',
  'status',
  'cdn',
  'system',
  'mail',
  'smtp',
  'dev',
  'staging',
  'test',
  'beta',
];

export function validateSubdomainName(raw: string): { valid: boolean; error?: string } {
  const clean = raw.trim().toLowerCase();

  if (!clean) {
    return { valid: false, error: 'O nome do subdomínio não pode estar vazio.' };
  }

  if (clean.length < 3) {
    return { valid: false, error: 'O subdomínio deve ter no mínimo 3 caracteres.' };
  }

  if (clean.length > 28) {
    return { valid: false, error: 'O subdomínio pode ter no máximo 28 caracteres.' };
  }

  // Apenas letras minúsculas, números e hífens, sem começar ou terminar com hífen
  const regex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!regex.test(clean)) {
    return {
      valid: false,
      error: 'Use apenas letras minúsculas (a-z), números (0-9) e traços (-). Não pode iniciar nem terminar com traço.',
    };
  }

  if (RESERVED_SUBDOMAINS.includes(clean)) {
    return { valid: false, error: `O subdomínio "${clean}" é reservado pelo núcleo da Aethel Kov.` };
  }

  return { valid: true };
}

export function getAllRegisteredSubdomains(): AethelSubdomain[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Subdomínios demonstrativos iniciais
      const initial: AethelSubdomain[] = [
        {
          id: 'sub-welcome-1',
          user_id: 'default',
          subdomain: 'demo-proxy',
          target_bot_id: null,
          target_bot_name: null,
          full_url: 'https://demo-proxy.aethel.app',
          status: 'AVAILABLE',
          created_at: new Date().toISOString(),
          ssl_active: true,
          ram_allocated_mb: 512,
        },
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getUserSubdomains(userId: string): AethelSubdomain[] {
  const all = getAllRegisteredSubdomains();
  return all.filter((s) => s.user_id === userId || s.user_id === 'default');
}

export function isSubdomainTaken(subdomain: string): boolean {
  const clean = subdomain.trim().toLowerCase();
  const all = getAllRegisteredSubdomains();
  return all.some((s) => s.subdomain === clean);
}

export function createSubdomain(
  userId: string,
  subdomain: string
): { success: boolean; subdomain?: AethelSubdomain; error?: string } {
  const validation = validateSubdomainName(subdomain);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  const clean = subdomain.trim().toLowerCase();

  if (isSubdomainTaken(clean)) {
    return { success: false, error: `O subdomínio "${clean}.aethel.app" já foi registrado por outro usuário.` };
  }

  const userSubs = getUserSubdomains(userId);
  if (userSubs.length >= 3 && userId !== '1313535117792378891') {
    return {
      success: false,
      error: 'Você atingiu o limite de 3 subdomínios gratuitos. Resgate um código promo ou contate a moderação.',
    };
  }

  const newSub: AethelSubdomain = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: userId,
    subdomain: clean,
    target_bot_id: null,
    target_bot_name: null,
    full_url: `https://${clean}.aethel.app`,
    status: 'AVAILABLE',
    created_at: new Date().toISOString(),
    ssl_active: true,
    ram_allocated_mb: 512,
  };

  const all = getAllRegisteredSubdomains();
  all.push(newSub);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    console.error('Falha ao persistir subdomínio:', e);
  }

  return { success: true, subdomain: newSub };
}

export function linkSubdomainToInstance(
  subdomain: string,
  botId: string,
  botName: string
): boolean {
  const clean = subdomain.trim().toLowerCase();
  const all = getAllRegisteredSubdomains();
  const idx = all.findIndex((s) => s.subdomain === clean);

  if (idx === -1) return false;

  all[idx] = {
    ...all[idx],
    target_bot_id: botId,
    target_bot_name: botName,
    status: 'LINKED',
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    return true;
  } catch {
    return false;
  }
}

export function deleteSubdomain(subdomainId: string): boolean {
  const all = getAllRegisteredSubdomains();
  const filtered = all.filter((s) => s.id !== subdomainId);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

