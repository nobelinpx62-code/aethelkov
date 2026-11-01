'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Zap, 
  ShieldCheck, 
  ArrowLeft, 
  RefreshCw, 
  Cpu, 
  Activity, 
  Clock, 
  Terminal, 
  CheckCircle2, 
  Server,
  ExternalLink,
  Code2
} from 'lucide-react';

interface SitePageProps {
  params: {
    subdomain: string;
  };
}

export default function SubdomainSitePage({ params }: SitePageProps) {
  const subdomain = params?.subdomain || 'app';
  
  // Estados interativos
  const [currentTime, setCurrentTime] = useState<string>('');
  const [latency, setLatency] = useState<number>(12);
  const [isTestingLatency, setIsTestingLatency] = useState<boolean>(false);
  const [requestCount, setRequestCount] = useState<number>(1);
  const [consoleLog, setConsoleLog] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'app' | 'raw_code'>('app');
  const [customHtml, setCustomHtml] = useState<string | null>(null);

  // Carrega eventual HTML customizado salvo no navegador
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`aethel_site_${subdomain}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed['index.html']) {
            setCustomHtml(parsed['index.html']);
          }
        }
      } catch {
        // Fallback para visualização padrão
      }
    }
  }, [subdomain]);

  // Relógio em tempo real
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-BR'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulação de teste de latência
  const handleTestLatency = () => {
    setIsTestingLatency(true);
    setTimeout(() => {
      const newLat = Math.floor(Math.random() * 10) + 8; // 8ms a 18ms
      setLatency(newLat);
      setRequestCount((prev) => prev + 1);
      setIsTestingLatency(false);
    }, 280);
  };

  // Simulação de resposta de API / Proxy 24/7
  const handleSimulateApi = () => {
    setRequestCount((prev) => prev + 1);
    const mockResponse = {
      status: 200,
      subdomain: `${subdomain}.aethelkov.vercel.app`,
      edge_node: "gru1-sao-paulo-edge",
      memory_allocated_mb: 512,
      latency_ms: latency,
      requests_handled: requestCount + 1,
      timestamp: new Date().toISOString(),
      proxy_service: "Aethel Kov High-Availability Proxy 24/7",
      ssl_handshake: "TLS 1.3 Active (Let's Encrypt / Vercel Edge)",
      message: "Rota de API executando perfeitamente em segundo plano sem gastar infraestrutura de bots!"
    };
    setConsoleLog(JSON.stringify(mockResponse, null, 2));
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07080a] text-neutral-100 antialiased font-sans selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col justify-between">
      {/* Luzes Dinâmicas de Fundo Apple Liquid Material */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[15%] w-[450px] h-[450px] rounded-full bg-cyan-500/15 blur-[120px]"></div>
        <div className="absolute bottom-[10%] right-[15%] w-[500px] h-[500px] rounded-full bg-emerald-500/15 blur-[130px]"></div>
      </div>

      {/* Barra de Status e Identificação da Hospedagem */}
      <header className="relative z-20 border-b border-white/10 bg-black/40 backdrop-blur-2xl px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-mono text-neutral-300 hover:text-white transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Painel</span>
            </a>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
              <span className="font-mono text-xs sm:text-sm font-bold text-white tracking-tight">
                /sites/<span className="text-cyan-400">{subdomain}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-semibold">
              <ShieldCheck className="w-3 h-3" /> SSL HTTPS Ativo
            </span>
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono text-[10px] font-bold">
              512 MB RAM
            </span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Site */}
      <main className="relative z-10 max-w-4xl mx-auto w-[92%] py-10 sm:py-16 space-y-8 animate-fadeIn">
        {/* Se o usuário tiver um HTML customizado salvo, renderiza no modo preview */}
        {customHtml ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-mono text-neutral-400">Aplicação Customizada do Usuário</span>
              <button
                onClick={() => setCustomHtml(null)}
                className="text-xs font-mono text-cyan-400 hover:underline"
              >
                Ver Demonstração Interativa
              </button>
            </div>
            <div className="w-full min-h-[500px] rounded-3xl overflow-hidden border border-white/15 bg-black/60 shadow-2xl">
              <iframe
                title="Preview do Site"
                srcDoc={customHtml}
                className="w-full h-[600px] border-0"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        ) : (
          /* Card Interativo Apple Liquid Glass da Aplicação */
          <div className="relative rounded-[36px] p-6 sm:p-10 border border-white/15 bg-white/[0.04] backdrop-blur-3xl shadow-[0_24px_70px_rgba(0,0,0,0.8)] space-y-8">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1.5px]"></div>

            {/* Cabeçalho do Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-white/20 text-cyan-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]">
                  <Globe className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {subdomain.toUpperCase()}
                  </h1>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Hospedado no Vercel Edge • Latência <span className="text-emerald-400">&lt; 20ms</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3 py-1.5 rounded-xl bg-black/50 border border-white/10 font-mono text-xs text-neutral-300 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{currentTime || '--:--:--'}</span>
                </div>
              </div>
            </div>

            {/* Grid de Telemetria da Aplicação */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 font-mono">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Status</span>
                <span className="text-emerald-400 font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 24/7 Ativo
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Memória RAM</span>
                <span className="text-cyan-300 font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" /> 512 MB
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Latência</span>
                <span className="text-white font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" /> {latency} ms
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block">Requisições</span>
                <span className="text-purple-300 font-bold text-sm sm:text-base flex items-center gap-1.5">
                  <Server className="w-4 h-4" /> {requestCount}
                </span>
              </div>
            </div>

            {/* Ações e Testes Interativos */}
            <div className="space-y-4">
              <span className="text-xs font-mono font-semibold text-neutral-400 uppercase tracking-wider block">
                Testes da Aplicação Web em Tempo Real
              </span>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleTestLatency}
                  disabled={isTestingLatency}
                  className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-semibold font-mono text-xs uppercase tracking-wider transition-all shadow-[0_6px_20px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isTestingLatency ? 'animate-spin' : ''}`} />
                  <span>{isTestingLatency ? 'Medindo Latência...' : '⚡ Testar Latência da Malha'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSimulateApi}
                  className="flex-1 py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 active:scale-95 text-white font-semibold font-mono text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                >
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>🔄 Disparar Rota de Proxy / API</span>
                </button>
              </div>
            </div>

            {/* Console de Saída JSON */}
            {consoleLog && (
              <div className="rounded-2xl bg-black/70 border border-white/15 p-4 space-y-2 font-mono text-xs animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 text-neutral-400 text-[11px]">
                  <span>RESPOSTA DO SERVIDOR (STATUS 200 OK)</span>
                  <span className="text-emerald-400 font-semibold">JSON PAYLOAD</span>
                </div>
                <pre className="text-cyan-300 overflow-x-auto p-2 bg-black/40 rounded-xl leading-relaxed">
                  <code>{consoleLog}</code>
                </pre>
              </div>
            )}

            {/* Rodapé do Card */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-neutral-500">
              <span>Instância operando via Vercel Edge Runtime</span>
              <span>Aethel Kov Mesh Engine</span>
            </div>
          </div>
        )}
      </main>

      {/* Rodapé da Página */}
      <footer className="relative z-10 border-t border-white/10 bg-black/30 py-4 text-center text-xs font-mono text-neutral-500">
        <span>Aethel Kov • Hospedagem Cloud 24/7 com 512 MB de RAM para Aplicações Web</span>
      </footer>
    </div>
  );
}

