'use client';

import React from 'react';
import { DollarSign, Activity, HardDrive, Layers } from 'lucide-react';
import { ClusterStats } from '@/lib/types';

interface MetricsBannerProps {
  stats: ClusterStats;
}

export const MetricsBanner: React.FC<MetricsBannerProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Metric 1: Custo Zero */}
      <div className="liquid-glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <DollarSign className="w-16 h-16 text-emerald-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          Custo de Infraestrutura
        </div>
        <div className="text-3xl font-bold tracking-tight text-white mt-1">
          R$ 0,00
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Desacoplamento Vercel + Discloud + Supabase
        </p>
      </div>

      {/* Metric 2: Instâncias Ativas */}
      <div className="liquid-glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Activity className="w-16 h-16 text-cyan-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          Instâncias na Malha
        </div>
        <div className="text-3xl font-bold tracking-tight text-white mt-1 flex items-baseline gap-2">
          <span>{stats.online_bots}</span>
          <span className="text-sm font-normal text-slate-400">/ {stats.total_bots} bots</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
          <span>Discord: <strong className="text-white">{stats.discord_bots}</strong></span>
          <span>•</span>
          <span>Telegram: <strong className="text-white">{stats.telegram_bots}</strong></span>
        </div>
      </div>

      {/* Metric 3: Pegada de RAM do Farol */}
      <div className="liquid-glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <HardDrive className="w-16 h-16 text-purple-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
          Pegada de RAM (Farol)
        </div>
        <div className="text-3xl font-bold tracking-tight text-white mt-1 flex items-baseline gap-2">
          <span>{stats.estimated_ram_mb || 0}</span>
          <span className="text-sm font-normal text-slate-400">/ 100 MB</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          ~1.05 MB / bot (Sem discord.js / zero cache)
        </p>
      </div>

      {/* Metric 4: Protocolo & Mesh */}
      <div className="liquid-glass rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Layers className="w-16 h-16 text-amber-400" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          Topologia Mesh
        </div>
        <div className="text-2xl font-bold tracking-tight text-white mt-1">
          Farol Alpha
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Shards 0 a 50 • Relay Gateway v10
        </p>
      </div>
    </div>
  );
};

