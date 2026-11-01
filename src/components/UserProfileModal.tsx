'use client';

import React, { useState } from 'react';
import { 
  User, 
  Shield, 
  Zap, 
  Sparkles, 
  Copy, 
  Check, 
  LogOut, 
  X, 
  HardDrive, 
  Bot, 
  Gift, 
  Clock, 
  Activity,
  Flame,
  Key
} from 'lucide-react';
import { MASTER_ADMIN_DISCORD_ID, isUserMasterAdmin } from './Navbar';
import { AethelBot, ClusterStats } from '@/lib/types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  stats: ClusterStats;
  extraRamMb: number;
  bots: AethelBot[];
  onSignOut: () => void;
  onOpenPromoModal?: () => void;
  onOpenAdminPanel?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  stats,
  extraRamMb,
  bots,
  onSignOut,
  onOpenPromoModal,
  onOpenAdminPanel,
}) => {
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen || !currentUser) return null;

  // Extração detalhada dos dados do Discord / E-mail
  const metadata = currentUser.user_metadata || {};
  const identity = currentUser.identities?.find((i: any) => i.provider === 'discord') || currentUser.identities?.[0];
  const identityData = identity?.identity_data || {};

  const avatarUrl = 
    metadata.avatar_url || 
    identityData.avatar_url || 
    null;

  const displayName = 
    metadata.full_name || 
    metadata.name || 
    identityData.full_name || 
    identityData.name || 
    metadata.custom_claims?.global_name ||
    currentUser.email?.split('@')[0] || 
    'Usuário Aethel';

  const username = 
    metadata.user_name || 
    identityData.user_name || 
    metadata.preferred_username || 
    (currentUser.email ? currentUser.email.split('@')[0] : 'aethel_user');

  const discordId = 
    metadata.provider_id || 
    metadata.sub || 
    identity?.id || 
    identityData.provider_id || 
    null;

  const email = currentUser.email || 'Não informado';
  const isDiscord = Boolean(identity?.provider === 'discord' || discordId);
  const isAdmin = isUserMasterAdmin(currentUser);

  // Cálculo da Cota de Memória
  const baseQuotaMb = 100;
  const totalQuotaMb = baseQuotaMb + extraRamMb;
  const usedRamMb = stats.estimated_ram_mb || 0;
  const ramUsagePercent = Math.min(100, Math.round((usedRamMb / totalQuotaMb) * 100));

  // Instâncias do Usuário
  const onlineBotsCount = bots.filter(b => b.status === 'ONLINE').length;
  const totalBotsCount = bots.length;

  const handleCopyDiscordId = () => {
    if (!discordId) return;
    navigator.clipboard.writeText(discordId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-2xl animate-fadeIn">
      {/* Container Principal Apple Liquid Glass */}
      <div className="apple-glass-card rounded-[32px] sm:rounded-[36px] max-w-lg w-full p-6 sm:p-8 border border-white/20 relative overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.9)] space-y-6">
        
        {/* Reflexo Especular Superior */}
        <div className="glass-specular pointer-events-none absolute inset-x-12 top-0 h-[1.5px]"></div>

        {/* Efeito Glow de Fundo */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br from-cyan-500/20 via-indigo-500/10 to-transparent blur-3xl"></div>
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-gradient-to-tr from-emerald-500/15 via-pink-500/10 to-transparent blur-3xl"></div>

        {/* Topo do Modal: Título e Botão Fechar */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-white/10 border border-white/20">
              <User className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider block">
                Perfil de Usuário
              </span>
              <span className="font-mono text-[10px] text-neutral-400">
                Aethel Cloud Identity
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/15 border border-white/10 text-neutral-400 hover:text-white transition-colors"
            title="Fechar Perfil"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Identidade do Usuário (Avatar Grande do Discord + Nome + Cargos) */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 p-4 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md">
          {/* Avatar com Borda Glow e Indicador de Status */}
          <div className="relative shrink-0">
            <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full overflow-hidden border-2 border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-tr from-[#5865F2] to-indigo-700 text-white font-bold text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Pílula / Indicador Online do Discord */}
            <span className="absolute bottom-1 right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-[#0d0e14]"></span>
            </span>
          </div>

          {/* Dados do Nome, Tag e Badges */}
          <div className="flex-1 text-center sm:text-left space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate max-w-[220px]">
                {displayName}
              </h3>

              {isAdmin ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-semibold shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>👑 Criador & Master Admin</span>
                </span>
              ) : isDiscord ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#8899fc] font-mono text-[10px] font-medium">
                  <span>Discord Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[10px]">
                  <span>Conta E-mail</span>
                </span>
              )}
            </div>

            <p className="font-mono text-xs text-neutral-400 truncate">
              @{username}
            </p>

            <p className="text-xs text-neutral-400 truncate">
              {email}
            </p>

            {/* Snowflake Discord ID com Botão de Copiar */}
            {discordId && (
              <div className="pt-1 flex items-center justify-center sm:justify-start gap-2">
                <span className="font-mono text-[10px] text-neutral-400">
                  ID: <span className="text-neutral-200">{discordId}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyDiscordId}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded-full transition-all"
                  title="Copiar Discord ID para área de transferência"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copiar ID</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Telemetria e Análise de Recursos da Conta */}
        <div className="relative z-10 space-y-3 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Análise de Recursos & Cota</span>
            </span>
            <span className="text-[11px] text-emerald-400 font-semibold">
              {ramUsagePercent}% em uso
            </span>
          </div>

          {/* Barra de Progresso Liquid Glass de RAM */}
          <div className="apple-glass rounded-2xl p-4 border border-white/10 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Memória RAM Alocada</span>
              <span className="font-bold text-white">
                <span className="text-cyan-300">{usedRamMb} MB</span> / {totalQuotaMb} MB
              </span>
            </div>

            <div className="relative h-2.5 w-full rounded-full bg-black/60 p-0.5 overflow-hidden border border-white/10">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  ramUsagePercent >= 100
                    ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]'
                    : ramUsagePercent > 75
                    ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                    : 'bg-gradient-to-r from-emerald-400 to-cyan-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                }`}
                style={{ width: `${Math.max(5, ramUsagePercent)}%` }}
              ></div>
            </div>

            {/* Detalhamento de Bônus e Cota Base */}
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-white/5">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Cota Gratuita Base:</span>
                <span className="text-white">{baseQuotaMb} MB</span>
              </div>
              <div className="flex items-center justify-between text-neutral-400">
                <span>Bônus de Presentes:</span>
                <span className={extraRamMb > 0 ? 'text-pink-400 font-bold' : 'text-neutral-400'}>
                  +{extraRamMb} MB
                </span>
              </div>
            </div>
          </div>

          {/* Grade de Telemetria: Bots, Latência, SLA */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="apple-glass rounded-2xl p-2.5 border border-white/10">
              <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                <Bot className="w-3 h-3 text-emerald-400" />
                <span>Instâncias</span>
              </div>
              <span className="text-sm font-bold text-white">
                {onlineBotsCount} <span className="text-neutral-500 font-normal">/ {totalBotsCount}</span>
              </span>
            </div>

            <div className="apple-glass rounded-2xl p-2.5 border border-white/10">
              <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Runner Core</span>
              </div>
              <span className="text-sm font-bold text-cyan-400">
                &lt; 20 ms
              </span>
            </div>

            <div className="apple-glass rounded-2xl p-2.5 border border-white/10">
              <div className="flex items-center justify-center gap-1 text-[10px] text-neutral-400 mb-0.5">
                <Activity className="w-3 h-3 text-indigo-400" />
                <span>Uptime SLA</span>
              </div>
              <span className="text-sm font-bold text-indigo-400">
                99.98%
              </span>
            </div>
          </div>
        </div>

        {/* Ações do Usuário: Resgate de Código, Painel Admin e Logout */}
        <div className="relative z-10 space-y-2 pt-2 border-t border-white/10">
          <div className="flex flex-col sm:flex-row gap-2">
            {onOpenPromoModal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPromoModal();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 font-mono text-xs transition-all shadow-sm"
              >
                <Gift className="w-3.5 h-3.5 text-pink-400" />
                <span>Resgatar Código Promo</span>
              </button>
            )}

            {isAdmin && onOpenAdminPanel && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-semibold transition-all shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Painel Master Admin</span>
              </button>
            )}
          </div>

          {/* Botão de Desconectar / Sair da Conta */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignOut();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-neutral-400 hover:text-rose-300 font-mono text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Desconectar desta Conta</span>
          </button>
        </div>

      </div>
    </div>
  );
};
