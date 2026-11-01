'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AethelLog, AethelBot } from '@/lib/types';
import { Terminal as TerminalIcon, Trash2, ArrowDownCircle, RefreshCw, FileText } from 'lucide-react';

interface LiveTerminalProps {
  selectedBot: AethelBot | null;
}

export const LiveTerminal: React.FC<LiveTerminalProps> = ({ selectedBot }) => {
  const [logs, setLogs] = useState<AethelLog[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from('aethel_logs')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (selectedBot) {
      query = query.eq('bot_id', selectedBot.id);
    }

    const { data } = await query;
    if (data) {
      setLogs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();

    const channel = supabase
      .channel('terminal_live_mirror')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'aethel_logs',
        },
        (payload) => {
          const newLog = payload.new as AethelLog;
          if (!selectedBot || newLog.bot_id === selectedBot.id) {
            setLogs((prev) => [...prev, newLog]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedBot?.id]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleExportLogs = () => {
    const text = logs.map(l => `[${new Date(l.created_at).toLocaleTimeString()}] [${l.log_level}] ${l.message}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aethelkov-${selectedBot ? selectedBot.bot_name : 'cluster'}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'GATEWAY':
        return 'text-emerald-400';
      case 'DISPATCH':
        return 'text-cyan-300';
      case 'WARN':
        return 'text-amber-300';
      case 'ERROR':
        return 'text-rose-400';
      default:
        return 'text-neutral-400';
    }
  };

  return (
    <div className="apple-glass-card relative overflow-hidden rounded-[32px] p-6 border border-white/12">
      <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>

      {/* Header do Terminal */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4 text-cyan-300" />
          <span className="font-mono text-xs font-semibold text-white uppercase tracking-wider">
            Live Mirror Log {selectedBot ? `• ${selectedBot.bot_name}` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1 rounded text-[10px] font-mono transition-colors ${
              autoScroll ? 'text-emerald-400' : 'text-neutral-500'
            }`}
            title="Auto-scroll"
          >
            <ArrowDownCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fetchLogs}
            className="p-1 rounded text-neutral-400 hover:text-white"
            title="Recarregar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping"></span>
        </div>
      </div>

      {/* Corpo do Terminal com Scroll */}
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto space-y-2 rounded-2xl bg-black/60 border border-white/10 p-3.5 font-mono text-[11px] text-neutral-300 shadow-inner"
      >
        {logs.length === 0 ? (
          <div className="text-neutral-500 py-12 text-center">
            Aguardando eventos da malha...
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="leading-relaxed hover:bg-white/[0.02] px-1 rounded flex items-start gap-1.5">
              <span className="text-neutral-500 select-none shrink-0">
                [{new Date(log.created_at).toLocaleTimeString()}]
              </span>
              <span className={`shrink-0 font-bold ${getBadgeColor(log.log_level)}`}>
                {log.log_level}:
              </span>
              <span className="break-all whitespace-pre-wrap text-neutral-300">
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Botão de Exportar Logs */}
      <button
        onClick={handleExportLogs}
        className="apple-pill-btn w-full mt-4 rounded-full py-2.5 font-mono text-xs text-neutral-300 flex items-center justify-center gap-2"
      >
        <FileText className="h-3.5 w-3.5" />
        <span>Exportar Registros (.log)</span>
      </button>
    </div>
  );
};
