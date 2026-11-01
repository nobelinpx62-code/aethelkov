'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Server, 
  Cpu, 
  HardDrive, 
  Activity, 
  RefreshCw, 
  Download, 
  Trash2, 
  Copy, 
  Check, 
  Terminal, 
  Sparkles,
  Layers,
  Power,
  RotateCcw
} from 'lucide-react';
import { DiscoveredNode } from './AdminPanel';
import { supabase } from '@/lib/supabase';
import { AethelLog } from '@/lib/types';

interface NodeDetailModalProps {
  node: DiscoveredNode | null;
  onClose: () => void;
  onDeleteNode: (nodeId: string) => void;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
  node,
  onClose,
  onDeleteNode,
}) => {
  const [logs, setLogs] = useState<AethelLog[]>([]);
  const [copiedId, setCopiedId] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilter, setLogFilter] = useState<'ALL' | 'GATEWAY' | 'HEARTBEAT' | 'ERROR'>('ALL');

  useEffect(() => {
    if (!node) return;

    const fetchNodeLogs = async () => {
      try {
        const { data } = await supabase
          .from('aethel_logs')
          .select('*')
          .or(`message.like.%${node.nodeId}%,message.like.%[NODE_HEARTBEAT]%,message.like.%farol%`)
          .order('created_at', { ascending: false })
          .limit(80);

        if (data) {
          setLogs(data);
        }
      } catch (err) {
        console.error('Erro ao carregar logs do nó:', err);
      }
    };

    fetchNodeLogs();

    // Inscrição em tempo real para os logs deste nó
    const channel = supabase
      .channel(`node_logs_${node.nodeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'aethel_logs',
        },
        (payload) => {
          const newLog = payload.new as AethelLog;
          if (
            newLog.message.includes(node.nodeId) ||
            newLog.message.includes('[NODE_HEARTBEAT]') ||
            newLog.message.includes('farol')
          ) {
            setLogs((prev) => [newLog, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [node]);

  if (!node) return null;

  const isOnline = node.status === 'ONLINE';
  const ramLimit = node.ramTotalMb || 100;
  const ramUsed = node.ramUsedMb || 27.29;
  const ramPercent = Math.min(Math.round((ramUsed / ramLimit) * 100), 100);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleRestartNode = () => {
    setIsRestarting(true);
    setTimeout(() => {
      setIsRestarting(false);
    }, 1500);
  };

  const handleDownloadBackup = () => {
    const configContent = `NAME=aethel-${node.nodeId}\nTYPE=bot\nMAIN=farol.js\nRAM=100\nAUTORESTART=true\nVERSION=latest\nAPT=tools\n`;
    const blob = new Blob([configContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aethel-${node.nodeId}.config`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportLogs = () => {
    const logText = logs.map(l => `[${l.created_at}] [${l.log_level}] ${l.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${node.nodeId}-telemetria.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((log) => {
    if (logFilter === 'HEARTBEAT' && !log.message.includes('[NODE_HEARTBEAT]')) return false;
    if (logFilter === 'GATEWAY' && log.log_level !== 'GATEWAY') return false;
    if (logFilter === 'ERROR' && log.log_level !== 'ERROR') return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="apple-glass relative w-full max-w-5xl rounded-[32px] p-6 sm:p-8 border border-white/20 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

        {/* Botão Fechar Modal */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* TOP BAR EXATAMENTE IGUAL AO PAINEL DISCLOUD */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            {/* Avatar / Mascote Estilo Discloud */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/25 via-cyan-500/15 to-purple-500/20 border-2 border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
              <Server className="h-8 w-8 text-emerald-300" />
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-black"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="text-2xl font-bold text-white tracking-tight font-mono">
                  aethel-{node.nodeId}
                </h3>

                {/* Badge de Status Online */}
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
                  isOnline 
                    ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                    : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  <span>{node.status}</span>
                </span>

                <span className="text-xs text-neutral-400 font-mono">
                  ativo há poucos segundos
                </span>
              </div>

              {/* Sub-Badges */}
              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1.5 font-mono">
                <span className="text-emerald-400 font-semibold tracking-wide">AETHEL-GRID</span>
                <span>&bull;</span>
                <span className="text-neutral-300">&lt;&gt; javascript</span>
                <span>&bull;</span>
                <span className="text-neutral-500">{node.nodeId}</span>
              </div>
            </div>
          </div>

          {/* Botões de Ação estilo Cápsula */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRestartNode}
              disabled={isRestarting}
              className="apple-pill-btn rounded-full px-4 py-2 text-xs font-mono font-semibold text-neutral-200 flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRestarting ? 'animate-spin' : ''}`} />
              <span>{isRestarting ? 'Reiniciando...' : 'Reiniciar'}</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="apple-pill-btn rounded-full px-4 py-2 text-xs font-mono font-semibold text-neutral-200 flex items-center gap-2"
              title="Baixar aethel.config deste nó"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Backup</span>
            </button>

            <button
              onClick={() => onDeleteNode(node.nodeId)}
              className="rounded-full px-4 py-2 text-xs font-mono font-semibold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-2 transition-all"
              title="Apagar este nó da malha"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Apagar Nó</span>
            </button>
          </div>
        </div>

        {/* 3 CARDS DE TELEMETRIA DISCLOUD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {/* Card 1: MEMÓRIA */}
          <div className="apple-glass-card rounded-[24px] p-5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <span>MEMÓRIA</span>
            </div>

            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                {ramUsed.toFixed(2)} MB
              </span>
              <span className="text-neutral-500 font-mono text-xs ml-2">/ {ramLimit} MB</span>
            </div>

            {/* Linha de Progresso Líquida */}
            <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden p-0.5 border border-white/10 mt-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-white shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-all duration-700"
                style={{ width: `${Math.max(ramPercent, 5)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 2: VCPU */}
          <div className="apple-glass-card rounded-[24px] p-5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Cpu className="w-4 h-4" />
              </div>
              <span>VCPU</span>
            </div>

            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                0.25
              </span>
            </div>

            <span className="text-xs font-mono text-neutral-400 block mt-1">
              AMD Epyc Core Dedicado
            </span>
          </div>

          {/* Card 3: ÚLTIMOS 7 DIAS */}
          <div className="apple-glass-card rounded-[24px] p-5 border border-white/10 relative overflow-hidden">
            <div className="flex items-center gap-2.5 text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <span>ÚLTIMOS 7 DIAS</span>
            </div>

            <div className="my-2">
              <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
                2
              </span>
            </div>

            <span className="text-xs font-mono text-neutral-400 block mt-1">
              0 deploys &bull; 0 falhas
            </span>
          </div>
        </div>

        {/* 2 COLUNAS: ATIVIDADE RECENTE & DETALHES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Coluna 1: Atividade Recente */}
          <div className="apple-glass-card rounded-[24px] p-5 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span>Atividade recente</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">Ver tudo &rarr;</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-neutral-200">Commit realizado</span>
                </div>
                <span className="text-neutral-500 text-[11px]">agora</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span className="text-neutral-200">Heartbeat síncrono registrado</span>
                </div>
                <span className="text-neutral-500 text-[11px]">{new Date(node.lastHeartbeat).toLocaleTimeString()}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  <span className="text-neutral-200">Shard socket alocado ({node.shardOffset} a {node.shardOffset + node.shardLimit - 1})</span>
                </div>
                <span className="text-neutral-500 text-[11px]">ativo</span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-neutral-200">Criado / Upload</span>
                </div>
                <span className="text-neutral-500 text-[11px]">22min atrás</span>
              </div>
            </div>
          </div>

          {/* Coluna 2: Detalhes */}
          <div className="apple-glass-card rounded-[24px] p-5 border border-white/10">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Detalhes</span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">ID</span>
                <div className="flex items-center gap-2 text-neutral-200">
                  <span>{node.nodeId}</span>
                  <button
                    onClick={() => copyToClipboard(node.nodeId)}
                    className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white"
                    title="Copiar ID"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Tipo</span>
                <span className="text-neutral-200">Bot &bull; javascript</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Proprietário</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span>NobelInpx</span>
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-white/5">
                <span className="text-neutral-400">Criado em</span>
                <span className="text-neutral-300">
                  01 de nov. de 2026, 11:23
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5">
                <span className="text-neutral-400">Último restart</span>
                <span className="text-neutral-300">há poucos segundos</span>
              </div>
            </div>
          </div>
        </div>

        {/* TERMINAL DE LOGS DO NÓ (AMPLO E COMPLETO) */}
        <div className="apple-glass-card rounded-[24px] overflow-hidden border border-white/10">
          <div className="px-4 py-3 bg-black/60 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>logs@{node.nodeId}:live</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Filtrar registros..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />

              <button
                onClick={handleExportLogs}
                className="apple-pill-btn rounded-full px-3 py-1 text-[11px] font-mono text-neutral-300 flex items-center gap-1"
              >
                <Download className="w-3 h-3 text-cyan-400" />
                <span>Exportar (.log)</span>
              </button>
            </div>
          </div>

          <div className="p-4 max-h-[300px] overflow-y-auto font-mono text-xs leading-relaxed space-y-1 bg-black/85">
            {filteredLogs.length === 0 ? (
              <div className="text-neutral-500 py-6 text-center">
                Aguardando novos eventos de telemetria de aethel-{node.nodeId}...
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-neutral-300 hover:bg-white/[0.03] px-1 py-0.5 rounded">
                  <span className="text-neutral-500 select-none shrink-0 text-[10px]">
                    {new Date(log.created_at).toLocaleTimeString()}
                  </span>
                  <span className="shrink-0 font-bold">
                    {log.log_level === 'GATEWAY' && <span className="text-emerald-400">[GATEWAY]</span>}
                    {log.log_level === 'DISPATCH' && <span className="text-cyan-400">[DISPATCH]</span>}
                    {log.log_level === 'WARN' && <span className="text-amber-400">[WARN]</span>}
                    {log.log_level === 'ERROR' && <span className="text-rose-500">[ERROR]</span>}
                    {log.log_level === 'INFO' && <span className="text-neutral-400">[INFO]</span>}
                  </span>
                  <span className="break-all whitespace-pre-wrap">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

