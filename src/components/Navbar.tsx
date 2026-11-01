'use client';

import React from 'react';
import { Zap, Plus, RefreshCw, Shield, LogOut, User, Gift, Bot } from 'lucide-react';

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
  onOpenProfileModal?: () => void;
  authView?: 'presentation' | 'login';
  onToggleAuthView?: () => void;
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
  onOpenProfileModal,
  authView = 'presentation',
  onToggleAuthView,
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

              {/* Perfil Interativo do Usuário Autenticado (Discord Avatar & Nome) */}
              <div className="flex items-center gap-2 pl-1 border-l border-white/10 ml-1">
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="group relative flex items-center gap-2.5 py-1 px-1.5 sm:pr-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-cyan-400/50 transition-all duration-300 shadow-sm hover:shadow-[0_0_16px_rgba(34,211,238,0.25)] active:scale-95"
                  title="Clique para analisar seu perfil, Discord ID e cota de RAM"
                >
                  {/* Bolinha de Perfil com Foto do Discord e Indicador Online */}
                  <div className="relative flex-shrink-0">
                    <div className="h-8 w-8 rounded-full overflow-hidden border border-white/30 group-hover:border-cyan-400/70 transition-colors shadow-inner">
                      {currentUser.user_metadata?.avatar_url || currentUser.identities?.[0]?.identity_data?.avatar_url ? (
                        <img
                          src={currentUser.user_metadata?.avatar_url || currentUser.identities?.[0]?.identity_data?.avatar_url}
                          alt="Avatar"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-tr from-[#5865F2] to-indigo-600 flex items-center justify-center text-white font-mono text-xs font-bold">
                          {(currentUser.user_metadata?.full_name || currentUser.email || 'A').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Indicador de Status Online */}
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#0d0e14]"></span>
                    </span>
                  </div>

                  {/* Nome do Usuário no Discord / E-mail */}
                  <div className="hidden md:flex flex-col text-left leading-tight">
                    <span className="font-sans text-xs font-medium text-white group-hover:text-cyan-200 transition-colors max-w-[110px] truncate">
                      {currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || currentUser.user_metadata?.custom_claims?.global_name || currentUser.email?.split('@')[0] || 'Usuário'}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-400 group-hover:text-cyan-300 transition-colors">
                      {isAdmin ? '👑 Master Admin' : 'Analisar Perfil'}
                    </span>
                  </div>
                </button>

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
          /* QUANDO NÃO HÁ USUÁRIO LOGADO (NA TELA DE APRESENTAÇÃO OU LOGIN) */
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
              <span>Alta Disponibilidade 24/7</span>
            </div>

            {onToggleAuthView && (
              <button
                type="button"
                onClick={onToggleAuthView}
                className="apple-pill-btn flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-all shadow-sm"
              >
                <span>{authView === 'login' ? 'Ver Apresentação' : 'Entrar no Painel'}</span>
              </button>
            )}
          </div>
        )}
      </nav>

      {/* Dock Flutuante Inferior para Dispositivos Móveis (Apple Liquid Dock Mobile) */}
      {currentUser && (
        <div className="md:hidden fixed bottom-4 inset-x-4 z-50 animate-fadeIn">
          <div className="apple-glass rounded-full px-4 py-2 border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-2xl flex items-center justify-around">
            <button
              type="button"
              onClick={() => onSelectNavTab('overview')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-all ${
                activeNavTab === 'overview' ? 'text-cyan-300 font-bold scale-105' : 'text-neutral-400'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="text-[10px] font-mono">Visão</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectNavTab('instances')}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-full transition-all ${
                activeNavTab === 'instances' ? 'text-cyan-300 font-bold scale-105' : 'text-neutral-400'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-[10px] font-mono">Bots</span>
            </button>

            <button
              type="button"
              onClick={onOpenDeploy}
              className="flex items-center justify-center h-10 w-10 -my-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.6)] active:scale-95 transition-all"
              title="Novo Deploy"
            >
              <Plus className="w-5 h-5 text-white" />
            </button>

            {onOpenPromoModal && (
              <button
                type="button"
                onClick={onOpenPromoModal}
                className="flex flex-col items-center gap-0.5 py-1 px-2 text-pink-400 hover:text-pink-300 transition-colors"
                title="Resgatar Código"
              >
                <Gift className="w-4 h-4" />
                <span className="text-[10px] font-mono">Código</span>
              </button>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={onTriggerAdmin}
                className="flex flex-col items-center gap-0.5 py-1 px-2 text-amber-400 hover:text-amber-300 transition-colors"
                title="Painel Admin"
              >
                <Shield className="w-4 h-4" />
                <span className="text-[10px] font-mono">Admin</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
