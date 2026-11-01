'use client';

import React from 'react';
import { Cpu, ShieldCheck, Zap, Plus, RefreshCw } from 'lucide-react';

interface NavbarProps {
  onOpenDeploy: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenDeploy, onRefresh, isRefreshing }) => {
  return (
    <header className="sticky top-0 z-40 w-full px-4 sm:px-8 py-4 backdrop-blur-xl bg-black/40 border-b border-white/5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Zap className="w-5 h-5 text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AETHELKOV
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Hybrid Grid
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous Bot Runtime • R$ 0,00 Infra
            </p>
          </div>
        </div>

        {/* Mesh Status Chips */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Farol Alpha (Discloud)</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Vercel Runner: Idle</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/10 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            <span>Supabase Vault</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Atualizar lista e telemetria"
            className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
          <button
            onClick={onOpenDeploy}
            className="capsule-btn capsule-btn-primary text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Deploy</span>
          </button>
        </div>
      </div>
    </header>
  );
};

