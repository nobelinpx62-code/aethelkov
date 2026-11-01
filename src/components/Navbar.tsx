'use client';

import React, { useState, useRef } from 'react';
import { Zap, Plus, RefreshCw, Bell, Shield, Layers, HardDrive, Terminal } from 'lucide-react';

interface NavbarProps {
  onOpenDeploy: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onTriggerAdmin: () => void;
  activeNavTab: 'overview' | 'instances';
  onSelectNavTab: (tab: 'overview' | 'instances') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenDeploy, 
  onRefresh, 
  isRefreshing,
  onTriggerAdmin,
  activeNavTab,
  onSelectNavTab,
}) => {
  const [clickCount, setClickCount] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleEmblemClick = () => {
    const nextCount = clickCount + 1;
    setClickCount(nextCount);

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    if (nextCount >= 3) {
      setClickCount(0);
      onTriggerAdmin();
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        setClickCount(0);
      }, 1800);
    }
  };

  return (
    <header className="sticky top-4 z-50 mx-auto w-[94%] max-w-6xl transition-all duration-300">
      <nav className="apple-glass relative flex items-center justify-between rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-2xl border border-white/15">
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
        
        {/* Logo Aethel Kov com Clique Triplo Secreto */}
        <div className="flex items-center gap-3 pl-1">
          <div 
            onClick={handleEmblemClick}
            className={`relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-white/25 to-white/5 border border-white/30 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.4)] cursor-pointer select-none transition-transform active:scale-90 ${
              clickCount > 0 ? 'ring-2 ring-emerald-400 scale-105' : ''
            }`}
            title="Clique 3x para abrir o Painel Admin"
          >
            <Zap className={`h-5 w-5 text-white ${clickCount > 0 ? 'text-emerald-400 animate-bounce' : ''}`} />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col select-none">
            <span className="text-sm sm:text-base font-semibold tracking-[-0.03em] text-white">
              Aethel <span className="font-extralight text-neutral-400">Kov</span>
            </span>
            <span className="font-mono text-[9px] tracking-widest text-neutral-400 uppercase -mt-0.5">
              Control Center
            </span>
          </div>
        </div>

        {/* Seletor de Navegação em Pílula (Apple Liquid Dock) */}
        <div className="hidden md:flex items-center gap-1 rounded-full bg-black/40 p-1 border border-white/10 font-mono text-xs">
          <button
            onClick={() => onSelectNavTab('overview')}
            className={`rounded-full px-4 py-1.5 font-medium transition-all ${
              activeNavTab === 'overview'
                ? 'text-white bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Visão Geral
          </button>
          <button
            onClick={() => onSelectNavTab('instances')}
            className={`rounded-full px-4 py-1.5 font-medium transition-all ${
              activeNavTab === 'instances'
                ? 'text-white bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Instâncias
          </button>
        </div>

        {/* Ações Rápidas & Botão Novo Deploy */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="apple-pill-btn flex h-9 w-9 items-center justify-center rounded-full text-white"
            title="Atualizar dados e telemetria"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          <button
            onClick={onOpenDeploy}
            className="apple-pill-btn apple-pill-primary flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs font-semibold tracking-wide text-white"
          >
            <Plus className="h-4 w-4 text-white" />
            <span className="hidden sm:inline">Nova Instância</span>
          </button>
        </div>
      </nav>
    </header>
  );
};
