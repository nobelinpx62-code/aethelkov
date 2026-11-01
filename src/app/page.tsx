'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/Navbar';
import { MetricsBanner } from '@/components/MetricsBanner';
import { StorageHUD } from '@/components/StorageHUD';
import { BotGrid } from '@/components/BotGrid';
import { LiveTerminal } from '@/components/LiveTerminal';
import { DeployModal } from '@/components/DeployModal';
import { BotDetailView } from '@/components/BotDetailView';
import { AethelBot, ClusterStats } from '@/lib/types';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

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
  const [isDeployOpen, setIsDeployOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchBotsAndStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/bots');
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots || []);
        if (data.stats) setStats(data.stats);

        // Se nenhum bot estiver selecionado, seleciona o primeiro
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
    if (!confirm('Tem certeza que deseja encerrar e excluir esta instância permanentemente?')) {
      return;
    }

    try {
      const res = await fetch(`/api/bots?id=${botId}`, { method: 'DELETE' });
      if (res.ok) {
        setBots((prev) => prev.filter((b) => b.id !== botId));
        if (selectedBotId === botId) {
          setSelectedBotId(null);
        }
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

  // Calcula total de bytes consumidos no storage
  const totalStorageBytes = bots.reduce((acc, curr) => acc + (curr.storage_size_bytes || 0), 0);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar
        onOpenDeploy={() => setIsDeployOpen(true)}
        onRefresh={fetchBotsAndStats}
        isRefreshing={isRefreshing}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Notificação Temporária */}
        {notification && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {focusedBot ? (
          /* Visualização de Detalhes Estilo Discloud Pro */
          <BotDetailView
            bot={focusedBot}
            onBack={() => setFocusedBotId(null)}
            onToggleStatus={handleToggleStatus}
            onRefresh={fetchBotsAndStats}
          />
        ) : (
          /* Visão Geral do Grid */
          <>
            {/* Hero Banner / Resumo da Topologia */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Aethelkov Control Plane
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Malha híbrida desacoplada: Presença 24/7 (Discloud Farol) + Execução Serverless (Vercel)
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
                <span>INFRA: R$ 0,00 • ZERO VPS</span>
              </div>
            </div>

            {/* Top Metrics Cards */}
            <MetricsBanner stats={stats} />

            {/* Storage HUD */}
            <StorageHUD usedBytes={totalStorageBytes} />

            {/* Grid de Instâncias */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Instâncias em Execução
                </h2>
                <span className="text-xs text-slate-400">
                  {bots.length} {bots.length === 1 ? 'instância' : 'instâncias'} alocadas • Clique para abrir o painel detalhado
                </span>
              </div>

              <BotGrid
                bots={bots}
                selectedBotId={selectedBotId}
                onSelectBot={(id) => setSelectedBotId(id)}
                onOpenDetails={(id) => setFocusedBotId(id)}
                onToggleStatus={handleToggleStatus}
                onDeleteBot={handleDeleteBot}
                onSetupTelegram={handleSetupTelegram}
              />
            </section>

            {/* Console de Terminal em Tempo Real */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Live Console & Gateway Heartbeats
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  Opcode 1 • Realtime Supabase Stream
                </span>
              </div>

              <LiveTerminal selectedBot={selectedBot} />
            </section>
          </>
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

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-6 px-4 text-center text-xs text-slate-500 font-mono">
        AETHELKOV AUTONOMOUS HYBRID GRID RUNTIME • 100% RETROCOMPATÍVEL COM DISCLOUD.CONFIG
      </footer>
    </div>
  );
}

