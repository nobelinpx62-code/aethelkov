'use client';

import React from 'react';
import { Database, AlertTriangle } from 'lucide-react';

interface StorageHUDProps {
  usedBytes: number;
}

export const StorageHUD: React.FC<StorageHUDProps> = ({ usedBytes }) => {
  const quotaBytes = 100 * 1024 * 1024; // 100 MB estritos
  const usedMb = usedBytes / (1024 * 1024);
  const percentage = Math.min(Math.round((usedBytes / quotaBytes) * 100), 100);
  const isNearLimit = percentage > 85;

  return (
    <div className="liquid-glass rounded-2xl p-6 relative overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide">
              HUD de Armazenamento Isolado
            </h3>
            <p className="text-xs text-slate-400">
              Cota estrita de 100 MB por instância / usuário
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold font-mono text-white">
            {usedMb.toFixed(1)} <span className="text-xs text-slate-400">/ 100 MB</span>
          </span>
          <div className="text-[11px] text-slate-400">
            {percentage}% alocado
          </div>
        </div>
      </div>

      {/* Optical Fluid Bar */}
      <div className="relative w-full h-3.5 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
        <div
          className={`h-full rounded-full transition-all duration-700 relative overflow-hidden ${
            isNearLimit
              ? 'bg-gradient-to-r from-amber-500 to-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
              : 'bg-gradient-to-r from-cyan-500 via-emerald-400 to-teal-300 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
          }`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        >
          {/* Subtle fluid wave shine */}
          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        </div>
      </div>

      {isNearLimit && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Atenção: Armazenamento próximo ao limite máximo de 100 MB.</span>
        </div>
      )}
    </div>
  );
};

