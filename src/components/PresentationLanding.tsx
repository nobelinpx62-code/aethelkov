'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  HardDrive, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Terminal,
  Activity,
  FolderGit2,
  Layers,
  Check,
  CheckCircle2,
  Clock,
  Server,
  Lock,
  Cpu,
  Bot
} from 'lucide-react';

interface PresentationLandingProps {
  onGoToLogin: () => void;
}

export const PresentationLanding: React.FC<PresentationLandingProps> = ({ onGoToLogin }) => {
  // Carrossel de Destaques
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      badge: 'Deploy Relâmpago',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      title: 'Aplicação ligada em instantes pós upload',
      description: 'Envie seu arquivo .zip ou aethel.config e veja seu bot responder imediatamente. Zero burocracia, zero configuração de VPS manual e sem filas de espera.',
      metrics: [
        { label: 'Tempo de Inicialização', value: '< 2 segundos' },
        { label: 'Formato Suportado', value: 'ZIP ou Config' }
      ],
      icon: <Zap className="w-8 h-8 text-emerald-400" />,
      accentGradient: 'from-emerald-500/20 via-transparent to-transparent'
    },
    {
      badge: 'Hospedagem 24/7',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      title: 'Alta Disponibilidade & Monitoramento Ativo',
      description: 'Seu bot não dorme. Nossa malha conta com heartbeat constante, recuperação instantânea de falhas e loop de eventos redundante para manter sua presença ininterrupta.',
      metrics: [
        { label: 'Disponibilidade (SLA)', value: '99.98%' },
        { label: 'Loop de Sync', value: '0.8s contínuo' }
      ],
      icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />,
      accentGradient: 'from-cyan-500/20 via-transparent to-transparent'
    },
    {
      badge: 'Performance Máxima',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'A infraestrutura mais rápida do mundo',
      description: 'Arquitetura com Runner Core otimizado e despacho de eventos ultrarrápido. Seus comandos slash no Discord e mensagens no Telegram respondem com latência imperceptível.',
      metrics: [
        { label: 'Latência do Runner', value: '< 20 ms' },
        { label: 'Processamento', value: 'AMD Epyc Core' }
      ],
      icon: <TrendingUp className="w-8 h-8 text-indigo-400" />,
      accentGradient: 'from-indigo-500/20 via-transparent to-transparent'
    },
    {
      badge: '100% Gratuito',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Cota de 100 MB de RAM Dedicada',
      description: 'Cada usuário conta com 100 MB de cota estrita para hospedar suas aplicações com sandbox isolada, proteção contra travamentos e controle em tempo real.',
      metrics: [
        { label: 'Cota Inicial', value: '100 MB RAM' },
        { label: 'Isolamento', value: '100% Sandbox' }
      ],
      icon: <HardDrive className="w-8 h-8 text-purple-400" />,
      accentGradient: 'from-purple-500/20 via-transparent to-transparent'
    },
    {
      badge: 'Curiosidades & Controle',
      badgeColor: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
      title: 'Painel com Estética Apple Liquid Glass',
      description: 'Acesse terminal interativo com console em tempo real, streaming de logs ao vivo com filtros inteligentes, editor de código integrado e controle de variáveis seguras.',
      metrics: [
        { label: 'Interface', value: 'Apple Glass UI' },
        { label: 'Controles', value: '10 Funções Pro' }
      ],
      icon: <Sparkles className="w-8 h-8 text-pink-400" />,
      accentGradient: 'from-pink-500/20 via-transparent to-transparent'
    }
  ];

  // Auto-play suave do carrossel
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  return (
    <div className="w-full space-y-24 py-8 animate-fadeIn">
      {/* =========================================================================
          HERO SECTION: APRESENTAÇÃO PRINCIPAL + CTA PARA LOGIN
         ========================================================================= */}
      <section className="text-center max-w-4xl mx-auto space-y-7 px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-neutral-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>A Nova Geração em Hospedagem de Bots</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
          Sua aplicação ligada em <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">instantes pós upload</span>
        </h1>

        <p className="text-base sm:text-xl text-neutral-300 font-sans max-w-2xl mx-auto leading-relaxed">
          Infraestrutura 24/7 ultrarrápida projetada sob a estética Apple Liquid Glass. 
          Sem complicação de servidores manuais, com cota gratuita de 100 MB de RAM e ativação em menos de 2 segundos.
        </p>

        {/* Botão de Ação Primário (Leva para a Página de Login) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
          <button
            onClick={onGoToLogin}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-98"
          >
            <span>Entrar no Painel</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#recursos"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm transition-all"
          >
            Conhecer os Recursos
          </a>
        </div>
      </section>

      {/* =========================================================================
          SHOWCASE CARROSSEL DINÂMICO DE DESTAQUES (LARGURA AMPLA)
         ========================================================================= */}
      <section className="max-w-5xl mx-auto w-full px-4">
        <div 
          className="apple-glass-card rounded-[36px] p-7 sm:p-10 border border-white/15 relative overflow-hidden flex flex-col justify-between min-h-[460px] shadow-[0_30px_70px_rgba(0,0,0,0.7)]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="glass-specular pointer-events-none absolute inset-x-12 top-0 h-[1.5px]"></div>
          <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].accentGradient} opacity-60 pointer-events-none transition-all duration-700`}></div>

          {/* Cabeçalho do Carrossel */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                {slides[currentSlide].icon}
              </div>
              <span className={`inline-block px-3.5 py-1 rounded-full font-mono text-xs font-semibold uppercase tracking-wider border ${slides[currentSlide].badgeColor}`}>
                {slides[currentSlide].badge}
              </span>
            </div>

            <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-full border border-white/10 backdrop-blur-md">
              <button
                onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Slide anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Próximo slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Conteúdo Central */}
          <div className="relative z-10 my-8 space-y-4 max-w-3xl">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              {slides[currentSlide].title}
            </h2>
            <p className="text-sm sm:text-lg text-neutral-300 font-sans leading-relaxed">
              {slides[currentSlide].description}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 pt-4 max-w-xl">
              {slides[currentSlide].metrics.map((metric, idx) => (
                <div key={idx} className="apple-glass rounded-2xl p-4 border border-white/10">
                  <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider block mb-1">
                    {metric.label}
                  </span>
                  <span className="font-mono text-lg sm:text-xl font-bold text-white">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé com Indicadores */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index 
                      ? 'w-10 bg-emerald-400 shadow-[0_0_8px_#34d399]' 
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Destaque ${index + 1}`}
                />
              ))}
            </div>

            <span className="font-mono text-xs text-neutral-400">
              {currentSlide + 1} de {slides.length}
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          COMO FUNCIONA O DEPLOY EM 3 PASSOS
         ========================================================================= */}
      <section className="max-w-6xl mx-auto w-full px-4 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
            Simplicidade Extrema
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Como Funciona o Deploy
          </h2>
          <p className="text-sm text-neutral-400 font-sans">
            Projetado para eliminar todas as dores de cabeça com infraestrutura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="apple-glass-card rounded-[32px] p-7 border border-white/12 relative overflow-hidden flex flex-col justify-between">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-lg mb-5">
                01
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Conecte sua Conta</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Acesse com o Discord ou E-mail. Sua cota inicial de 100 MB de RAM gratuita é ativada instantaneamente.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-white/5 font-mono text-[11px] text-cyan-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Sem necessidade de cartão</span>
            </div>
          </div>

          <div className="apple-glass-card rounded-[32px] p-7 border border-white/12 relative overflow-hidden flex flex-col justify-between">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-lg mb-5">
                02
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Envie seu Arquivo</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Faça o upload do seu arquivo .zip ou aethel.config. Suporta Discord.js, Telegram e automações em Node.js.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-white/5 font-mono text-[11px] text-indigo-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Compatibilidade retroativa</span>
            </div>
          </div>

          <div className="apple-glass-card rounded-[32px] p-7 border border-white/12 relative overflow-hidden flex flex-col justify-between">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-bold text-lg mb-5">
                03
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Ligado em Segundos</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                A malha Aethel Kov conecta o bot e mantém ele rodando 24/7 com monitoramento contínuo de status.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-white/5 font-mono text-[11px] text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Alta disponibilidade garantida</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RECURSOS COMPLETOS DA PLATAFORMA (ID RECURSOS)
         ========================================================================= */}
      <section id="recursos" className="max-w-6xl mx-auto w-full px-4 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">
            Painel Operacional Completo
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Tudo o que sua aplicação precisa
          </h2>
          <p className="text-sm text-neutral-400 font-sans">
            Controle absoluto com 10 ferramentas de gestão em tempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="apple-glass-card rounded-[28px] p-6 border border-white/12 relative overflow-hidden">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                <Terminal className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Console Interativo</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Envie instruções, teste comandos e depure seu bot diretamente pelo terminal web integrado com resposta imediata.
            </p>
          </div>

          <div className="apple-glass-card rounded-[28px] p-6 border border-white/12 relative overflow-hidden">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Streaming de Logs</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Console ao vivo com busca de texto, filtros por nível de log (Gateway, Dispatch, Erros) e exportação em arquivo .log com um clique.
            </p>
          </div>

          <div className="apple-glass-card rounded-[28px] p-6 border border-white/12 relative overflow-hidden">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Latência &lt; 20ms</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Runner Core desacoplado executando em servidores de alta frequência AMD Epyc para garantir tempo de resposta quase instantâneo.
            </p>
          </div>

          <div className="apple-glass-card rounded-[28px] p-6 border border-white/12 relative overflow-hidden">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Editor de Código Online</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Edite seus arquivos (index.js, aethel.config, package.json) direto pelo navegador e atualize seu bot na hora com hot-reload.
            </p>
          </div>

          <div className="apple-glass-card rounded-[28px] p-6 border border-white/12 relative overflow-hidden">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-300">
                <HardDrive className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Telemetria Real de RAM</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Acompanhamento de consumo em tempo real com barra líquida percentual, proteção contra estouro de memória e 100 MB dedicados.
            </p>
          </div>

          <div className="apple-glass-card rounded-[28px] p-6 border border-white/12 relative overflow-hidden">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-2xl bg-pink-500/15 border border-pink-500/30 text-pink-300">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Backups & Snapshots</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Baixe a qualquer momento o snapshot do código-fonte do seu bot e seu aethel.config para manter a segurança total do seu projeto.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BANNER FINAL DE CHAMADA PARA AÇÃO (CTA)
         ========================================================================= */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="apple-glass-card rounded-[36px] p-8 sm:p-12 border border-white/20 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="glass-specular pointer-events-none absolute inset-x-12 top-0 h-[1.5px]"></div>
          
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Pronto para hospedar seu bot em instantes?
          </h2>
          <p className="text-neutral-300 font-sans text-sm sm:text-base max-w-xl mx-auto">
            Junte-se à nova era de hospedagem contínua. Acesse o painel e ligue sua aplicação agora mesmo.
          </p>

          <div>
            <button
              onClick={onGoToLogin}
              className="px-8 py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-sm uppercase tracking-wider transition-all inline-flex items-center gap-3 shadow-[0_8px_30px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-98"
            >
              <span>Acessar Página de Login</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Rodapé Oficial */}
      <footer className="max-w-6xl mx-auto w-full pt-10 border-t border-white/10 text-center space-y-2 font-mono text-xs text-neutral-400">
        <p className="text-neutral-300 font-semibold">
          Aethel Kov &bull; Plataforma de Hospedagem Contínua de Alta Performance
        </p>
        <p className="text-[11px] text-neutral-500">
          Alta Disponibilidade 24/7 &bull; Runner Core Desacoplado &bull; Cota Gratuita de 100 MB
        </p>
      </footer>
    </div>
  );
};
