'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  Zap,
  ShieldCheck,
  TrendingUp,
  HardDrive,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LoginViewProps {
  onBackToPresentation: () => void;
  onLoginSuccess: () => void;
}

const DiscordIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

export const LoginView: React.FC<LoginViewProps> = ({ 
  onBackToPresentation, 
  onLoginSuccess 
}) => {
  // Estado do Carrossel do Lado Esquerdo
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Estado do Discord OAuth2
  const [discordLoading, setDiscordLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Slides do Carrossel
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

  // Auto-play suave a cada 5 segundos
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  // URL de Redirecionamento Dinâmica (Produção Vercel ou Localhost)
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname.includes('vercel.app') || window.location.hostname === 'aethelkov.vercel.app') {
        return 'https://aethelkov.vercel.app/';
      }
      return `${window.location.origin}/`;
    }
    return 'https://aethelkov.vercel.app/';
  };

  // Login com Discord OAuth2
  const handleDiscordLogin = async () => {
    setDiscordLoading(true);
    setErrorMessage(null);

    try {
      const redirectTarget = getRedirectUrl();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
          redirectTo: redirectTarget,
          scopes: 'identify email guilds',
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar com o Discord.');
      setDiscordLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6 py-6 px-2 sm:px-4 animate-fadeIn">
      {/* Botão Superior para Voltar para a Apresentação */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={onBackToPresentation}
          className="inline-flex items-center gap-2 text-xs font-mono text-neutral-400 hover:text-white px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Apresentação da Plataforma</span>
        </button>
      </div>

      {/* Grade Principal Dividida: Carrossel à Esquerda & Quadrado de Login à Direita */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto w-full">
        
        {/* ========================================================
            LADO ESQUERDO: CARROSSEL DE CURIOSIDADES E DESTAQUES
           ======================================================== */}
        <div 
          className="lg:col-span-7 apple-glass-card rounded-[36px] p-6 sm:p-9 border border-white/15 relative overflow-hidden flex flex-col justify-between min-h-[500px] sm:min-h-[560px] shadow-[0_30px_70px_rgba(0,0,0,0.7)]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className="glass-specular pointer-events-none absolute inset-x-12 top-0 h-[1.5px]"></div>
          
          <div className={`absolute inset-0 bg-gradient-to-br ${slides[currentSlide].accentGradient} opacity-60 pointer-events-none transition-all duration-700`}></div>

          {/* Cabeçalho do Carrossel */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                {slides[currentSlide].icon}
              </div>
              <span className={`inline-block px-3 py-0.5 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wider border ${slides[currentSlide].badgeColor}`}>
                {slides[currentSlide].badge}
              </span>
            </div>

            {/* Controles de Navegação */}
            <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-full border border-white/10 backdrop-blur-md">
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
          <div className="relative z-10 my-8 space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
              {slides[currentSlide].title}
            </h2>
            <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed max-w-xl">
              {slides[currentSlide].description}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-3">
              {slides[currentSlide].metrics.map((metric, idx) => (
                <div key={idx} className="apple-glass rounded-2xl p-3 sm:p-4 border border-white/10">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase tracking-wider block mb-1">
                    {metric.label}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-bold text-white">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé do Carrossel com Indicadores */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentSlide === index 
                      ? 'w-8 bg-emerald-400 shadow-[0_0_8px_#34d399]' 
                      : 'w-2 bg-white/20 hover:bg-white/40'
                  }`}
                  title={`Slide ${index + 1}`}
                />
              ))}
            </div>

            <span className="font-mono text-[11px] text-neutral-400">
              {currentSlide + 1} de {slides.length}
            </span>
          </div>
        </div>

        {/* ========================================================
            LADO DIREITO: CARD DE LOGIN EXCLUSIVO VIA DISCORD
           ======================================================== */}
        <div className="lg:col-span-5 apple-glass-card rounded-[36px] p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-[0_30px_70px_rgba(0,0,0,0.7)] flex flex-col justify-between">
          <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1.5px]"></div>

          <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
                  Discord Gateway Auth
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#5865F2]/20 border border-[#5865F2]/40 text-[#8899fc] font-mono text-[10px] font-semibold">
                  1-Click OAuth2
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
                Acesse o Painel
              </h3>
              <p className="text-xs text-neutral-400 mt-2 font-sans leading-relaxed">
                Conecte-se com sua conta Discord oficial para gerenciar bots 24/7, registrar subdomínios e hospedar sites com 512 MB de RAM.
              </p>
            </div>

            {/* BOTÃO PRINCIPAL: LOGIN COM DISCORD (EXCLUSIVO) */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleDiscordLogin}
                disabled={discordLoading}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-[#5865F2] hover:bg-[#4752C4] active:scale-[0.98] text-white font-semibold text-sm sm:text-base transition-all shadow-[0_10px_28px_rgba(88,101,242,0.45)] hover:shadow-[0_12px_32px_rgba(88,101,242,0.6)] disabled:opacity-50"
              >
                <DiscordIcon />
                <span>
                  {discordLoading ? 'Conectando ao Discord...' : 'Continuar com Discord'}
                </span>
              </button>

              <p className="font-mono text-[11px] text-neutral-400 text-center">
                Autenticação direta com o Discord. Rápido, seguro e sem senhas.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Benefícios do Login com Discord */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              <span className="text-[10px] font-mono font-semibold text-neutral-400 uppercase tracking-wider block mb-2">
                O que você ganha ao entrar:
              </span>

              <div className="flex items-center gap-2.5 text-xs text-neutral-300 font-sans">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Cota de <strong>100 MB</strong> para Bots Discord & Telegram 24/7</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-neutral-300 font-sans">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Cota de <strong>512 MB</strong> para Sites & Proxies Web</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-neutral-300 font-sans">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Subdomínio gratuito próprio (ex: <code>seunome.aethel.app</code>)</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-neutral-300 font-sans">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Sincronização do Avatar, Tag e Snowflake ID</span>
              </div>
            </div>

            {/* Rodapé de Segurança */}
            <div className="pt-2 text-[10px] font-mono text-neutral-500 text-center">
              Protocolo TLS 1.3 criptografado de ponta a ponta.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
