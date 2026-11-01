'use client';

import React, { useState } from 'react';
import { Gift, Sparkles, Check, X, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserGift, redeemCodeForUser, claimGift } from '@/lib/promoService';

interface GiftCelebrationModalProps {
  pendingGift: UserGift | null;
  isOpenRedeemModal: boolean;
  userKey: string;
  onCloseRedeemModal: () => void;
  onGiftClaimed: (gift: UserGift) => void;
  onCodeRedeemed: (ramMb: number, message: string) => void;
}

export const GiftCelebrationModal: React.FC<GiftCelebrationModalProps> = ({
  pendingGift,
  isOpenRedeemModal,
  userKey,
  onCloseRedeemModal,
  onGiftClaimed,
  onCodeRedeemed,
}) => {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. MODAL CELEBRATIVO DE PRESENTE RECEBIDO
  if (pendingGift) {
    const isTemp = pendingGift.is_temporary;
    const durationText = isTemp ? `${pendingGift.duration_days || 30} dias de validade` : 'Sem expiração (Permanente)';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
        <div className="apple-glass-card rounded-[36px] max-w-md w-full p-7 md:p-8 border border-pink-500/30 relative overflow-hidden shadow-[0_0_60px_rgba(236,72,153,0.3)] text-center space-y-6">
          <div className="glass-specular pointer-events-none absolute inset-x-12 top-0 h-[1.5px]"></div>

          {/* Ícone Animado de Presente */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-pink-500/30 to-purple-500/30 animate-ping opacity-60"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-xl shadow-pink-500/40">
              <Gift className="w-10 h-10 animate-bounce" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 font-mono text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Presente Exclusivo Aethel Kov</span>
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">
              Você Ganhou um Presente!
            </h3>
            <p className="text-xs text-neutral-400 font-sans">
              A moderação da Aethel Kov concedeu memória RAM extra para a sua conta.
            </p>
          </div>

          {/* Card com a quantidade e motivo */}
          <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-2 text-left font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400 uppercase">Bônus de RAM</span>
              <span className="text-lg font-bold text-emerald-400">+{pendingGift.ram_mb} MB</span>
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 border-t border-white/5 pt-1.5">
              <span>Validade:</span>
              <span className="text-neutral-200">{durationText}</span>
            </div>
            <div className="border-t border-white/5 pt-2">
              <span className="text-[10px] text-neutral-500 uppercase block mb-0.5">Motivo do Presente</span>
              <p className="text-xs text-neutral-300 italic">&quot;{pendingGift.reason}&quot;</p>
            </div>
          </div>

          {/* Botão de Resgate */}
          <button
            onClick={() => {
              const claimed = claimGift(pendingGift.id, userKey);
              if (claimed) {
                onGiftClaimed(claimed);
              }
            }}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-semibold text-white text-sm transition-all shadow-[0_8px_24px_rgba(16,185,129,0.35)] active:scale-98 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>Resgatar e Ativar Bônus de RAM</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. MODAL DE RESGATAR CÓDIGO PROMOCIONAL
  if (isOpenRedeemModal) {
    const handleRedeem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!promoCode.trim()) return;

      setLoading(true);
      setErrorMsg(null);

      const result = redeemCodeForUser(promoCode, userKey);
      setLoading(false);

      if (result.success) {
        onCodeRedeemed(result.ram_mb || 0, result.message);
        setPromoCode('');
        onCloseRedeemModal();
      } else {
        setErrorMsg(result.message);
      }
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fadeIn">
        <div className="apple-glass-card rounded-[32px] max-w-md w-full p-7 border border-white/15 relative overflow-hidden shadow-2xl space-y-5">
          <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Resgatar Código Promocional</h3>
                <p className="text-xs text-neutral-400">Ganhe bônus de RAM para suas instâncias</p>
              </div>
            </div>

            <button
              onClick={onCloseRedeemModal}
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleRedeem} className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-neutral-300 mb-1.5 font-medium">
                Insira o Código do Cupom
              </label>
              <input
                type="text"
                required
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Ex: AETHEL2026, RAMBOOST"
                className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/10 text-white font-bold text-sm uppercase focus:outline-none focus:border-pink-400 tracking-wider"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(255,255,255,0.2)] disabled:opacity-50"
            >
              <span>{loading ? 'Validando...' : 'Resgatar Bônus de RAM'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return null;
};
