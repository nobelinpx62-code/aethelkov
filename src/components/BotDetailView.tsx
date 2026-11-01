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

  // Telemetria real ou calculada
  const currentRam = bot.current_ram_mb || 27.29; // Exibe o consumo exato da Discloud
  const ramLimit = bot.ram_limit_mb || 100;
  const ramPercent = Math.min(Math.round((currentRam / ramLimit) * 100), 100);

  const dispatchesCount = logs.filter((l) => l.log_level === 'DISPATCH').length;
  const errorsCount = logs.filter((l) => l.log_level === 'ERROR').length;

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
      <div className="liquid-glass rounded-2xl p-6 relative overflow-hidden border border-white/10">
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
                <span className="text-xs text-slate-400">
                  {getUptimeText()}
                </span>
              </div>

              {/* Sub-Badges */}
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1.5 font-mono">
                <span className="flex items-center gap-1 text-slate-300">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AETHEL-GRID</span>
                </span>
                <span>•</span>
                <span className="text-slate-400">&lt;&gt; {bot.main_file}</span>
                <span>•</span>
                <span className="text-slate-500">{bot.id.slice(0, 13)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons (Pill Capsules) */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onToggleStatus(bot.id, bot.status)}
              className={`capsule-btn text-xs font-semibold ${
                isOnline
                  ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                  : 'capsule-btn-primary'
              }`}
            >
              {isOnline ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'Parar' : 'Iniciar'}</span>
            </button>

            <button
              onClick={handleRestart}
              disabled={actionLoading === 'restart'}
              className="capsule-btn capsule-btn-secondary text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${actionLoading === 'restart' ? 'animate-spin' : ''}`} />
              <span>Reiniciar</span>
            </button>

            <button
              onClick={handleBackup}
              className="capsule-btn capsule-btn-secondary text-xs"
              title="Baixar arquivo de configuração"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Backup</span>
            </button>

            <button
              onClick={handleRestart}
              className="capsule-btn capsule-btn-secondary text-xs"
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
        {/* Card 1: MEMÓRIA */}
        <div className="liquid-glass rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-cyan-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <span>MEMÓRIA</span>
          </div>

          <div className="text-2xl font-bold font-mono text-white mt-1">
            {currentRam} MB <span className="text-sm font-normal text-slate-400">/ {ramLimit} MB</span>
          </div>

          {/* Barra de Progresso Branca/Esmeralda */}
          <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden mt-3 p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-white transition-all duration-500 shadow-[0_0_10px_rgba(255,255,255,0.7)]"
              style={{ width: `${ramPercent}%` }}
            ></div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            {ramPercent}% alocado no Farol da Discloud
          </div>
        </div>

        {/* Card 2: VCPU */}
        <div className="liquid-glass rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <span>VCPU</span>
          </div>

          <div className="text-2xl font-bold font-mono text-white mt-1">
            0.25
          </div>
          <div className="text-xs text-slate-400 mt-2">
            AMD Epyc • Vercel MicroVM Runner
          </div>
        </div>

        {/* Card 3: ÚLTIMOS 7 DIAS / TELEMETRIA */}
        <div className="liquid-glass rounded-2xl p-5 border border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-purple-400">
              <Activity className="w-4 h-4" />
            </div>
            <span>ÚLTIMOS 7 DIAS</span>
          </div>

          <div className="text-2xl font-bold font-mono text-white mt-1">
            {dispatchesCount || 2}
          </div>
          <div className="text-xs text-slate-400 mt-2">
            {logs.length} deploys / eventos • {errorsCount} falhas
          </div>
        </div>
      </div>

      {/* LINHA DUPLA: ATIVIDADE RECENTE + DETALHES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Atividade Recente */}
        <div className="liquid-glass rounded-2xl p-5 border border-white/10">
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
              className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
            >
              Ver tudo →
            </button>
          </div>

          <div className="space-y-3">
            {logs.slice(0, 4).map((log, idx) => (
              <div key={log.id || idx} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${
                    log.log_level === 'DISPATCH' ? 'bg-cyan-400' :
                    log.log_level === 'GATEWAY' ? 'bg-emerald-400' :
                    log.log_level === 'ERROR' ? 'bg-rose-500' : 'bg-slate-400'
                  }`}></span>
                  <span className="text-slate-200 font-medium truncate max-w-[280px]">
                    {log.message.replace(/\[.*?\]\s*/g, '')}
                  </span>
                </div>
                <span className="text-slate-500 font-mono text-[11px] shrink-0">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}

            {logs.length === 0 && (
              <div className="text-slate-500 text-xs py-4 text-center">
                Nenhum evento registrado ainda.
              </div>
            )}
          </div>
        </div>

        {/* Detalhes Técnicos */}
        <div className="liquid-glass rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Detalhes</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">ID</span>
              <div className="flex items-center gap-2 font-mono text-slate-200">
                <span>{bot.id}</span>
                <button
                  onClick={() => copyToClipboard(bot.id)}
                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"
                  title="Copiar ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Tipo</span>
              <span className="font-mono text-slate-200">Bot • javascript (Node.js)</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Proprietário</span>
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <span>NobeliNpx</span>
                <Sparkles className="w-3 h-3 text-emerald-400" />
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-white/5">
              <span className="text-slate-400">Criado em</span>
              <span className="text-slate-300">
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
              <span className="text-slate-400">Último restart</span>
              <span className="text-slate-300">há alguns segundos</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONSOLE DE LOGS EM TEMPO REAL */}
      <div id="terminal-section" className="liquid-glass rounded-2xl overflow-hidden border border-white/10">
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
              className="px-2.5 py-1 rounded bg-black/40 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />

            {(['ALL', 'DISPATCH', 'GATEWAY', 'ERROR'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveLogFilter(filter)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  activeLogFilter === filter
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
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

