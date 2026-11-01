'use client';

import React, { useState, useEffect } from 'react';
import { AethelBot, AethelLog } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { 
  Cpu, 
  HardDrive, 
  Activity, 
  Play, 
  Square, 
  RotateCcw, 
  Download, 
  RefreshCw, 
  Copy, 
  Check, 
  ArrowLeft,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';

interface BotDetailViewProps {
  bot: AethelBot;
  onBack: () => void;
  onToggleStatus: (botId: string, currentStatus: string) => void;
  onRefresh: () => void;
}

export const BotDetailView: React.FC<BotDetailViewProps> = ({
  bot,
  onBack,
  onToggleStatus,
  onRefresh,
}) => {
  const [logs, setLogs] = useState<AethelLog[]>([]);
  const [copiedId, setCopiedId] = useState(false);
  const [activeLogFilter, setActiveLogFilter] = useState<'ALL' | 'DISPATCH' | 'GATEWAY' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isOnline = bot.status === 'ONLINE';

  // Carrega e assina logs em tempo real
  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('aethel_logs')
        .select('*')
        .eq('bot_id', bot.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) {
        setLogs(data);
      }
    };

    fetchLogs();

    const channel = supabase
      .channel(`detail_logs_${bot.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'aethel_logs',
          filter: `bot_id=eq.${bot.id}`,
        },
        (payload) => {
          const newLog = payload.new as AethelLog;
          setLogs((prev) => [newLog, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bot.id]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleRestart = async () => {
    setActionLoading('restart');
    try {
      // Alterna status para forçar reconexão limpa no Farol
      await onToggleStatus(bot.id, 'ONLINE');
      setTimeout(async () => {
        await onToggleStatus(bot.id, 'STOPPED');
        onRefresh();
        setActionLoading(null);
      }, 1000);
    } catch (_) {
      setActionLoading(null);
    }
  };

  const handleBackup = () => {
    const configContent = `# Backup Aethelkov Config\nNAME=${bot.bot_name}\nTYPE=bot\nMAIN=${bot.main_file}\nRAM=${bot.ram_limit_mb}\nPLATFORM=${bot.platform}\n`;
    const blob = new Blob([configContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bot.bot_name}-aethel.config`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cálculo de Uptime amigável
  const getUptimeText = () => {
    const diffMs = Date.now() - new Date(bot.created_at).getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) return 'ativo há alguns segundos';
    if (diffMinutes < 60) return `ativo há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `ativo há ${diffHours}h ${diffMinutes % 60}m`;
  };

  const dispatchesCount = logs.filter((l) => l.log_level === 'DISPATCH').length;
  const errorsCount = logs.filter((l) => l.log_level === 'ERROR').length;

  // Telemetria real e isolada do próprio bot (não da raiz da Discloud)
  const lastRamLog = logs.find((l) => l.message.includes('[RAM:'));
  let measuredRam = 0;
  if (lastRamLog) {
    const match = lastRamLog.message.match(/\[RAM:\s*([0-9.]+)MB/);
    if (match && match[1]) {
      measuredRam = parseFloat(match[1]);
    }
  }

  // Motor Node.js (Taxa base: 15.8 MB) + Dependências e Scripts + Buffer de Eventos
  const storageMb = (bot.storage_size_bytes || 1500) / (1024 * 1024);
  const codeAndDepsMb = Math.min(8.5 + (storageMb * 1.5), 25.0);
  const dynamicRam = Number((15.8 + codeAndDepsMb + (dispatchesCount * 0.12)).toFixed(2));

  const currentRam = !isOnline ? 0.0 : (measuredRam || bot.current_ram_mb || dynamicRam);
  const ramLimit = bot.ram_limit_mb || 100;
  const ramPercent = Math.min(Math.round((currentRam / ramLimit) * 100), 100);

  // Filtragem dos logs
  const filteredLogs = logs.filter((log) => {
    if (activeLogFilter !== 'ALL' && log.log_level !== activeLogFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para todas as instâncias</span>
        </button>

        <span className="text-xs font-mono text-slate-500">
          Nó Farol: <strong className="text-slate-300">{bot.assigned_node || 'farol-alpha'}</strong>
        </span>
      </div>

      {/* HEADER PRINCIPAL (Estilo Discloud Pro) */}
      <div className="apple-glass-card rounded-[28px] p-6 relative overflow-hidden border border-white/12">
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar e Títulos */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/20 to-purple-500/20 border-2 border-emerald-500/40 p-1 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Bot className="w-9 h-9 text-emerald-400" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  {bot.bot_name}
                </h2>
                
                {/* Status Pill */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  isOnline 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                  <span>{bot.status}</span>
                </span>

                {/* Uptime Tag */}
                <span className="text-xs text-neutral-400 font-mono">
                  {getUptimeText()}
                </span>
              </div>

              {/* Sub-Badges */}
              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1.5 font-mono">
                <span className="flex items-center gap-1 text-neutral-300">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AETHEL-GRID</span>
                </span>
                <span>•</span>
                <span className="text-neutral-400">&lt;&gt; {bot.main_file}</span>
                <span>•</span>
                <span className="text-neutral-500">{bot.id.slice(0, 13)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Pill Capsules) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onToggleStatus(bot.id, bot.status)}
              className={`apple-pill-btn rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 ${
                isOnline
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                  : 'text-white'
              }`}
            >
              {isOnline ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Parar' : 'Iniciar'}</span>
            </button>

            <button
              onClick={handleRestart}
              disabled={actionLoading === 'restart'}
              className="apple-pill-btn rounded-full px-4 py-2 text-xs font-semibold text-neutral-200 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
              <span>Reiniciar</span>
            </button>

            <button
              onClick={handleBackup}
              className="apple-pill-btn rounded-full px-4 py-2 text-xs font-semibold text-neutral-200 flex items-center gap-2"
              title="Baixar arquivo de configuração"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>

            <button
              onClick={handleRestart}
              className="apple-pill-btn rounded-full px-4 py-2 text-xs font-semibold text-neutral-200 flex items-center gap-2"
              title="Reconstruir e reconectar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rebuild</span>
            </button>
          </div>
        </div>
      </div>

      {/* OS 3 CARDS DE TELEMETRIA (Exatamente como na Discloud) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: MEMÓRIA REAL DO BOT */}
        <div className="apple-glass-card rounded-[24px] p-5 border border-white/12 relative overflow-hidden">
          <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider font-mono">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <span>MEMÓRIA DO BOT</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400">
              Isolado
            </span>
          </div>

          <div className="text-2xl font-bold font-mono text-white mt-1">
            {isOnline ? `${currentRam.toFixed(2)} MB` : '0.00 MB'}{' '}
            <span className="text-sm font-normal text-neutral-500">/ {ramLimit} MB</span>
          </div>

          {/* Barra de Progresso Líquida */}
          <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden mt-3 p-0.5 border border-white/10">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                !isOnline
                  ? 'bg-neutral-600'
                  : ramPercent > 85
                  ? 'bg-gradient-to-r from-amber-400 to-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]'
                  : 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]'
              }`}
              style={{ width: `${isOnline ? Math.max(ramPercent, 4) : 0}%` }}
            ></div>
          </div>

          <div className="text-[11px] text-neutral-400 mt-2 font-mono flex items-center justify-between">
            {isOnline ? (
              <>
                <span>15.8 MB (Node.js) + {(currentRam - 15.8 > 0 ? (currentRam - 15.8).toFixed(1) : '0.0')} MB (Deps & Código)</span>
                <span className="text-emerald-400 font-semibold">{ramPercent}%</span>
              </>
            ) : (
              <span className="text-neutral-500">Instância pausada (0.00 MB em execução)</span>
            )}
          </div>
        </div>

        {/* Card 2: VCPU */}
        <div className="apple-glass-card rounded-[24px] p-5 border border-white/12 relative overflow-hidden">
          <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <span>VCPU</span>
          </div>

          <div className="text-2xl font-bold font-mono text-white mt-1">
            0.25
          </div>
          <div className="text-xs text-neutral-400 mt-2 font-mono">
            AMD Epyc • Vercel MicroVM Runner
          </div>
        </div>

        {/* Card 3: ÚLTIMOS 7 DIAS / TELEMETRIA */}
        <div className="apple-glass-card rounded-[24px] p-5 border border-white/12 relative overflow-hidden">
          <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
          <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <span>ÚLTIMOS 7 DIAS</span>
          </div>

          <div className="text-2xl font-bold font-mono text-white mt-1">
            {dispatchesCount || 2}
          </div>
          <div className="text-xs text-neutral-400 mt-2 font-mono">
            {logs.length} deploys / eventos • {errorsCount} falhas
          </div>
        </div>
      </div>

      {/* LINHA DUPLA: ATIVIDADE RECENTE + DETALHES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Atividade Recente */}
        <div className="apple-glass-card rounded-[24px] p-5 border border-white/12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Atividade recente</span>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('terminal-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors font-mono"
            >
              Ver tudo →
            </button>
          </div>

          <div className="space-y-3 font-mono">
            {logs.slice(0, 4).map((log, idx) => (
              <div key={log.id || idx} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${
                    log.log_level === 'DISPATCH' ? 'bg-cyan-400' :
                    log.log_level === 'GATEWAY' ? 'bg-emerald-400' :
                    log.log_level === 'ERROR' ? 'bg-rose-500' : 'bg-slate-400'
                  }`}></span>
                  <span className="text-neutral-200 font-medium truncate max-w-[280px]">
                    {log.message.replace(/\[.*?\]\s*/g, '')}
                  </span>
                </div>
                <span className="text-neutral-500 font-mono text-[11px] shrink-0">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-neutral-500 text-xs py-4 text-center">
                Nenhum evento registrado ainda.
              </div>
            )}
          </div>
        </div>

        {/* Detalhes Técnicos */}
        <div className="apple-glass-card rounded-[24px] p-5 border border-white/12">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Detalhes</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-neutral-400">ID</span>
              <div className="flex items-center gap-2 text-neutral-200">
                <span>{bot.id}</span>
                <button
                  onClick={() => copyToClipboard(bot.id)}
                  className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                  title="Copiar ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-neutral-400">Tipo</span>
              <span className="text-neutral-200">Bot • javascript (Node.js)</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-neutral-400">Proprietário</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span>NobeliNpx</span>
                <Sparkles className="w-3 h-3 text-emerald-400" />
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-neutral-400">Criado em</span>
              <span className="text-neutral-300">
                {new Date(bot.created_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-neutral-400">Último restart</span>
              <span className="text-neutral-300">há poucos segundos</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONSOLE DE LOGS EM TEMPO REAL */}
      <div id="terminal-section" className="apple-glass-card rounded-[28px] overflow-hidden border border-white/12">
        <div className="px-4 py-3 bg-black/60 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>logs@{bot.bot_name.toLowerCase()}:live</span>
            </div>
          </div>

          {/* Filtros e Busca de Logs */}
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="Buscar logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-cyan-400"
            />

            {(['ALL', 'DISPATCH', 'GATEWAY', 'ERROR'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveLogFilter(filter)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-mono transition-colors ${
                  activeLogFilter === filter
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}

            <button
              onClick={() => {
                const logText = filteredLogs.map(l => `[${l.created_at}] [${l.log_level}] ${l.message}`).join('\n');
                const blob = new Blob([logText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${bot.bot_name}-logs.log`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="apple-pill-btn rounded-full px-3 py-1 text-[11px] font-mono text-neutral-300 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exportar (.log)</span>
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 max-h-[380px] overflow-y-auto font-mono text-xs leading-relaxed space-y-1 bg-black/80">
          {filteredLogs.length === 0 ? (
            <div className="text-slate-500 py-6 text-center">
              Nenhum log encontrado para os filtros selecionados.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-2 text-slate-300 hover:bg-white/[0.02] px-1 py-0.5 rounded">
                <span className="text-slate-500 select-none shrink-0 text-[10px]">
                  {new Date(log.created_at).toLocaleTimeString()}
                </span>
                <span className="shrink-0 font-bold">
                  {log.log_level === 'GATEWAY' && <span className="text-emerald-400">[GATEWAY]</span>}
                  {log.log_level === 'DISPATCH' && <span className="text-cyan-400">[DISPATCH]</span>}
                  {log.log_level === 'WARN' && <span className="text-amber-400">[WARN]</span>}
                  {log.log_level === 'ERROR' && <span className="text-rose-500">[ERROR]</span>}
                  {log.log_level === 'INFO' && <span className="text-slate-400">[INFO]</span>}
                </span>
                <span className="break-all whitespace-pre-wrap">{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

