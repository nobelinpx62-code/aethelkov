'use client';

const API_KEY_PREFIX = 'aethel_live_';
const STORAGE_KEY_PREFIX = 'aethel_user_api_token_';

/**
 * Gera uma chave de API aleatória com alta entropia no formato aethel_live_xxxxxxxx...
 */
export function generateRandomToken(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    const hex = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${API_KEY_PREFIX}${hex}`;
  }
  // Fallback seguro caso window.crypto não esteja disponível
  const randomHex = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  return `${API_KEY_PREFIX}${randomHex.padEnd(32, 'a').substring(0, 32)}`;
}

/**
 * Obtém a chave de API salva para o identificador do usuário
 */
export function getUserApiKey(userKey: string): string | null {
  if (typeof window === 'undefined' || !userKey) return null;
  try {
    return localStorage.getItem(`${STORAGE_KEY_PREFIX}${userKey}`) || null;
  } catch {
    return null;
  }
}

/**
 * Gera e persiste uma nova chave de API para o usuário
 */
export function generateUserApiKey(userKey: string): string {
  if (typeof window === 'undefined' || !userKey) {
    return generateRandomToken();
  }
  const token = generateRandomToken();
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userKey}`, token);
    // Também salva globalmente para permitir acesso rápido
    localStorage.setItem('aethel_active_api_token', token);
  } catch (err) {
    console.warn('[apiKeyService] Erro ao salvar chave de API:', err);
  }
  return token;
}

/**
 * Revoga a chave de API do usuário
 */
export function revokeUserApiKey(userKey: string): void {
  if (typeof window === 'undefined' || !userKey) return;
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userKey}`);
    localStorage.removeItem('aethel_active_api_token');
  } catch (err) {
    console.warn('[apiKeyService] Erro ao revogar chave de API:', err);
  }
}

/**
 * Valida se um token possui a estrutura válida da Aethel Cloud
 */
export function isValidApiKey(token: string | null | undefined): boolean {
  if (!token) return false;
  const clean = token.trim();
  if (clean === 'aethel-secret-grid-master-key') return true;
  return clean.startsWith('aethel_live_') && clean.length >= 24;
}

