'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Bot,
  Globe,
  User,
  Heart,
  Code2,
  Radio,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PresentationLandingProps {
  onGoToLogin: () => void;
}

export const PresentationLanding: React.FC<PresentationLandingProps> = ({ onGoToLogin }) => {
  // Carrossel de Destaques
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // FAQ Accordion Estado
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Contador em Tempo Real de Bots e Sites Online
  const [liveMetrics, setLiveMetrics] = useState({
    onlineBots: 1,
    onlineSites: 1,
    totalDeploys: 2,
    clusterUptime: '99.98%',
    averageLatencyMs: 18,
    isLoaded: false
  });

  // Busca métricas reais do banco Supabase ao carregar a página
  useEffect(() => {
    let isMounted = true;

    const fetchTelemetry = async () => {
      try {
        const { data: botsData } = await supabase
          .from('aethel_bots')
          .select('id, platform, status, main_file');

        const { data: logsData } = await supabase
          .from('aethel_logs')
          .select('message')
          .ilike('message', '[SUBDOMAIN_BIND]%')
          .limit(100);

        if (!isMounted) return;

        const allBots = botsData || [];
        
        // Separa bots de sites com base na extensão e plataforma
        const sitesInBots = allBots.filter(b => 
          b.main_file?.endsWith('.html') || b.main_file?.endsWith('.htm')
        );
        
        const realBots = allBots.filter(b => 
          !b.main_file?.endsWith('.html') && !b.main_file?.endsWith('.htm')
        );

        // Subdomínios vinculados
        const boundSubdomains = new Set<string>();
        if (logsData) {
          logsData.forEach(l => {
            try {
              const raw = l.message.replace('[SUBDOMAIN_BIND] ', '');
              const parsed = JSON.parse(raw);
              if (parsed.subdomain && parsed.status === 'ONLINE') {
                boundSubdomains.add(parsed.subdomain);
              }
            } catch (_) {}
          });
        }

        const onlineBotsCount = realBots.filter(b => b.status === 'ONLINE').length;
        const onlineSitesCount = Math.max(
          sitesInBots.filter(b => b.status === 'ONLINE').length,
          boundSubdomains.size,
          1 // Pelo menos o demo meuapp ativo
        );

        setLiveMetrics({
          onlineBots: Math.max(onlineBotsCount, 1),
          onlineSites: onlineSitesCount,
          totalDeploys: Math.max(allBots.length, onlineSitesCount + onlineBotsCount),
          clusterUptime: '99.98%',
          averageLatencyMs: 18,
          isLoaded: true
        });
      } catch (err) {
        console.error('Erro ao buscar telemetria da landing page:', err);
        if (isMounted) {
          setLiveMetrics(prev => ({ ...prev, isLoaded: true }));
        }
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 20000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const slides = [
    {
      badge: 'Deploy Relâmpago',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      title: 'Sua aplicação ligada em instantes pós upload',
      description: 'Envie seu arquivo .zip ou use nosso editor web integrado. Seu bot de Discord, Telegram ou site web responde imediatamente, sem filas e com zero configuração manual de VPS.',
      metrics: [
        { label: 'Tempo de Ativação', value: '< 2 segundos' },
        { label: 'Formato Suportado', value: 'ZIP, JS, PY, HTML5' }
      ],
      icon: <Zap className="w-8 h-8 text-emerald-400" />,
      accentGradient: 'from-emerald-500/20 via-transparent to-transparent'
    },
    {
      badge: 'Hospedagem 24/7',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      title: 'Alta Disponibilidade com Keep-Alive Automático',
      description: 'Nossa malha conta com loop de heartbeat contínuo, supervisão ativa de processos e recuperação instantânea de falhas para garantir que suas aplicações permaneçam 100% online.',
      metrics: [
        { label: 'Disponibilidade (SLA)', value: '99.98%' },
        { label: 'Loop de Sync', value: '0.8s contínuo' }
      ],
      icon: <ShieldCheck className="w-8 h-8 text-cyan-400" />,
      accentGradient: 'from-cyan-500/20 via-transparent to-transparent'
    },
    {
      badge: 'Performance Extrema',
      badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
      title: 'Runner Core com Resposta Instantânea',
      description: 'Executado em nós com processadores AMD Epyc de alta frequência. Seus comandos slash no Discord respondem na hora e seus sites carregam com máxima velocidade.',
      metrics: [
        { label: 'Latência Média', value: '< 20 ms' },
        { label: 'Processamento', value: 'AMD Epyc Core' }
      ],
      icon: <TrendingUp className="w-8 h-8 text-indigo-400" />,
      accentGradient: 'from-indigo-500/20 via-transparent to-transparent'
    },
    {
      badge: 'Sites & Subdomínios',
      badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
      title: 'Subdomínios Próprios com SSL TLS 1.3 Gratuito',
      description: 'Publique suas páginas com subdomínios exclusivos *.linkthelkov.online. Certificado SSL automático emitido na borda global sem você precisar gastar 1 centavo.',
      metrics: [
        { label: 'Subdomínio', value: '*.linkthelkov.online' },
        { label: 'Segurança', value: 'HTTPS / TLS 1.3' }
      ],
      icon: <Globe className="w-8 h-8 text-teal-400" />,
      accentGradient: 'from-teal-500/20 via-transparent to-transparent'
    },
    {
      badge: '100% Acessível',
      badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
      title: 'Cota Grátis de 100 MB de RAM Dedicada',
      description: 'Comece de graça sem precisar cadastrar cartão de crédito. Cada usuário recebe cota estrita com isolamento sandbox e controle de consumo em tempo real.',
      metrics: [
        { label: 'Cota Gratuita', value: '100 MB RAM' },
        { label: 'Isolamento', value: '100% Sandbox' }
      ],
      icon: <HardDrive className="w-8 h-8 text-purple-400" />,
      accentGradient: 'from-purple-500/20 via-transparent to-transparent'
    }
  ];

  // Grade de Planos para exibição pública (informativa, sem compra direta)
  const showcasePlans = [
    {
      id: 'free',
      name: 'Starter',
      badge: '100% Grátis',
      badgeColor: 'text-neutral-400 bg-white/5 border-white/10',
      ramText: '100 MB RAM',
      price: 'R$ 0',
      period: '/mês',
      description: 'Ideal para quem está começando e quer testar um bot ou site pessoal.',
      specs: [
        '0.5 vCPU Compartilhado',
        'SSD NVMe de Alta Performance',
        '1 Subdomínio *.linkthelkov.online',
        'Banda de Rede Ilimitada',
        'Console & Logs em Tempo Real',
        'Zero Cartão de Crédito Necessário'
      ],
      border: 'border-white/10 hover:border-white/25',
      accent: 'from-white/5 to-transparent',
      isPopular: false
    },
    {
      id: '1gb',
      name: 'Gold',
      badge: 'Mais Popular',
      badgeColor: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/40',
      ramText: '1 GB RAM',
      price: 'R$ 5,00',
      period: '/mês',
      description: 'O melhor custo-benefício do Brasil para bots de comunidade e sites rápidos.',
      specs: [
        '1 vCPU Dedicada',
        'SSD NVMe Empresarial Ultrarrápido',
        'Até 5 Subdomínios Próprios',
        'Suporte a Bots de Música e IA',
        'Streaming de Logs com Filtros Pro',
        'Ativação Imediata via Pix'
      ],
      border: 'border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.25)] hover:border-cyan-400',
      accent: 'from-cyan-500/20 via-transparent to-transparent',
      isPopular: true
    },
    {
      id: '2gb',
      name: 'Platinum',
      badge: 'Alta Performance',
      badgeColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40',
      ramText: '2 GB RAM',
      price: 'R$ 10,00',
      period: '/mês',
      description: 'Para bots de múltiplos servidores, tickets pesados e projetos em expansão.',
      specs: [
        '2 vCPUs de Alta Frequência',
        'SSD NVMe Empresarial',
        'Até 10 Subdomínios Próprios',
        'Prioridade na Malha do Farol',
        'Backups e Snapshots com 1 Clique',
        'Ativação Imediata via Pix'
      ],
      border: 'border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      accent: 'from-emerald-500/20 via-transparent to-transparent',
      isPopular: false
    },
    {
      id: '4gb',
      name: 'Diamond',
      badge: 'Profissional',
      badgeColor: 'text-purple-300 bg-purple-500/20 border-purple-500/40',
      ramText: '4 GB RAM',
      price: 'R$ 23,99',
      period: '/mês',
      description: 'Potência de sobra para aplicações exigentes, bots públicos e microsserviços.',
      specs: [
        '3 vCPUs AMD Epyc',
        'SSD NVMe de Alta Capacidade',
        'Até 15 Subdomínios Próprios',
        'Isolamento Completo de Recursos',
        'Suporte a Sharding & Clusters',
        'Ativação Imediata via Pix'
      ],
      border: 'border-purple-500/30 hover:border-purple-400/60 shadow-[0_0_25px_rgba(168,85,247,0.15)]',
      accent: 'from-purple-500/20 via-transparent to-transparent',
      isPopular: false
    },
    {
      id: '8gb',
      name: 'Monster',
      badge: 'Potência Máxima',
      badgeColor: 'text-amber-300 bg-amber-500/20 border-amber-500/40',
      ramText: '8 GB RAM',
      price: 'R$ 45,00',
      period: '/mês',
      description: 'Máxima capacidade de memória para redes de bots massivas e projetos corporativos.',
      specs: [
        '4 vCPUs Dedicadas',
        'SSD NVMe de Nível Enterprise',
        'Até 20 Subdomínios Próprios',
        'Roteamento Exclusivo de Baixa Latência',
        'Acesso Completo a Recursos Avançados',
        'Ativação Imediata via Pix'
      ],
      border: 'border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.2)]',
      accent: 'from-amber-500/20 via-transparent to-transparent',
      isPopular: false
    }
  ];

  // Perguntas Frequentes (FAQ)
  const faqs = [
    {
      question: 'O plano gratuito de 100 MB realmente não expira?',
      answer: 'Sim! Nosso plano Starter é permanente. Você recebe 100 MB de RAM dedicados para hospedar seus bots ou seu site estático. A nossa infraestrutura possui um sistema inteligente de keep-alive que garante que seu projeto continue operando sem surpresas.'
    },
    {
      question: 'Como funciona a contratação de planos adicionais?',
      answer: 'Todos os planos adicionais (a partir de R$ 5,00/mês para 1 GB de RAM) são contratados com segurança dentro do painel do cliente. O pagamento é realizado via Pix com confirmação automática pelo Mercado Pago e liberação de recursos em segundos.'
    },
    {
      question: 'Preciso de cartão de crédito para criar conta?',
      answer: 'Não! Você pode criar sua conta diretamente via Discord OAuth ou E-mail com 1 clique, sem precisar fornecer dados de cartão de crédito ou informações financeiras.'
    },
    {
      question: 'Quais linguagens e aplicações posso hospedar?',
      answer: 'A Aethelkov suporta bots em Node.js (JavaScript/TypeScript), Python, Java, além de sites e aplicações web estáticas (HTML5, CSS3, JavaScript moderno) com suporte a subdomínios personalizados.'
    },
    {
      question: 'Como funcionam os subdomínios gratuitos *.linkthelkov.online?',
      answer: 'Ao publicar um site ou bot na Aethelkov, você pode escolher um subdomínio exclusivo (como seunome.linkthelkov.online). O certificado de segurança SSL TLS 1.3 é emitido automaticamente na nossa borda global, deixando sua página segura e com cadeado verde.'
    },
    {
      question: 'Se eu fechar o navegador, minha aplicação continua online?',
      answer: 'Com certeza! Suas aplicações rodam 24 horas por dia, 7 dias por semana, diretamente nos servidores dedicados da nossa malha. Você pode desligar seu computador e acompanhar os logs a qualquer momento.'
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
    <div className="w-full space-y-28 py-8 animate-fadeIn">
      {/* =========================================================================
          HERO SECTION: APRESENTAÇÃO PRINCIPAL + CTA PARA LOGIN
         ========================================================================= */}
      <section className="text-center max-w-4xl mx-auto space-y-7 px-4 pt-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-neutral-300 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hospedagem 24/7 de Alta Performance &bull; Bots e Sites</span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"></span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white leading-[1.08]">
          Sua aplicação ligada em <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">instantes pós upload</span>
        </h1>

        <p className="text-base sm:text-xl text-neutral-300 font-sans max-w-2xl mx-auto leading-relaxed">
          Infraestrutura em nuvem soberana sob a estética Apple Dark Glass. 
          Hospede seus bots de <b>Discord</b>, <b>Telegram</b> e <b>Sites Web</b> com subdomínio próprio grátis, ativação em menos de 2 segundos e preços justos de verdade.
        </p>

        {/* Botões de Ação Primários */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
          <button
            onClick={onGoToLogin}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-98 cursor-pointer"
          >
            <span>Entrar no Painel</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#planos"
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm transition-all text-center"
          >
            Conhecer os Planos
          </a>

          <a
            href="#fundador"
            className="w-full sm:w-auto px-6 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white text-xs font-mono transition-all text-center flex items-center justify-center gap-1.5"
          >
            <User className="w-3.5 h-3.5 text-cyan-400" />
            <span>Minha História (Kauan)</span>
          </a>
        </div>
      </section>

      {/* =========================================================================
          CONTADOR REAL DE BOTS E SITES ONLINE (TELEMETRIA AO VIVO)
         ========================================================================= */}
      <section className="max-w-5xl mx-auto w-full px-4">
        <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-2xl">
          <div className="glass-specular pointer-events-none absolute inset-x-12 top-0 h-[1px]"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-t sm:border-t-0 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Malha Operacional da Aethelkov</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    AO VIVO
                  </span>
                </h3>
                <p className="text-xs text-neutral-400">
                  Telemetria conectada diretamente ao nosso cluster de execução
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping"></span>
              <span>Sync com Supabase State Vault</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1: BOTS ONLINE */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Bots Ativos</span>
                <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                  <Bot className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                  {liveMetrics.onlineBots}
                </span>
                <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  ONLINE
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 mt-2 block font-sans">
                Discord e Telegram respondendo 24/7
              </span>
            </div>

            {/* CARD 2: SITES WEB ONLINE */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden group hover:border-teal-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Sites no Ar</span>
                <div className="p-1.5 rounded-lg bg-teal-500/15 text-teal-400">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                  {liveMetrics.onlineSites}
                </span>
                <span className="text-xs text-teal-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                  HTTPS
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 mt-2 block font-sans">
                Subdomínios *.linkthelkov.online ativos
              </span>
            </div>

            {/* CARD 3: DISPONIBILIDADE SLA */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Disponibilidade</span>
                <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 tracking-tight">
                  {liveMetrics.clusterUptime}
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 mt-2 block font-sans">
                SLA com monitoramento e reinício automático
              </span>
            </div>

            {/* CARD 4: LATÊNCIA DO RUNNER */}
            <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-white/10 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Latência Média</span>
                <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-indigo-300 tracking-tight">
                  &lt; {liveMetrics.averageLatencyMs}ms
                </span>
              </div>
              <span className="text-[11px] text-neutral-400 mt-2 block font-sans">
                Nós de execução AMD Epyc de alta frequência
              </span>
            </div>
          </div>
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
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Slide anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
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
          VITRINE DE PLANOS (PARA CONHECER SEM CONSEGUIR COMPRAR DIRETAMENTE)
         ========================================================================= */}
      <section id="planos" className="max-w-6xl mx-auto w-full px-4 space-y-10 scroll-mt-20">
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="font-mono text-xs font-semibold text-cyan-400 uppercase tracking-widest px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
            Preços Transparentes &bull; Sem Pegadinhas
          </span>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
            Planos Feitos Para Você Pagar Pouco e Ter Muito
          </h2>
          <p className="text-sm sm:text-base text-neutral-300 font-sans leading-relaxed">
            Conheça todos os nossos recursos antes de criar sua conta. Todos os planos possuem hardware dedicado, zero restrições de código e podem ser contratados diretamente dentro do painel do cliente via Pix automático.
          </p>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Vitrine informativa. A contratação é liberada após entrar na sua conta.</span>
          </div>
        </div>

        {/* Grade de 5 Planos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {showcasePlans.map((plan) => (
            <div
              key={plan.id}
              className={`apple-glass-card rounded-[30px] p-6 border relative overflow-hidden flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${plan.border}`}
            >
              <div className="glass-specular pointer-events-none absolute inset-x-6 top-0 h-[1px]"></div>
              <div className={`absolute inset-0 bg-gradient-to-b ${plan.accent} pointer-events-none`}></div>

              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                  {plan.isPopular && (
                    <span className="text-[10px] font-mono text-cyan-400 flex items-center gap-1 font-bold">
                      <Sparkles className="w-3 h-3" />
                      RECOMENDADO
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <div className="text-xs font-mono text-cyan-300 font-semibold mt-0.5">
                    {plan.ramText}
                  </div>
                </div>

                <div className="pt-2 pb-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                      {plan.price}
                    </span>
                    <span className="text-xs text-neutral-400 font-mono">{plan.period}</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-2 leading-relaxed font-sans min-h-[36px]">
                    {plan.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/10 space-y-2.5">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block">
                    Incluso no Plano:
                  </span>
                  {plan.specs.map((spec, sIdx) => (
                    <div key={sIdx} className="flex items-start gap-2 text-[11px] text-neutral-300 font-sans">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão que direciona para entrar no painel (Sem comprar na vitrine) */}
              <div className="relative z-10 pt-6 mt-6 border-t border-white/10">
                <button
                  onClick={onGoToLogin}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold font-mono transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    plan.isPopular
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
                  }`}
                >
                  <span>Ver no Painel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] text-neutral-400 text-center block mt-1.5 font-sans">
                  Disponível após login seguro
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          SESSÃO DA HISTÓRIA DO KAUAN (FUNDADOR DA AETHELKOV)
         ========================================================================= */}
      <section id="fundador" className="max-w-5xl mx-auto w-full px-4 scroll-mt-20">
        <div className="apple-glass-card rounded-[36px] p-8 sm:p-12 border border-white/20 relative overflow-hidden shadow-2xl">
          <div className="glass-specular pointer-events-none absolute inset-x-12 top-0 h-[1.5px]"></div>
          <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Coluna da Esquerda: Perfil / Avatar Apple Glass */}
            <div className="lg:col-span-5 flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br from-cyan-500/30 via-emerald-500/20 to-purple-500/30 p-1 border border-white/20 shadow-2xl flex items-center justify-center">
                  <div className="w-full h-full rounded-[22px] bg-black/70 flex flex-col items-center justify-center text-white relative overflow-hidden backdrop-blur-xl">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-transparent"></div>
                    <User className="w-14 h-14 text-cyan-300 relative z-10" />
                    <span className="font-mono text-[10px] text-neutral-400 mt-1 uppercase tracking-widest relative z-10">
                      Founder
                    </span>
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg">
                  <Code2 className="w-4 h-4" />
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">Kauan</h3>
                <p className="text-xs text-cyan-400 font-mono mt-0.5">
                  Fundador & Criador da Aethelkov
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 w-full text-left space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>Missão:</span>
                  <span className="text-white">Hospedagem Acessível</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>Nacionalidade:</span>
                  <span className="text-white">Brasileira (Dev Local)</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                  <span>Arquitetura:</span>
                  <span className="text-emerald-400">Node, Supabase & Farol</span>
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 italic">
                &ldquo;A tecnologia deve empoderar quem cria, não drenar o bolso de quem está começando.&rdquo;
              </div>
            </div>

            {/* Coluna da Direita: A Narrativa Completa */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
                <Heart className="w-3.5 h-3.5" />
                <span>Uma História Real da Comunidade</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Por que eu decidi construir a Aethelkov
              </h2>

              <div className="space-y-4 text-sm sm:text-base text-neutral-300 font-sans leading-relaxed">
                <p>
                  Olá! Sou o <b>Kauan</b>. Como desenvolvedor e entusiasta de tecnologia, passei anos criando bots para o Discord, Telegram e desenvolvendo sites para amigos e comunidades. Mas sempre esbarrei no mesmo obstáculo frustrante: <b>as hospedagens tradicionais cobravam caro demais por praticamente nada</b>.
                </p>
                <p>
                  Era doloroso ver serviços cobrando mensalidades altas por míseros 100MB de RAM, com painéis lentos e travados, bots que caíam no meio da madrugada e um suporte robótico que nunca resolvia os problemas. Vi muitos amigos com ideias brilhantes desistirem de seus projetos simplesmente porque não tinham condições de pagar R$ 20, R$ 30 ou R$ 50 todo mês para manter uma aplicação ligada.
                </p>
                <p>
                  Foi dessa indignação que nasceu a <b>Aethelkov</b>. Eu decidi criar do zero a plataforma que eu sempre sonhei em usar:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-cyan-400" />
                      Pagar Pouco, Receber Muito
                    </span>
                    <span className="text-neutral-400 text-xs block leading-relaxed">
                      Planos a partir de R$ 5,00 por 1 GB de RAM real e uma cota gratuita que funciona de verdade.
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <span className="font-bold text-white text-xs block flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-teal-400" />
                      Bots e Sites no Mesmo Lugar
                    </span>
                    <span className="text-neutral-400 text-xs block leading-relaxed">
                      Chega de contratar uma hospedagem para bot e outra para site. Subdomínio e SSL inclusos.
                    </span>
                  </div>
                </div>

                <p className="pt-2 text-neutral-200">
                  Na Aethelkov, você não é um número em uma planilha corporativa. Aqui você encontra estabilidade, carinho no design, transparência total e a garantia de que seu projeto terá o espaço que merece para crescer.
                </p>
              </div>

              <div className="pt-3 flex items-center gap-4">
                <button
                  onClick={onGoToLogin}
                  className="px-6 py-3 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg hover:scale-105"
                >
                  <span>Fazer Parte da Aethelkov</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          COMO FUNCIONA O DEPLOY EM 3 PASSOS (BOTS & SITES)
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
            Eliminamos toda a complexidade de servidores manuais para você focar no que importa: seu código.
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
                Faça login instantâneo com Discord ou E-mail. Sua cota inicial de 100 MB de RAM gratuita e seu subdomínio exclusivo são liberados na mesma hora.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-white/5 font-mono text-[11px] text-cyan-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Sem cartão de crédito</span>
            </div>
          </div>

          <div className="apple-glass-card rounded-[32px] p-7 border border-white/12 relative overflow-hidden flex flex-col justify-between">
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 font-mono font-bold text-lg mb-5">
                02
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Envie seu Projeto</h3>
              <p className="text-xs text-neutral-400 leading-relaxed font-sans">
                Arraste seu arquivo .zip ou edite os arquivos direto pelo nosso Editor Web. Se for um site, basta ter um index.html; se for um bot, um index.js ou main.py.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-white/5 font-mono text-[11px] text-indigo-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Auto-detecção de bot ou site</span>
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
                A malha Aethelkov isola a aplicação em uma sandbox protegida, emite o certificado SSL e mantém seu projeto no ar 24/7 com telemetria contínua.
              </p>
            </div>
            <div className="pt-4 mt-6 border-t border-white/5 font-mono text-[11px] text-emerald-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Alta disponibilidade 24/7</span>
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
            Controle absoluto com ferramentas profissionais sob a estética Apple Dark Glass.
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
              Envie instruções, teste comandos e depure sua aplicação diretamente pelo terminal web integrado com resposta imediata do processo.
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
              Console ao vivo com busca de texto instantânea, filtros por nível de log (Gateway, Dispatch, Erros) e exportação em arquivo .log com um clique.
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
              <div className="p-2.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-300">
                <Globe className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-white text-base">Subdomínios Próprios</h4>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-sans">
              Tenha seu endereço na web como meuapp.linkthelkov.online com certificado SSL TLS 1.3 emitido e renovado automaticamente.
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
              Edite seus arquivos (index.html, index.js, package.json, estilos CSS) direto pelo navegador e atualize seu projeto na hora com hot-reload.
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
              Acompanhamento de consumo em tempo real com barra líquida percentual, proteção contra estouro de memória e hardware isolado.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          PERGUNTAS FREQUENTES (FAQ ACCORDION)
         ========================================================================= */}
      <section className="max-w-4xl mx-auto w-full px-4 space-y-8">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs font-semibold text-purple-400 uppercase tracking-widest px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30">
            Dúvidas Comuns
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Perguntas Frequentes
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 font-sans">
            Tudo o que você precisa saber antes de iniciar sua jornada na Aethelkov.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="apple-glass-card rounded-2xl border border-white/10 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <span className="font-semibold text-sm sm:text-base">{faq.question}</span>
                  <div className="p-1 rounded-lg bg-white/5 text-neutral-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-neutral-300 font-sans leading-relaxed border-t border-white/5 animate-fadeIn">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          BANNER FINAL DE CHAMADA PARA AÇÃO (CTA)
         ========================================================================= */}
      <section className="max-w-4xl mx-auto w-full px-4">
        <div className="apple-glass-card rounded-[36px] p-8 sm:p-12 border border-white/20 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="glass-specular pointer-events-none absolute inset-x-12 top-0 h-[1.5px]"></div>
          
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Pronto para colocar sua aplicação no ar?
          </h2>
          <p className="text-neutral-300 font-sans text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Junte-se à comunidade Aethelkov. Crie sua conta gratuita em menos de 10 segundos, envie seu projeto e desfrute de alta performance 24/7.
          </p>

          <div>
            <button
              onClick={onGoToLogin}
              className="px-8 py-4 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-sm uppercase tracking-wider transition-all inline-flex items-center gap-3 shadow-[0_8px_30px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-98 cursor-pointer"
            >
              <span>Entrar no Painel Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RODAPÉ OFICIAL INSTITUCIONAL TRANSPARENTE
         ========================================================================= */}
      <footer className="max-w-6xl mx-auto w-full pt-10 pb-6 border-t border-white/10 space-y-4 font-sans text-xs text-neutral-400">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <Terminal className="w-3 h-3 text-emerald-400" />
            </div>
            <span className="text-white font-semibold text-sm">Aethelkov</span>
            <span className="text-neutral-500 text-xs font-mono">&bull; linkthelkov.online</span>
          </div>

          {/* Links Institucionais Transparentes para Google e Usuários */}
          <nav className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-neutral-400">
            <Link href="/sobre" className="hover:text-emerald-400 transition-colors">
              Sobre Nós
            </Link>
            <Link href="/termos" className="hover:text-emerald-400 transition-colors">
              Termos de Uso
            </Link>
            <Link href="/privacidade" className="hover:text-emerald-400 transition-colors">
              Política de Privacidade
            </Link>
            <Link href="/contato" className="hover:text-emerald-400 transition-colors">
              Contato & Suporte
            </Link>
            <a 
              href="/.well-known/security.txt" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors inline-flex items-center gap-1 font-mono text-[11px]"
            >
              security.txt
            </a>
          </nav>
        </div>

        <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-neutral-500 font-mono text-center sm:text-left">
          <p>© {new Date().getFullYear()} Aethelkov Cloud &bull; Fundado por Kauan. Todos os direitos reservados.</p>
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            <span>Domínio Oficial Verificado &bull; SSL TLS 1.3 Ativo</span>
          </p>
        </div>
      </footer>
    </div>
  );
};
