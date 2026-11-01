'use client';

import React, { useState } from 'react';
import { Lock, X, ShieldAlert, KeyRound } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// SHA-256 hash da senha mestra 'kauan0906'
const MASTER_HASH = '24a681b8aeaec74ba8038daad78eacbf8140a399b4e3d468885940a188962677';

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(false);

    try {
      // Computa hash SHA-256 via Web Crypto API nativa do navegador
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      if (hashHex === MASTER_HASH) {
        sessionStorage.setItem('aethel_admin_auth', 'true');
        setPassword('');
        onSuccess();
      } else {
        setError(true);
        setPassword('');
      }
    } catch (_) {
      setError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="liquid-glass w-full max-w-md rounded-3xl p-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
        {/* Top Glow Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                Aethelkov Mesh Commander
              </h3>
              <p className="text-xs text-slate-400">
                Acesso Restrito ao Painel de Infraestrutura
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Chave de acesso inválida. Tentativa registrada.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Chave Criptográfica Mestra
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira a credencial mestra..."
                className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono tracking-wider"
              />
              <KeyRound className="absolute right-3 top-2.5 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="capsule-btn capsule-btn-secondary text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isVerifying || !password}
              className="capsule-btn capsule-btn-primary text-xs"
            >
              {isVerifying ? 'Validando Hash...' : 'Desbloquear Painel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
