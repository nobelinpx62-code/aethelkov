'use client';

import React from 'react';
import { Cpu, Activity } from 'lucide-react';
import { ClusterStats } from '@/lib/types';

interface MetricsBannerProps {
  stats: ClusterStats;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
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

      {/* Bloco 2: Loop de Eventos & Gateway */}
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
          Rede Soberana Aethelkov &bull; Alta Disponibilidade 24/7
        </div>
      </div>
    </div>
  );
};
