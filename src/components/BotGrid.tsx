'use client';

import React from 'react';
import { AethelBot } from '@/lib/types';
import { Play, Square, Trash2, Terminal, ExternalLink, Bot as BotIcon, Send } from 'lucide-react';

interface BotGridProps {
  bots: AethelBot[];
  selectedBotId: string | null;
  onSelectBot: (botId: string) => void;
  onOpenDetails: (botId: string) => void;
  onToggleStatus: (botId: string, currentStatus: string) => void;
  onDeleteBot: (botId: string) => void;
  onSetupTelegram: (botId: string) => void;
}

export const BotGrid: React.FC<BotGridProps> = ({
  bots,
  selectedBotId,
  onSelectBot,
  onOpenDetails,
  onToggleStatus,
  onDeleteBot,
  onSetupTelegram,
}) => {
  if (bots.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-12 text-center border-dashed border-white/10">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <BotIcon className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Nenhum bot ativo no grid</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
          Faça o deploy do seu primeiro bot do Discord ou Telegram arrastando um arquivo zip ou colando sua configuração discloud/aethel.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bots.map((bot) => {
        const isOnline = bot.status === 'ONLINE';
        const isSelected = selectedBotId === bot.id;
        const isDiscord = bot.platform === 'DISCORD';

        return (
          <div
            key={bot.id}
            onClick={() => onOpenDetails(bot.id)}
            className={`liquid-glass rounded-2xl p-5 cursor-pointer relative transition-all duration-300 hover:scale-[1.01] ${
              isSelected
                ? 'ring-2 ring-emerald-500/50 bg-white/[0.07]'
                : 'hover:border-white/20'
            }`}
          >
            {/* Top Bar */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isDiscord
                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      : 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                  }`}
                >
                  {isDiscord ? <BotIcon className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white truncate max-w-[160px]">
                    {bot.bot_name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 uppercase">
                      {bot.config_type}.config
                    </span>
                    <span className="text-xs text-slate-400">
                      {bot.main_file}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-xs">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isOnline
                      ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse'
                      : 'bg-rose-500'
                  }`}
                ></span>
                <span className={`font-mono text-[11px] ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {bot.status}
                </span>
              </div>
            </div>

            {/* Spec Details */}
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-black/30 rounded-xl p-2.5 my-3 border border-white/5 font-mono">
              <div>
                <span className="text-slate-500 text-[10px] block">NÓ ATRIBUÍDO</span>
                <span className="text-slate-300">{bot.assigned_node || 'farol-alpha'}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">LIMITE RAM</span>
                <span className="text-slate-300">{bot.ram_limit_mb} MB</span>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1">
                {/* Start / Stop */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(bot.id, bot.status);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isOnline
                      ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                  }`}
                  title={isOnline ? 'Interromper Bot' : 'Iniciar Bot'}
                >
                  {isOnline ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                {/* Telegram Webhook Setup (if Telegram) */}
                {!isDiscord && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetupTelegram(bot.id);
                    }}
                    className="p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 transition-colors"
                    title="Configurar Webhook Telegram"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}

                {/* View Details */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDetails(bot.id);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-emerald-500/20"
                  title="Abrir Painel Completo de Telemetria e Logs"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Painel & Telemetria</span>
                </button>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBot(bot.id);
                }}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                title="Excluir Bot"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

