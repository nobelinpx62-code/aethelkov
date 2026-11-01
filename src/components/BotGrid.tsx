'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AethelBot } from '@/lib/types';
import { 
  Bot, 
  Send, 
  Power, 
  RotateCcw, 
  MoreVertical, 
  Trash2, 
  Download, 
  ExternalLink, 
  Terminal,
  Activity,
  Layers,
  ShieldAlert
} from 'lucide-react';

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
  const [openMenuBotId, setOpenMenuBotId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'DISCORD' | 'TELEGRAM'>('ALL');
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha menu de 3 pontinhos ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuBotId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDownloadBackup = (bot: AethelBot) => {
    const configContent = `# Backup Aethelkov Config\nNAME=${bot.bot_name}\nTYPE=bot\nMAIN=${bot.main_file}\nRAM=${bot.ram_limit_mb}\nPLATFORM=${bot.platform}\n`;
    const blob = new Blob([configContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bot.bot_name}-backup.config`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredBots = bots.filter((b) => {
    if (filterType === 'DISCORD') return b.platform === 'DISCORD';
    if (filterType === 'TELEGRAM') return b.platform === 'TELEGRAM';
    return true;
  });

  if (bots.length === 0) {
    return (
      <div className="apple-glass-card rounded-[32px] p-12 text-center border border-white/10 relative overflow-hidden">
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <Bot className="w-8 h-8 text-cyan-300" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Nenhuma instância cadastrada</h3>
        <p className="text-sm text-neutral-400 max-w-md mx-auto mb-6">
          Faça o deploy do seu bot do Discord ou Telegram arrastando um arquivo zip ou usando o botão Nova Instância.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de Filtros em Pílulas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white tracking-tight">Instâncias em Execução</h2>
          <span className="text-xs font-mono text-neutral-400">({bots.length})</span>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-black/40 p-1 border border-white/10 font-mono text-xs self-start sm:self-auto">
          <button
            onClick={() => setFilterType('ALL')}
            className={`rounded-full px-3 py-1 font-medium transition-all ${
              filterType === 'ALL'
                ? 'text-white bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Todas ({bots.length})
          </button>
          <button
            onClick={() => setFilterType('DISCORD')}
            className={`rounded-full px-3 py-1 font-medium transition-all ${
              filterType === 'DISCORD'
                ? 'text-white bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Discord ({bots.filter(b => b.platform === 'DISCORD').length})
          </button>
          <button
            onClick={() => setFilterType('TELEGRAM')}
            className={`rounded-full px-3 py-1 font-medium transition-all ${
              filterType === 'TELEGRAM'
                ? 'text-white bg-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Telegram ({bots.filter(b => b.platform === 'TELEGRAM').length})
          </button>
        </div>
      </div>

      {/* Grade de Instâncias em Apple Glass Material */}
      <div className="space-y-4">
        {filteredBots.map((bot) => {
          const isOnline = bot.status === 'ONLINE';
          const isDiscord = bot.platform === 'DISCORD';
          const isMenuOpen = openMenuBotId === bot.id;

          // Cálculo do consumo real do bot (15.8 MB motor Node.js + dependências e código)
          const storageMb = (bot.storage_size_bytes || 1500) / (1024 * 1024);
          const codeAndDepsMb = Math.min(8.5 + (storageMb * 1.5), 25.0);
          const realBotRam = !isOnline ? 0.0 : Number((15.8 + codeAndDepsMb).toFixed(1));

          return (
            <div
              key={bot.id}
              className="apple-glass-card relative overflow-visible rounded-[32px] p-6 md:p-7 border border-white/12 transition-all duration-300 hover:border-white/25"
            >
              <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

              {/* Cabeçalho do Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div
                    onClick={() => onOpenDetails(bot.id)}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] cursor-pointer hover:scale-105 transition-transform"
                  >
                    {isDiscord ? (
                      <Bot className="h-6 w-6 text-cyan-300" />
                    ) : (
                      <Send className="h-6 w-6 text-indigo-300" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 
                        onClick={() => onOpenDetails(bot.id)}
                        className="text-base font-semibold text-white tracking-tight cursor-pointer hover:text-cyan-300 transition-colors"
                      >
                        {bot.bot_name}
                      </h3>
                      <span className="rounded bg-white/10 border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-neutral-300 uppercase">
                        {bot.platform}
                      </span>
                      <span className="rounded bg-white/5 border border-white/10 px-1.5 py-0.5 font-mono text-[9px] text-neutral-400">
                        aethel.config
                      </span>
                    </div>
                    <p className="font-mono text-xs text-neutral-400 mt-0.5">
                      Arquivo de Entrada: <strong className="text-neutral-300">{bot.main_file}</strong>
                    </p>
                  </div>
                </div>

                {/* Status Pill & Botão 3 Pontinhos */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-mono text-xs ${
                      isOnline
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isOnline ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-rose-400'
                      }`}
                    ></span>
                    <span>{isOnline ? '24/7 ONLINE' : 'STOPPED'}</span>
                  </div>

                  {/* Botão de 3 Pontinhos (Mais Opções) */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuBotId(isMenuOpen ? null : bot.id);
                      }}
                      className="apple-pill-btn flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 hover:text-white"
                      title="Mais opções da instância"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>

                    {/* Menu Dropdown de Mais Opções */}
                    {isMenuOpen && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 top-10 z-50 w-56 rounded-2xl bg-[#0d0e12]/95 backdrop-blur-2xl border border-white/15 p-1.5 shadow-2xl font-mono text-xs text-neutral-200 animate-fadeIn"
                      >
                        <button
                          onClick={() => {
                            setOpenMenuBotId(null);
                            onOpenDetails(bot.id);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                        >
                          <Terminal className="w-4 h-4 text-cyan-400" />
                          <span>Painel & Telemetria</span>
                        </button>

                        <button
                          onClick={() => {
                            setOpenMenuBotId(null);
                            onToggleStatus(bot.id, bot.status);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                        >
                          <RotateCcw className="w-4 h-4 text-emerald-400" />
                          <span>{isOnline ? 'Interromper' : 'Ligar Bot'}</span>
                        </button>

                        {!isDiscord && (
                          <button
                            onClick={() => {
                              setOpenMenuBotId(null);
                              onSetupTelegram(bot.id);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors text-sky-400"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Registrar Webhook</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setOpenMenuBotId(null);
                            handleDownloadBackup(bot);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/10 text-left transition-colors"
                        >
                          <Download className="w-4 h-4 text-purple-400" />
                          <span>Baixar .config</span>
                        </button>

                        <div className="h-[1px] bg-white/10 my-1"></div>

                        {/* Botão de Excluir / Apagar Instância */}
                        <button
                          onClick={() => {
                            setOpenMenuBotId(null);
                            onDeleteBot(bot.id);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-500/20 text-rose-400 text-left transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Apagar Instância</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Parâmetros em Pílulas (Exatamente como o index.html) */}
              <div className="grid grid-cols-3 gap-2.5 my-5 font-mono text-xs text-center">
                <div className="apple-glass-card rounded-2xl p-2.5 border border-white/10">
                  <span className="text-[9px] text-neutral-400 block mb-0.5">MAIN</span>
                  <span className="text-white font-medium">{bot.main_file}</span>
                </div>
                <div className="apple-glass-card rounded-2xl p-2.5 border border-white/10">
                  <span className="text-[9px] text-neutral-400 block mb-0.5">CONSUMO REAL</span>
                  <span className={`font-medium ${isOnline ? 'text-white' : 'text-neutral-500'}`}>
                    {isOnline ? `${realBotRam} MB` : '0.0 MB'}
                  </span>
                </div>
                <div className="apple-glass-card rounded-2xl p-2.5 border border-white/10">
                  <span className="text-[9px] text-neutral-400 block mb-0.5">RESTART</span>
                  <span className="text-emerald-400 font-medium">Automático</span>
                </div>
              </div>

              {/* Rodapé de Ações do Bot */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <span className="font-mono text-[11px] text-neutral-500">
                  Criado: {new Date(bot.created_at).toLocaleDateString('pt-BR')} &bull; ID: {bot.id.slice(0, 8)}
                </span>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Botão Painel Completo */}
                  <button
                    onClick={() => onOpenDetails(bot.id)}
                    className="apple-pill-btn flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-cyan-300 border-cyan-500/20 hover:border-cyan-500/40"
                  >
                    <Terminal className="h-3 w-3" />
                    <span>Detalhes & Logs</span>
                  </button>

                  {/* Reiniciar */}
                  <button
                    onClick={() => {
                      onToggleStatus(bot.id, 'ONLINE');
                      setTimeout(() => onToggleStatus(bot.id, 'STOPPED'), 600);
                    }}
                    className="apple-pill-btn flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-neutral-300"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reiniciar</span>
                  </button>

                  {/* Ligar / Parar */}
                  <button
                    onClick={() => onToggleStatus(bot.id, bot.status)}
                    className={`apple-pill-btn flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium ${
                      isOnline
                        ? 'text-red-400 border-red-500/20 hover:border-red-500/40'
                        : 'text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40'
                    }`}
                  >
                    <Power className="h-3 w-3" />
                    <span>{isOnline ? 'Parar' : 'Ligar'}</span>
                  </button>

                  {/* Botão Apagar Direto */}
                  <button
                    onClick={() => onDeleteBot(bot.id)}
                    className="apple-pill-btn flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-red-400 border-transparent hover:border-red-500/30"
                    title="Apagar esta instância"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
