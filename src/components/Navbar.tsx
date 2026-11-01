'use client';

import React from 'react';
import { Zap, Plus, RefreshCw, Shield, LogOut, User, Gift } from 'lucide-react';

interface NavbarProps {
  onOpenDeploy: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onTriggerAdmin: () => void;
  activeNavTab: 'overview' | 'instances';
  onSelectNavTab: (tab: 'overview' | 'instances') => void;
  currentUser?: any;
  onSignOut?: () => void;
  onOpenPromoModal?: () => void;
}

export const MASTER_ADMIN_DISCORD_ID = '1313535117792378891';

export const isUserMasterAdmin = (user: any): boolean => {
  if (!user) return false;
  const discordId = 
    user.user_metadata?.provider_id ||
    user.user_metadata?.sub ||
    user.identities?.find((i: any) => i.provider === 'discord')?.id ||
    user.identities?.find((i: any) => i.provider === 'discord')?.identity_data?.provider_id;

  return (
    discordId === MASTER_ADMIN_DISCORD_ID ||
    (typeof window !== 'undefined' && sessionStorage.getItem('aethel_admin_auth') === 'true')
  );
};

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenDeploy, 
  onRefresh, 
  isRefreshing,
  onTriggerAdmin,
  activeNavTab,
  onSelectNavTab,
  currentUser,
  onSignOut,
  onOpenPromoModal,
}) => {
  const isAdmin = isUserMasterAdmin(currentUser);

  return (
    <header className="sticky top-4 z-50 mx-auto w-[94%] max-w-6xl transition-all duration-300">
      <nav className="apple-glass relative flex items-center justify-between rounded-full px-4 sm:px-6 py-2.5 sm:py-3 shadow-2xl border border-white/15">
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
        
        {/* Logo Aethel Kov */}
        <div className="flex items-center gap-3 pl-1">
          <div 
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-white/25 to-white/5 border border-white/30 shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.5),0_4px_12px_rgba(0,0,0,0.4)] select-none"
          >
            <Zap className="h-5 w-5 text-white" />
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

        {/* QUANDO O USUÁRIO ESTÁ LOGADO: Renderiza abas, ações e perfil */}
        {currentUser ? (
          <>
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

            {/* Ações Rápidas, Admin, Presentes & Botão Novo Deploy */}
            <div className="flex items-center gap-2">
              {/* Botão Resgatar Código / Presentes */}
              {onOpenPromoModal && (
                <button
                  onClick={onOpenPromoModal}
                  className="apple-pill-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono text-pink-300 bg-pink-500/10 border-pink-500/30 hover:bg-pink-500/20 transition-colors"
                  title="Resgatar Código Promocional de RAM"
                >
                  <Gift className="w-3.5 h-3.5 text-pink-400" />
                  <span className="hidden sm:inline">Resgatar Código</span>
                </button>
              )}

              {/* BOTÃO EXCLUSIVO DE PAINEL ADMIN PARA A CONTA MASTER 1313535117792378891 */}
              {isAdmin && (
                <button
                  onClick={onTriggerAdmin}
                  className="apple-pill-btn flex items-center gap-1.5 rounded-full px-3.5 py-1.5 font-mono text-xs font-semibold text-amber-300 bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25 hover:border-amber-500/60 transition-all shadow-[0_0_14px_rgba(245,158,11,0.3)] animate-pulse"
                  title="Painel Master Admin da Aethel Kov"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Painel Admin</span>
                </button>
              )}

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

              {/* Perfil do Usuário Autenticado */}
              <div className="flex items-center gap-2 pl-1 border-l border-white/10 ml-1">
                <div 
                  className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-white/5 border border-white/10"
                  title={currentUser.email || 'Usuário Autenticado'}
                >
                  {currentUser.user_metadata?.avatar_url ? (
                    <img
                      src={currentUser.user_metadata.avatar_url}
                      alt="Avatar"
                      className="w-5 h-5 rounded-full object-cover border border-emerald-400/50"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                  <span className="hidden lg:inline font-mono text-[11px] text-neutral-300 max-w-[100px] truncate">
                    {currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário'}
                  </span>
                </div>

                {onSignOut && (
                  <button
                    onClick={onSignOut}
                    className="apple-pill-btn flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Sair da conta"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          /* QUANDO NÃO HÁ USUÁRIO LOGADO (NA TELA DE LOGIN / APRESENTAÇÃO) */
          /* NENHUM BOTÃO DE NAVEGAÇÃO OU INSTÂNCIA É EXIBIDO */
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
              <span>Alta Disponibilidade 24/7</span>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
