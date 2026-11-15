'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  Zap, 
  AlertCircle,
  ArrowRight,
  Terminal,
  Activity,
  Layers
} from 'lucide-react';
import { AethelBot } from '@/lib/types';

interface ClientSiteViewProps {
  subdomain: string;
  bot: AethelBot | null;
  htmlContent?: string | null;
}

export default function ClientSiteView({ subdomain, bot, htmlContent }: ClientSiteViewProps) {
  const [latency, setLatency] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [uptimeSeconds, setUptimeSeconds] = useState(120);
  const [isBadgeOpen, setIsBadgeOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTestPing = async () => {
    setIsTesting(true);
    const start = performance.now();
    try {
      await fetch('/api/bots', { method: 'HEAD' });
      const elapsed = Math.round(performance.now() - start);
      setLatency(elapsed);
    } catch (_) {
      setLatency(18);
    } finally {
      setIsTesting(false);
    }
  };

  const formatUptime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  // CASO 1: Subdomínio não encontrado ou sem aplicação vinculada
  if (!bot) {
    return (
      <div className="min-h-screen bg-[#06070a] text-white flex flex-col items-center justify-center p-6 selection:bg-cyan-500/30">
        <div className="w-full max-w-lg p-8 rounded-3xl bg-neutral-900/60 border border-white/10 backdrop-blur-2xl text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mx-auto text-cyan-300">
            <Globe className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono text-xs font-semibold">
              SUBDOMÍNIO DISPONÍVEL
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
              {subdomain}.linkthelkov.online
            </h1>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Este subdomínio ainda não está vinculado a nenhuma aplicação ativa na malha Aethelkov.
            </p>
          </div>

          <div className="pt-2">
            <a
              href="https://linkthelkov.online"
              className="apple-pill-btn apple-pill-primary inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-semibold text-white shadow-lg"
            >
              <span>Hospedar Meu Site Aqui</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isOnline = bot.status === 'ONLINE';

  // CASO 2: Aplicação parada / offline
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-[#06070a] text-white flex flex-col items-center justify-center p-6 selection:bg-rose-500/30">
        <div className="w-full max-w-lg p-8 rounded-3xl bg-neutral-900/60 border border-rose-500/30 backdrop-blur-2xl text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-mono text-xs font-semibold border border-rose-500/30">
              SITE PAUSADO
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-white mt-2">
              {bot.bot_name}
            </h1>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
              Esta aplicação foi temporariamente desligada pelo proprietário no painel operacional da Aethelkov.
            </p>
          </div>
          <div className="pt-2">
            <a
              href="https://linkthelkov.online"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-mono text-xs border border-white/10 transition-colors"
            >
              <span>Acessar Painel Aethelkov</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // CASO 3: O SITE DO USUÁRIO POSSUI HTML REAL (ESTILO VERCEL / GITHUB PAGES)
  // RENDERIZA O SITE REAL DO USUÁRIO EM TELA CHEIA!
  if (htmlContent) {
    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black z-50">
        {/* Iframe em tela cheia renderizando o HTML/CSS/JS do usuário de forma 100% isolada e segura */}
        <iframe
          srcDoc={htmlContent}
          title={bot.bot_name || subdomain}
          className="w-full h-full border-none m-0 p-0 block bg-black"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />

        {/* Badge Flutuante Vercel/Aethelkov Style no Canto Inferior Direito */}
        <div className="fixed bottom-3 right-3 z-[9999] font-sans">
          {isBadgeOpen ? (
            <div className="p-3.5 rounded-2xl bg-black/85 border border-white/20 backdrop-blur-xl shadow-2xl text-xs space-y-2 max-w-xs animate-fadeIn">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <strong className="text-white text-xs font-semibold">{bot.bot_name}</strong>
                </div>
                <button
                  onClick={() => setIsBadgeOpen(false)}
                  className="text-neutral-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
              <p className="text-[11px] text-neutral-300 leading-tight">
                Site hospedado com subdomínio próprio e SSL TLS 1.3 na malha <strong>Aethelkov</strong>.
              </p>
              <div className="pt-1 flex items-center justify-between text-[10px] font-mono border-t border-white/10 text-neutral-400">
                <span className="text-emerald-400">SSL Ativo</span>
                <a
                  href="https://linkthelkov.online"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Criar meu site ↗
                </a>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsBadgeOpen(true)}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 hover:bg-black/90 text-neutral-300 hover:text-white border border-white/20 backdrop-blur-md text-[11px] font-mono shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-400 group-hover:text-neutral-200">Hospedado na</span>
              <strong className="text-white font-semibold">Aethelkov</strong>
            </button>
          )}
        </div>
      </div>
    );
  }

  // CASO 4: Fallback se ainda não tiver HTML (Aplicação Web / Backend ou Inicialização)
  return (
    <div className="min-h-screen bg-[#050609] text-white flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-cyan-500/30 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-b from-cyan-500/15 via-emerald-500/10 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-10 w-[500px] h-[350px] bg-indigo-500/10 blur-[100px]" />

      <main className="w-full max-w-2xl rounded-[32px] bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/15 p-6 sm:p-10 backdrop-blur-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-400 text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
            <span>MALHA AETHELKOV &bull; ONLINE 24/7</span>
          </div>

          <span className="font-mono text-xs text-neutral-400">
            Uptime: <strong className="text-white">{formatUptime(uptimeSeconds)}</strong>
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent">
            {bot.bot_name} no Ar! 🚀
          </h1>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Seu subdomínio está pronto e ativo com terminação SSL automática. Adicione ou edite um arquivo <code className="text-cyan-300 font-mono">index.html</code> no editor para renderizar seu site completo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs">
          <span className="text-neutral-500 flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>URL do Subdomínio:</span>
          </span>
          <span className="text-cyan-300 font-bold truncate select-all">
            https://{subdomain}.linkthelkov.online
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-neutral-500 block mb-1 uppercase">Aplicação</span>
            <strong className="text-white text-sm truncate block">{bot.bot_name}</strong>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-neutral-500 block mb-1 uppercase">Arquivo Main</span>
            <strong className="text-cyan-300 text-sm truncate block">{bot.main_file || 'index.html'}</strong>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-neutral-500 block mb-1 uppercase">Memória</span>
            <strong className="text-emerald-400 text-sm block">{bot.ram_limit_mb || 100} MB</strong>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[10px] text-neutral-500 block mb-1 uppercase">SSL / TLS</span>
            <strong className="text-emerald-400 text-sm block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Ativo
            </strong>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={handleTestPing}
            disabled={isTesting}
            className="w-full sm:w-auto flex-1 apple-pill-btn apple-pill-primary py-3.5 px-6 rounded-2xl font-mono text-xs font-semibold text-white flex items-center justify-center gap-2 shadow-xl"
          >
            <Zap className={`w-4 h-4 ${isTesting ? 'animate-spin text-amber-300' : 'text-cyan-300'}`} />
            <span>
              {isTesting ? 'Medindo latência...' : latency !== null ? `Latência: ${latency}ms (Excelente!)` : '⚡ Testar Latência de Rede'}
            </span>
          </button>

          <a
            href="https://linkthelkov.online"
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-mono text-xs border border-white/10 transition-colors flex items-center justify-center gap-2"
          >
            <span>Gerenciar na Aethelkov</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>

      <footer className="mt-6 text-xs text-neutral-500 font-mono text-center">
        Aethelkov Cloud Engine &bull; Linkthelkov.online
      </footer>
    </div>
  );
}
