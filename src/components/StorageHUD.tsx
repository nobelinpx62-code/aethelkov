'use client';

import React from 'react';
import { HardDrive, AlertTriangle } from 'lucide-react';

interface StorageHUDProps {
  usedBytes: number;
}

export const StorageHUD: React.FC<StorageHUDProps> = ({ usedBytes }) => {
  const quotaBytes = 100 * 1024 * 1024; // 100 MB estritos
  const usedMb = usedBytes / (1024 * 1024);
  const percentage = Math.min(Math.round((usedBytes / quotaBytes) * 100), 100);
  const isNearLimit = percentage > 85;
  const availableMb = Math.max(100 - usedMb, 0).toFixed(1);

  return (
    <div className="apple-glass-card relative overflow-hidden rounded-[28px] p-6 border border-white/12">
      <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
      
      <div className="flex items-center justify-between mb-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-0.5 font-mono text-[10px] text-neutral-300 uppercase">
          <HardDrive className="h-3 w-3 text-cyan-300" />
          Armazenamento Vault
        </span>
        <span className="font-mono text-xs text-emerald-400 font-medium">100% Saudável</span>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-3xl font-semibold tracking-tight text-white font-mono">
          {usedMb.toFixed(1)} <span className="text-sm text-neutral-500 font-normal">MB</span>
        </span>
        <span className="font-mono text-xs text-neutral-400">Limite: 100.0 MB</span>
      </div>

      {/* Barra Líquida Apple Material */}
      <div className="liquid-track h-3 w-full rounded-full p-0.5 mb-2">
        <div 
          className={`liquid-fill h-full rounded-full transition-all duration-700 ${
            isNearLimit ? 'bg-gradient-to-r from-amber-500 to-rose-500' : ''
          }`} 
          style={{ width: `${Math.max(percentage, 2)}%` }}
        ></div>
      </div>
      
      <p className="font-mono text-[11px] text-neutral-400">
        {availableMb} MB disponíveis para novos pacotes e scripts
      </p>

      {isNearLimit && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Atenção: Armazenamento próximo à cota de 100 MB.</span>
        </div>
      )}
    </div>
  );
};
