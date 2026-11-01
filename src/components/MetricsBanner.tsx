'use client';

import React from 'react';
import { DollarSign, Cpu, Activity, ShieldCheck, Zap } from 'lucide-react';
import { ClusterStats } from '@/lib/types';

interface MetricsBannerProps {
  stats: ClusterStats;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Card 1: Processos Ativos */}
      <div className="apple-glass-card relative overflow-hidden rounded-[26px] p-5 md:p-6 border border-white/12 flex flex-col justify-between">
        <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
        
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
              <Cpu className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-semibold text-neutral-300 uppercase tracking-wide">
              Processos Ativos
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
            <span>Online</span>
          </div>
        </div>

        <div className="my-1">
          <div className="text-3xl font-semibold tracking-tight text-white font-mono">
            {stats.online_bots} <span className="text-sm font-normal text-neutral-500">/ {stats.total_bots}</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Discord: <strong className="text-neutral-200">{stats.discord_bots}</strong> &bull; Telegram: <strong className="text-neutral-200">{stats.telegram_bots}</strong>
          </p>
        </div>
      </div>

      {/* Card 2: Custo Operacional */}
      <div className="apple-glass-card relative overflow-hidden rounded-[26px] p-5 md:p-6 border border-white/12 flex flex-col justify-between">
        <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
        
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              <DollarSign className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-semibold text-neutral-300 uppercase tracking-wide">
              Custo de Infra
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-400 font-semibold">
            100% GRÁTIS
          </span>
        </div>

        <div className="my-1">
          <div className="text-3xl font-semibold tracking-tight text-emerald-400 font-mono">
            R$ 0,00
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Zero VPS &bull; Arquitetura Serverless Desacoplada
          </p>
        </div>
      </div>

      {/* Card 3: Gateway & Uptime */}
      <div className="apple-glass-card relative overflow-hidden rounded-[26px] p-5 md:p-6 border border-white/12 flex flex-col justify-between sm:col-span-2 lg:col-span-1">
        <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
        
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
              <Activity className="h-4 w-4" />
            </div>
            <span className="font-mono text-xs font-semibold text-neutral-300 uppercase tracking-wide">
              Malha Gateway
            </span>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-400">
            0.8s sync
          </span>
        </div>

        <div className="my-1">
          <div className="text-3xl font-semibold tracking-tight text-white font-mono">
            99.98%
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Uptime Gateway Discloud &bull; Vercel Runner
          </p>
        </div>
      </div>
    </div>
  );
};
