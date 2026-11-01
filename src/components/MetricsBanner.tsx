'use client';

import React from 'react';
import { Cpu, Activity, HardDrive, AlertTriangle } from 'lucide-react';
import { ClusterStats, AethelBot } from '@/lib/types';

interface MetricsBannerProps {
  stats: ClusterStats;
  bots?: AethelBot[];
  extraRamMb?: number;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ stats, bots = [], extraRamMb = 0 }) => {
  const quotaMb = 100 + extraRamMb;
  // Todas as instâncias cadastradas (sejam online ou paradas) reservam no mínimo 100 MB da cota
  const allocatedRam = bots.reduce((sum, b) => sum + Math.max(b.ram_limit_mb || 100, 100), 0);
  const usedRamMb = Math.min(allocatedRam, quotaMb);
  const usagePercent = Math.min(Math.round((usedRamMb / quotaMb) * 100), 100);
  const isAtLimit = allocatedRam >= quotaMb;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
      {/* Bloco 1: Processos Ativos */}
      <div className="apple-glass-card relative overflow-hidden rounded-[28px] p-6 border border-white/12 flex flex-col justify-between transition-all duration-300 hover:border-white/25">
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

        {/* Cabeçalho do Bloco */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <Cpu className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Processos Ativos
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400 font-medium shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
            <span>Online</span>
          </div>
        </div>

        {/* Métrica Central */}
        <div className="my-2">
          <div className="text-4xl md:text-5xl font-bold tracking-tight text-white font-mono flex items-baseline">
            <span>{stats.online_bots}</span>
            <span className="text-base md:text-lg font-normal text-neutral-500 ml-2">/ {stats.total_bots}</span>
          </div>
        </div>

        {/* Sub-texto */}
        <div className="pt-3 border-t border-white/5 font-mono text-xs text-neutral-400">
          Discord: <strong className="text-neutral-200">{stats.discord_bots}</strong> &bull; Telegram: <strong className="text-neutral-200">{stats.telegram_bots}</strong>
        </div>
      </div>

      {/* Bloco 2: Cota de Memória (100 MB Estrito) */}
      <div className={`apple-glass-card relative overflow-hidden rounded-[28px] p-6 border flex flex-col justify-between transition-all duration-300 ${isAtLimit ? 'border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]' : 'border-white/12 hover:border-white/25'
        }`}>
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

        {/* Cabeçalho do Bloco */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)] ${isAtLimit
                ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}>
              <HardDrive className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Cota de Memória
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium shrink-0 ${isAtLimit
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              : usagePercent > 0
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border border-white/10 text-neutral-400'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isAtLimit ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e] animate-pulse' : 'bg-emerald-400'
              }`}></span>
            <span>{isAtLimit ? '100% Cota' : `${usagePercent}% em uso`}</span>
          </div>
        </div>

        {/* Métrica Central */}
        <div className="my-2">
          <div className="text-4xl md:text-5xl font-bold tracking-tight text-white font-mono flex items-baseline">
            <span>{usedRamMb} MB</span>
            <span className="text-base md:text-lg font-normal text-neutral-500 ml-2">/ {quotaMb} MB</span>
          </div>

          {/* Barra de Progresso da Cota */}
          <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden mt-3 p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isAtLimit
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]'
                  : usagePercent > 70
                    ? 'bg-gradient-to-r from-cyan-400 to-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                    : 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                }`}
              style={{ width: `${Math.max(usagePercent, bots.length > 0 ? 6 : 0)}%` }}
            ></div>
          </div>
        </div>

        {/* Sub-texto Exato com indicação clara de reserva de cota */}
        <div className="pt-3 border-t border-white/5 font-mono text-xs flex items-center justify-between">
          <span className={isAtLimit ? 'text-rose-300 font-semibold' : 'text-neutral-300'}>
            {isAtLimit
              ? `Cota esgotada: ${allocatedRam} MB / ${quotaMb} MB (100% reservado)`
              : `${allocatedRam} MB de ${quotaMb} MB reservado (${bots.length} aplicação)`}
          </span>
          {isAtLimit && (
            <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
              100% Cota
            </span>
          )}
        </div>
      </div>

      {/* Bloco 3: Loop de Eventos & Gateway */}
      <div className="apple-glass-card relative overflow-hidden rounded-[28px] p-6 border border-white/12 flex flex-col justify-between transition-all duration-300 hover:border-white/25">
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

        {/* Cabeçalho do Bloco */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-semibold text-neutral-300 uppercase tracking-wider">
              Loop de Eventos
            </span>
          </div>

          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyan-400 font-semibold shrink-0">
            0.8s sync
          </span>
        </div>

        {/* Métrica Central */}
        <div className="my-2">
          <div className="text-4xl md:text-5xl font-bold tracking-tight text-white font-mono">
            99.98%
          </div>
        </div>

        {/* Sub-texto */}
        <div className="pt-3 border-t border-white/5 font-mono text-xs text-neutral-400">
          Alta Disponibilidade 24/7
        </div>
      </div>
    </div>
  );
};
