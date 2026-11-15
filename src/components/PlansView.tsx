'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  CreditCard, 
  QrCode, 
  Flame, 
  HelpCircle,
  ChevronDown,
  Layers,
  Bot
} from 'lucide-react';

interface PlansViewProps {
  currentUser?: any;
  onOpenDeploy?: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ currentUser, onOpenDeploy }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Estrutura de Planos Clara, Justa e Imbatível
  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      ram: '100 MB',
      bots: '1 Bot 24/7',
      priceMonthly: 'R$ 0',
      priceYearly: 'R$ 0',
      period: 'grátis',
      badge: 'Iniciante',
      badgeStyle: 'bg-white/10 text-neutral-300 border-white/10',
      description: 'Coloque seu bot online 24/7 com todos os recursos liberados.',
      borderStyle: 'border-white/10 hover:border-white/20',
      glow: 'from-white/5 to-transparent',
      buttonText: 'Plano Grátis Ativo',
      buttonStyle: 'bg-white/10 text-neutral-300 border border-white/10 hover:bg-white/15',
      features: [
        '100 MB de RAM Dedicada',
        '1 Bot online 24/7 ininterrupto',
        'Música Lavalink v4 liberada',
        'Bots de Vendas Pix com QR Code',
        'Bots de IA (OpenAI, Gemini)',
        'Suporte a Python, Node.js e Java',
        'Console de Logs ao Vivo',
      ]
    },
    {
      id: '1gb',
      name: 'Pro Turbo',
      ram: '1 GB',
      ramMb: '1024 MB',
      bots: 'Múltiplos Bots',
      priceMonthly: 'R$ 5,00',
      priceYearly: 'R$ 4,16',
      period: '/mês',
      popular: true,
      badge: '💥 Supera a Discloud (1 GB)',
      badgeStyle: 'bg-gradient-to-r from-cyan-500/30 to-emerald-500/30 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
      description: '1 GB inteiro de RAM pelo menor preço do mercado. O mais vendido!',
      borderStyle: 'border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.25)] hover:border-cyan-400',
      glow: 'from-cyan-500/15 via-emerald-500/10 to-transparent',
      buttonText: 'Assinar por R$ 5,00',
      buttonStyle: 'apple-pill-primary text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]',
      features: [
        '1 GB (1024 MB) de RAM de Alta Velocidade',
        'Hospede múltiplos bots ou bots pesados',
        'Música Lavalink v4 sem nenhum engasgo',
        'Bots de Vendas Pix com entrega automática',
        'Bots de Inteligência Artificial sem limites',
        'Prioridade alta de CPU e Rede',
        'Backups automáticos no banco',
        'Suporte prioritário',
      ]
    },
    {
      id: '2gb',
      name: 'Ultra Power',
      ram: '2 GB',
      ramMb: '2048 MB',
      bots: 'Grandes Bots',
      priceMonthly: 'R$ 10,00',
      priceYearly: 'R$ 8,30',
      period: '/mês',
      badge: '⚡ 2 GB de Potência',
      badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      description: 'Ideal para bots em dezenas de servidores ou bancos de dados locais.',
      borderStyle: 'border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      glow: 'from-emerald-500/15 to-transparent',
      buttonText: 'Assinar por R$ 10,00',
      buttonStyle: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg',
      features: [
        '2 GB (2048 MB) de RAM Dedicada',
        'Capacidade para grandes comunidades',
        'Música em múltiplos canais de voz',
        'Vendas e checkout com alta concorrência',
        'Rápida velocidade de resposta (<10ms)',
        'Console e logs sem restrições',
      ]
    },
    {
      id: '4gb',
      name: 'Mega Server',
      ram: '4 GB',
      ramMb: '4096 MB',
      bots: 'Redes & Projetos',
      priceMonthly: 'R$ 23,99',
      priceYearly: 'R$ 19,99',
      period: '/mês',
      badge: '🚀 4 GB de Performance',
      badgeStyle: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      description: 'Para bots gigantes, sistemas de RPG, economia massiva e comunidades.',
      borderStyle: 'border-purple-500/30 hover:border-purple-400/60 shadow-[0_0_25px_rgba(168,85,247,0.15)]',
      glow: 'from-purple-500/15 to-transparent',
      buttonText: 'Assinar por R$ 23,99',
      buttonStyle: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-lg',
      features: [
        '4 GB (4096 MB) de RAM Ultrarrápida',
        'Poder de sobra para qualquer projeto',
        'Tráfego massivo e dezenas de comandos/segundo',
        'Roteamento prioritário em cluster dedicado',
        'Proteção Anti-DDoS Camada 7',
        'Atendimento VIP direto no Discord',
      ]
    },
    {
      id: '8gb',
      name: 'Monster Elite',
      ram: '8 GB',
      ramMb: '8192 MB',
      bots: 'Potência Máxima',
      priceMonthly: 'R$ 45,00',
      priceYearly: 'R$ 37,50',
      period: '/mês',
      badge: '👑 8 GB Monstruoso',
      badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      description: 'O topo da tecnologia. Memória massiva para quem não aceita limites.',
      borderStyle: 'border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.2)]',
      glow: 'from-amber-500/15 to-transparent',
      buttonText: 'Assinar por R$ 45,00',
      buttonStyle: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg',
      features: [
        '8 GB (8192 MB) de RAM Dedicada Monstruosa',
        'Recursos ilimitados sem qualquer gargalo',
        'IP Dedicado e porta personalizada opcional',
        'Prioridade absoluta nos clusters de áudio e rede',
        'Suporte técnico 1-on-1 com engenheiro',
        'SLA de 99.99% de disponibilidade',
      ]
    }
  ];

  const faqs = [
    {
      q: 'O plano Grátis tem alguma limitação de recursos?',
      a: 'Nenhuma limitação de recursos! Você pode rodar bot de música, vendas com Pix, inteligência artificial, Python ou Node.js normalmente. A única diferença dos planos pagos é a quantidade de memória RAM para você rodar bots mais pesados ou vários bots ao mesmo tempo.'
    },
    {
      q: 'Como funciona a ativação após o pagamento no Pix?',
      a: 'É automática em menos de 10 segundos! Assim que o Pix é identificado, a memória contratada é liberada no seu painel para você usar imediatamente.'
    },
    {
      q: 'Posso fazer upgrade de 1 GB para 2 GB ou mais depois?',
      a: 'Sim! Você pode subir ou descer de plano a qualquer momento pagando apenas a diferença proporcional.'
    },
    {
      q: 'Tem contrato ou fidelidade?',
      a: 'Zero fidelidade. Você paga mês a mês e pode cancelar com um clique a qualquer momento sem nenhuma taxa.'
    }
  ];

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Header com Proposta Clara e Direta */}
      <section className="relative text-center max-w-3xl mx-auto pt-4 px-4">
        {/* Glow de Fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-64 bg-cyan-500/15 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 text-xs font-mono text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Sem Pegadinhas • 100% dos Recursos Liberados em Todos os Planos</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-white leading-tight">
          Hospedagem de Bots com <br />
          <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-400 bg-clip-text text-transparent">
            Mais Memória pelo Menor Preço
          </span>
        </h1>

        <p className="text-neutral-400 text-sm sm:text-base mt-4 leading-relaxed">
          Aqui você tem <strong>tudo liberado</strong> (Música Lavalink, Vendas Pix, IA, Python & Node.js). 
          Escolha apenas quanta <strong>memória RAM</strong> o seu bot precisa!
        </p>

        {/* Seletor Mensal / Anual */}
        <div className="mt-8 inline-flex items-center gap-2 p-1.5 rounded-full apple-glass border border-white/15 backdrop-blur-xl shadow-lg">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-full text-xs font-semibold font-mono transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white/20 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Faturamento Mensal
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-5 py-2 rounded-full text-xs font-semibold font-mono transition-all flex items-center gap-1.5 ${
              billingCycle === 'yearly'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-md'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Plano Anual</span>
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-emerald-300 font-bold border border-emerald-400/30">
              Economize 20%
            </span>
          </button>
        </div>
      </section>

      {/* Grid com Todos os Planos: Free, 1GB, 2GB, 4GB, 8GB */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`apple-glass-card rounded-[32px] p-7 border relative flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${plan.borderStyle} ${
                plan.popular ? 'lg:col-span-1 ring-1 ring-cyan-400/40' : ''
              }`}
            >
              {/* Efeito de Reflexo Superior */}
              <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

              {/* Tag Destaque para o plano de 1 GB */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(6,182,212,0.5)] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Custo-Benefício Imbatível</span>
                </div>
              )}

              <div>
                {/* Header do Cartão */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-semibold border ${plan.badgeStyle}`}>
                    {plan.badge}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-300">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span>{plan.ram} RAM</span>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white tracking-tight">{plan.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 min-h-[34px] leading-relaxed">{plan.description}</p>

                {/* Preço em Destaque */}
                <div className="my-5 pb-5 border-b border-white/10 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white tracking-tight">{price}</span>
                  <span className="text-xs font-mono text-neutral-400">{plan.period}</span>
                </div>

                {/* Memória e Capacidade */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Memória</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">{plan.ram}</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Capacidade</span>
                    <span className="text-sm font-bold text-emerald-300 font-mono">{plan.bots}</span>
                  </div>
                </div>

                {/* Lista Simples de Recursos */}
                <div className="space-y-2.5 font-mono text-xs">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-neutral-300">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de Escolha */}
              <div className="mt-8 pt-2">
                <button
                  onClick={() => setSelectedPlanForModal(plan)}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${plan.buttonStyle}`}
                >
                  <span>{plan.buttonText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Banner de Garantia Pix */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="apple-glass-card rounded-[28px] p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-white/15 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Sem Burocracia: Liberação Imediata via Pix</h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Pagamentos confirmados em menos de 10 segundos com a RAM ativada no mesmo instante no seu painel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-xs font-mono text-emerald-300 font-bold">
              <QrCode className="w-4 h-4" />
              <span>Pix Instantâneo</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Cartão de Crédito</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Simples */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white">Dúvidas Frequentes</h3>
        </div>

        <div className="space-y-3 font-mono">
          {faqs.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="apple-glass rounded-2xl border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold text-white hover:text-cyan-300"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-cyan-400' : 'text-neutral-400'}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-neutral-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Modal de Prévia de Pagamento */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="apple-glass-card w-full max-w-md rounded-[32px] p-6 border border-white/20 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Contratar Plano</h4>
                  <span className="text-xs font-mono text-cyan-300">{selectedPlanForModal.name} ({selectedPlanForModal.ram} RAM)</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanForModal(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                &times;
              </button>
            </div>

            <div className="py-5 space-y-4 font-mono text-xs">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-neutral-400 block text-[11px]">Valor:</span>
                  <span className="text-2xl font-bold text-white">
                    {billingCycle === 'yearly' ? selectedPlanForModal.priceYearly : selectedPlanForModal.priceMonthly}
                  </span>
                  <span className="text-[10px] text-neutral-400"> {selectedPlanForModal.period}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-cyan-300 block">{selectedPlanForModal.ram} RAM</span>
                  <span className="text-[10px] text-emerald-400">⚡ Ativação Instantânea</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-neutral-300 font-semibold block">Forma de Pagamento:</span>
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-300 flex flex-col items-center justify-center gap-1.5 hover:bg-emerald-500/20 transition-colors">
                    <QrCode className="w-5 h-5" />
                    <span className="font-bold text-[11px]">Pix (Aprovação em 5s)</span>
                  </button>
                  <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-neutral-300 flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 transition-colors">
                    <CreditCard className="w-5 h-5" />
                    <span className="font-bold text-[11px]">Cartão de Crédito</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-neutral-400 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Sem Contratos ou Bloqueios de Recursos</span>
                </div>
                <p>Todos os recursos (Música Lavalink, Vendas Pix, IA, Python e Node) funcionam em 100% dos planos.</p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setSelectedPlanForModal(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-300 text-xs font-mono hover:bg-white/10"
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  alert(`Plano "${selectedPlanForModal.name}" (${selectedPlanForModal.ram} RAM) selecionado! Na próxima etapa conectaremos o gateway do Mercado Pago / Pix ao vivo.`);
                  setSelectedPlanForModal(null);
                }}
                className="flex-1 apple-pill-primary py-3 rounded-xl text-white text-xs font-bold font-mono shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>Pagar com Pix</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
