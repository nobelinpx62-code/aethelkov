'use client';

import React from 'react';
import { DollarSign, Cpu, Activity, Layers, HardDrive } from 'lucide-react';
import { ClusterStats } from '@/lib/types';

interface MetricsBannerProps {
  stats: ClusterStats;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Cartão 1: Instâncias Ativas */}
      <div className="apple-glass-card relative overflow-hidden rounded-[28px] p-6 border border-white/12">
        <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[10px] text-neutral-300 uppercase">
            <Cpu className="h-3 w-3 text-indigo-300" />
            Processos Ativos
          </span>
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
        </div>
        <div className="text-3xl font-semibold tracking-tight text-white font-mono mb-1">
          {stats.online_bots} <span className="text-sm font-normal text-neutral-500">/ {stats.total_bots}</span>
        </div>
        <p className="text-xs text-neutral-400">
          Discord: <strong className="text-white">{stats.discord_bots}</strong> &bull; Telegram: <strong className="text-white">{stats.telegram_bots}</strong>
        </p>
      </div>

      {/* Cartão 2: Custo & Soberania */}
      <div className="apple-glass-card relative overflow-hidden rounded-[28px] p-6 border border-white/12">
        <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[10px] text-neutral-300 uppercase">
            <DollarSign className="h-3 w-3 text-emerald-300" />
            Custo Operacional
          </span>
          <span className="font-mono text-[10px] text-emerald-400 font-semibold">100% FREE</span>
        </div>
        <div className="text-3xl font-semibold tracking-tight text-emerald-400 font-mono mb-1">
          R$ 0,00
        </div>
        <p className="text-xs text-neutral-400">
          Zero VPS &bull; Desacoplamento Híbrido
        </p>
      </div>

      {/* Cartão 3: Heartbeat & Loop de Eventos */}
      <div className="apple-glass-card relative overflow-hidden rounded-[28px] p-6 border border-white/12">
        <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
        <div className="flex items-center justify-between mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 font-mono text-[10px] text-neutral-300 uppercase">
            <Activity className="h-3 w-3 text-cyan-300" />
            Loop de Eventos
          </span>
          <span className="font-mono text-[10px] text-cyan-400">0.8s</span>
        </div>
        <div className="text-3xl font-semibold tracking-tight text-white font-mono mb-1">
          99.98%
        </div>
        <p className="text-xs text-neutral-400">
          Uptime Gateway Discloud &bull; Vercel Runner
        </p>
      </div>
    </div>
  );
};
