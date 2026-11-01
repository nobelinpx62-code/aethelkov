'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { MetricsBanner } from '@/components/MetricsBanner';
import { StorageHUD } from '@/components/StorageHUD';
import { BotGrid } from '@/components/BotGrid';
import { DeployModal } from '@/components/DeployModal';
import { BotDetailView } from '@/components/BotDetailView';
import { AdminAuthModal } from '@/components/AdminAuthModal';
import { AdminPanel } from '@/components/AdminPanel';
import { AethelBot, ClusterStats } from '@/lib/types';
import { ShieldCheck, CheckCircle2, Plus } from 'lucide-react';

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
  const [activeNavTab, setActiveNavTab] = useState<'overview' | 'instances' | 'storage'>('overview');
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Estados do Modo Admin Secreto
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const handleTriggerAdmin = () => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('aethel_admin_auth') === 'true') {
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

    if (!confirm(`Tem certeza que deseja apagar ${botName}? A conexão na Discloud será encerrada e o registro excluído.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/bots?id=${botId}`, { method: 'DELETE' });
      if (res.ok) {
        setBots((prev) => prev.filter((b) => b.id !== botId));
        if (selectedBotId === botId) {
          setSelectedBotId(null);
        }
        if (focusedBotId === botId) {
          setFocusedBotId(null);
        }
        setNotification(`🗑️ Instância "${botName}" apagada com sucesso!`);
        setTimeout(() => setNotification(null), 5000);
        fetchBotsAndStats();
      }
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const handleSetupTelegram = async (botId: string) => {
    try {
      const res = await fetch(`/api/telegram?botId=${botId}&action=setWebhook`);
      const data = await res.json();
      if (data.success) {
        setNotification('✅ Webhook do Telegram registrado com sucesso na Vercel!');
        setTimeout(() => setNotification(null), 5000);
      } else {
        alert('Falha ao configurar Telegram: ' + JSON.stringify(data));
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const selectedBot = bots.find((b) => b.id === selectedBotId) || (bots.length > 0 ? bots[0] : null);
  const focusedBot = bots.find((b) => b.id === focusedBotId);
  const totalStorageBytes = bots.reduce((acc, curr) => acc + (curr.storage_size_bytes || 0), 0);

  return (
    <div className="min-h-screen flex flex-col relative selection:bg-white/20 selection:text-white">
      {/* Motor de Iluminação Óptica Estática (Zero GPU Bottleneck / Zero Lag) */}
      <div className="ambient-light-layer">
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
        />

        {/* Container Central da Dashboard */}
        <main className="mx-auto w-[94%] max-w-6xl flex-1 pt-8 pb-20">
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
            /* Visualização Detalhada Estilo Discloud Pro */
            <BotDetailView
              bot={focusedBot}
              onBack={() => setFocusedBotId(null)}
              onToggleStatus={handleToggleStatus}
              onRefresh={fetchBotsAndStats}
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
                    Gerenciamento autônomo de aplicações via <span className="text-white font-mono">aethel.config</span> &amp; <span className="text-white font-mono">discloud.config</span>
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

              {/* Cartões de Telemetria e Alocação */}
              {activeNavTab === 'overview' && (
                <section className="w-full">
                  <MetricsBanner stats={stats} />
                </section>
              )}

              {activeNavTab === 'storage' && (
                <section className="w-full">
                  <StorageHUD usedBytes={totalStorageBytes} />
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

        {/* Modal Secreto de Autenticação Admin */}
        <AdminAuthModal
          isOpen={isAdminAuthModalOpen}
          onClose={() => setIsAdminAuthModalOpen(false)}
          onSuccess={() => {
            setIsAdminAuthModalOpen(false);
            setIsAdminPanelOpen(true);
          }}
        />

        {/* Rodapé Minimalista */}
        <footer className="mt-auto py-8 text-center border-t border-white/5 font-mono text-xs text-neutral-500">
          Aethel Kov Systems &copy; 2026. Design concebido sob ótica Liquid Glass.
        </footer>
      </div>
    </div>
  );
}
