'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AethelLog, AethelBot } from '@/lib/types';
import { Terminal as TerminalIcon, Trash2, ArrowDownCircle, RefreshCw } from 'lucide-react';

interface LiveTerminalProps {
  selectedBot: AethelBot | null;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ selectedBot }) => {
  const [logs, setLogs] = useState<AethelLog[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Carrega histórico inicial de logs
  const fetchLogs = async () => {
    if (!selectedBot) return;
    setLoading(true);
    const { data } = await supabase
      .from('aethel_logs')
      .select('*')
      .eq('bot_id', selectedBot.id)
      .order('created_at', { ascending: true })
      .limit(100);

    if (data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedBot) {
      setLogs([]);
      return;
    }

    fetchLogs();

    // Inscrição em tempo real no Supabase Realtime para novos logs
    const channel = supabase
      .channel(`terminal_logs_${selectedBot.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'aethel_logs',
          filter: `bot_id=eq.${selectedBot.id}`,
        },
        (payload) => {
          const newLog = payload.new as AethelLog;
          setLogs((prev) => [...prev, newLog]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBot?.id]);

  // Auto-scroll
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'GATEWAY':
        return <span className="text-emerald-400 font-bold">[GATEWAY]</span>;
      case 'DISPATCH':
        return <span className="text-cyan-400 font-bold">[DISPATCH]</span>;
      case 'WARN':
        return <span className="text-amber-400 font-bold">[WARN]</span>;
      case 'ERROR':
        return <span className="text-rose-500 font-bold">[ERROR]</span>;
      default:
        return <span className="text-slate-400 font-semibold">[INFO]</span>;
    }
  };

  return (
    <div className="liquid-glass rounded-2xl overflow-hidden flex flex-col h-[420px] border border-white/10">
      {/* Terminal Title Bar */}
      <div className="px-4 py-3 bg-black/60 border-b border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <TerminalIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {selectedBot ? `terminal@aethelkov:${selectedBot.bot_name}` : 'terminal@aethelkov:idle'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors flex items-center gap-1.5 ${
              autoScroll ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
            }`}
            title="Auto-scroll"
          >
            <ArrowDownCircle className="w-3 h-3" />
            <span>Auto-scroll</span>
          </button>
          <button
            onClick={fetchLogs}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400"
            title="Recarregar logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={clearLogs}
            className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400"
            title="Limpar tela"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed space-y-1.5 bg-black/80"
      >
        {!selectedBot ? (
          <div className="text-slate-500 py-12 text-center">
            Selecione uma instância na grade acima para inspecionar os logs de Gateway e Dispatch em tempo real.
          </div>
        ) : logs.length === 0 ? (
          <div className="text-slate-500 py-8">
            <p className="text-emerald-400">⚡ Conectado ao stream do bot &quot;{selectedBot.bot_name}&quot;.</p>
            <p className="text-slate-500 mt-1">Aguardando eventos de Gateway (Heartbeat Opcode 1) ou Dispatch da Vercel...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 text-slate-300 hover:bg-white/[0.02] px-1 rounded">
              <span className="text-slate-500 select-none shrink-0 text-[10px]">
                {new Date(log.created_at).toLocaleTimeString()}
              </span>
              <span className="shrink-0">{getLevelBadge(log.log_level)}</span>
              <span className="break-all whitespace-pre-wrap">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

