'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, isUserMasterAdmin } from '@/components/Navbar';
import { MetricsBanner } from '@/components/MetricsBanner';
import { BotGrid } from '@/components/BotGrid';
import { DeployModal } from '@/components/DeployModal';
import { BotDetailView } from '@/components/BotDetailView';
import { AdminAuthModal } from '@/components/AdminAuthModal';
import { AdminPanel } from '@/components/AdminPanel';
import { PresentationLanding } from '@/components/PresentationLanding';
import { LoginView } from '@/components/LoginView';
import { GiftCelebrationModal } from '@/components/GiftCelebrationModal';
import { UserProfileModal } from '@/components/UserProfileModal';
import { AethelBot, ClusterStats } from '@/lib/types';
import { CheckCircle2, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { 
  findPendingGiftsForUser, 
  getUserBonusData, 
  UserGift 
} from '@/lib/promoService';

export default function DashboardPage() {
  const [bots, setBots] = useState<AethelBot[]>([]);
  const [stats, setStats] = useState<ClusterStats>({
    total_bots: 0,
    online_bots: 0,
    discord_bots: 0,
    telegram_bots: 0,
    estimated_ram_mb: 0,
    discloud_quota_mb: 100,
    monthly_cost_brl: 0.0,
  });

  const [selectedBotId, setSelectedBotId] = useState<string | null>(null);
  const [focusedBotId, setFocusedBotId] = useState<string | null>(null);
  const focusedBot = bots.find((b) => b.id === focusedBotId) || null;
  const [activeNavTab, setActiveNavTab] = useState<'overview' | 'instances'>('overview');
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Estados de Autenticação Supabase (Discord OAuth & E-mail)
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [authView, setAuthView] = useState<'presentation' | 'login'>('presentation');

  // Estados do Modo Admin
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  // Estados de Presentes & Promo Codes de RAM
  const [extraRamMb, setExtraRamMb] = useState<number>(0);
  const [pendingGift, setPendingGift] = useState<UserGift | null>(null);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);

  const getUserKey = (user: any): string => {
    if (!user) return 'guest';
    return (
      user.user_metadata?.provider_id ||
      user.user_metadata?.sub ||
      user.email ||
      user.id
    );
  };

  // Listener de Autenticação em Tempo Real
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Trata eventuais parâmetros de erro ou redirecionamento na URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const errorDesc = params.get('error_description');
    if (errorDesc) {
      setNotification(`Aviso de Autenticação: ${decodeURIComponent(errorDesc.replace(/\+/g, ' '))}`);
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => setNotification(null), 8000);
    }
  }, []);

  // Monitora e carrega bônus e presentes do usuário logado
  useEffect(() => {
    if (!currentUser) {
      setExtraRamMb(0);
      setPendingGift(null);
      return;
    }

    const key = getUserKey(currentUser);
    const bonus = getUserBonusData(key);
    setExtraRamMb(bonus.extra_ram_mb || 0);

    // Identificadores possíveis do usuário (Discord ID, sub, email, id)
    const identifiers = [
      currentUser.user_metadata?.provider_id,
      currentUser.user_metadata?.sub,
      currentUser.email,
      currentUser.id,
    ].filter(Boolean) as string[];

    const pending = findPendingGiftsForUser(identifiers);
    if (pending.length > 0) {
      setPendingGift(pending[0]);
    }
  }, [currentUser]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsAdminPanelOpen(false);
    setFocusedBotId(null);
    setNotification('Você desconectou da sua conta Aethel.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleTriggerAdmin = () => {
    // Se for o dono 1313535117792378891, abre direto!
    if (isUserMasterAdmin(currentUser)) {
      setIsAdminPanelOpen(true);
    } else {
      setIsAdminAuthModalOpen(true);
    }
  };

  const fetchBotsAndStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/bots');
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots || []);
        if (data.stats) setStats(data.stats);

        if (!selectedBotId && data.bots && data.bots.length > 0) {
          setSelectedBotId(data.bots[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedBotId]);

  useEffect(() => {
    fetchBotsAndStats();
  }, [fetchBotsAndStats]);

  const handleToggleStatus = async (botId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ONLINE' ? 'STOPPED' : 'ONLINE';
    try {
      const res = await fetch('/api/bots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId, status: nextStatus }),
      });

      if (res.ok) {
        setBots((prev) =>
          prev.map((b) => (b.id === botId ? { ...b, status: nextStatus as any } : b))
        );
        fetchBotsAndStats();
      }
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    const targetBot = bots.find(b => b.id === botId);
    const botName = targetBot ? targetBot.bot_name : 'esta instância';

    if (!confirm(`Tem certeza que deseja apagar ${botName}? A instância será desconectada e o registro excluído.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/bots?id=${botId}`, { method: 'DELETE' });
      if (res.ok) {
        setBots((prev) => prev.filter((b) => b.id !== botId));
        if (focusedBotId === botId) setFocusedBotId(null);
        fetchBotsAndStats();
        setNotification(`Instância "${botName}" apagada com sucesso.`);
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.error('Erro ao deletar bot:', err);
    }
  };

  const handleSetupTelegram = async (botId: string) => {
    try {
      const res = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Webhook do Telegram registrado com sucesso!');
        fetchBotsAndStats();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err: any) {
      alert('Falha ao configurar webhook: ' + err.message);
    }
  };

  // Resgate de Presente Concluído
  const handleGiftClaimed = (gift: UserGift) => {
    setPendingGift(null);
    const key = getUserKey(currentUser);
    const bonus = getUserBonusData(key);
    setExtraRamMb(bonus.extra_ram_mb);
    setNotification(`🎁 Presente ativado! Você recebeu +${gift.ram_mb} MB de RAM extra na sua cota!`);
    setTimeout(() => setNotification(null), 6000);
  };

  // Resgate de Código Promocional Concluído
  const handleCodeRedeemed = (ramMb: number, msg: string) => {
    const key = getUserKey(currentUser);
    const bonus = getUserBonusData(key);
    setExtraRamMb(bonus.extra_ram_mb);
    setNotification(msg);
    setTimeout(() => setNotification(null), 6000);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#07080a] text-neutral-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Luzes Dinâmicas de Fundo Apple Liquid Material */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="light-cyan"></div>
        <div className="light-indigo"></div>
        <div className="light-emerald"></div>
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Dynamic Island Dock Navigation */}
        <Navbar
          onOpenDeploy={() => setIsDeployOpen(true)}
          onRefresh={fetchBotsAndStats}
          isRefreshing={isRefreshing}
          onTriggerAdmin={handleTriggerAdmin}
          activeNavTab={activeNavTab}
          onSelectNavTab={(tab) => {
            setActiveNavTab(tab);
            setFocusedBotId(null);
            setIsAdminPanelOpen(false);
          }}
          currentUser={currentUser}
          onSignOut={handleSignOut}
          onOpenPromoModal={() => setIsRedeemModalOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          authView={authView}
          onToggleAuthView={() => setAuthView((prev) => (prev === 'login' ? 'presentation' : 'login'))}
        />

        {!currentUser ? (
          authView === 'presentation' ? (
            /* =========================================================================
                PÁGINA INICIAL / APRESENTAÇÃO COMPLETA DA PLATAFORMA (SEM LOGIN POLUÍDO)
               ========================================================================= */
            <main className="mx-auto w-[94%] max-w-6xl flex-1 pt-4 pb-16 animate-fadeIn">
              <PresentationLanding onGoToLogin={() => setAuthView('login')} />
            </main>
          ) : (
            /* =========================================================================
                PÁGINA DEDICADA E LIMPA DE LOGIN (DISCORD & E-MAIL)
               ========================================================================= */
            <main className="mx-auto w-[94%] max-w-6xl flex-1 pt-4 pb-16 animate-fadeIn">
              <LoginView
                onBackToPresentation={() => setAuthView('presentation')}
                onLoginSuccess={fetchBotsAndStats}
              />
            </main>
          )
        ) : (
          /* =========================================================================
              PAINEL OPERACIONAL LIQUID GLASS (VISÍVEL APENAS QUANDO AUTENTICADO)
             ========================================================================= */
          <main className="mx-auto w-[94%] max-w-6xl flex-1 pt-6 md:pt-8 pb-28 md:pb-20 animate-fadeIn">
            {/* Notificação Temporária */}
            {notification && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 shadow-lg animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{notification}</span>
              </div>
            )}

            {isAdminPanelOpen ? (
              /* Painel Root de Infraestrutura com Várias Abas */
              <AdminPanel
                bots={bots}
                onClose={() => setIsAdminPanelOpen(false)}
                onRefreshBots={fetchBotsAndStats}
                onDeleteBot={handleDeleteBot}
                onToggleBotStatus={handleToggleStatus}
              />
            ) : focusedBot ? (
              /* Visualização Detalhada da Instância */
              <BotDetailView
                bot={focusedBot}
                onBack={() => setFocusedBotId(null)}
                onToggleStatus={handleToggleStatus}
                onRefresh={fetchBotsAndStats}
                onDeleteBot={handleDeleteBot}
              />
            ) : (
              /* Visão Geral (Apple Liquid Dashboard) */
              <div className="space-y-8 animate-fadeIn">
                {/* Linha Superior de Boas-Vindas e Ação Rápida */}
                <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-semibold tracking-[-0.03em] text-white">
                      Painel Operacional
                    </h1>
                    <p className="text-sm text-neutral-400 mt-1">
                      Gerenciamento de aplicações via <span className="text-white font-mono">aethel.config</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsDeployOpen(true)}
                      className="apple-pill-btn apple-pill-primary flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide text-white"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Nova Instância</span>
                    </button>
                  </div>
                </section>

                {/* Cartões de Telemetria e Alocação (com Cota + Bônus de Presente) */}
                {activeNavTab === 'overview' && (
                  <section className="w-full">
                    <MetricsBanner stats={stats} bots={bots} extraRamMb={extraRamMb} />
                  </section>
                )}

                {/* Lista Principal de Instâncias (Largura Total Ampla) */}
                <div className="w-full">
                  <BotGrid
                    bots={bots}
                    selectedBotId={selectedBotId}
                    onSelectBot={(id) => setSelectedBotId(id)}
                    onOpenDetails={(id) => setFocusedBotId(id)}
                    onToggleStatus={handleToggleStatus}
                    onDeleteBot={handleDeleteBot}
                    onSetupTelegram={handleSetupTelegram}
                  />
                </div>
              </div>
            )}
          </main>
        )}

        {/* Modal de Análise de Perfil Apple Liquid Glass */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          stats={stats}
          extraRamMb={extraRamMb}
          bots={bots}
          onSignOut={handleSignOut}
          onOpenPromoModal={() => {
            setIsProfileModalOpen(false);
            setIsRedeemModalOpen(true);
          }}
          onOpenAdminPanel={() => {
            setIsProfileModalOpen(false);
            setIsAdminPanelOpen(true);
          }}
        />

        {/* Modal de Presentes Recebidos & Resgate de Cupons */}
        <GiftCelebrationModal
          pendingGift={pendingGift}
          isOpenRedeemModal={isRedeemModalOpen}
          userKey={getUserKey(currentUser)}
          onCloseRedeemModal={() => setIsRedeemModalOpen(false)}
          onGiftClaimed={handleGiftClaimed}
          onCodeRedeemed={handleCodeRedeemed}
        />

        {/* Deploy Modal */}
        <DeployModal
          isOpen={isDeployOpen}
          onClose={() => setIsDeployOpen(false)}
          onSuccess={() => {
            fetchBotsAndStats();
            setNotification('🚀 Instância implantada com sucesso na malha Aethelkov!');
            setTimeout(() => setNotification(null), 5000);
          }}
        />

        {/* Modal de Autenticação Admin para Casos Alternativos */}
        <AdminAuthModal
          isOpen={isAdminAuthModalOpen}
          onClose={() => setIsAdminAuthModalOpen(false)}
          onSuccess={() => {
            setIsAdminAuthModalOpen(false);
            setIsAdminPanelOpen(true);
          }}
        />
      </div>
    </div>
  );
}
