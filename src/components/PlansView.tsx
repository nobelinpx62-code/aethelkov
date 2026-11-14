'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  HardDrive, 
  Music, 
  Bot, 
  ArrowRight, 
  CreditCard, 
  QrCode, 
  Star, 
  Flame, 
  Award, 
  Headphones,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Clock,
  Layers,
  Shield
} from 'lucide-react';

interface PlansViewProps {
  currentUser?: any;
  onOpenDeploy?: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ currentUser, onOpenDeploy }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const plans = [
    {
      id: 'free',
      name: 'Start Free',
      badge: 'Grátis para Sempre',
      badgeColor: 'from-neutral-500/20 to-neutral-700/20 text-neutral-300 border-white/10',
      description: 'Ideal para colocar seu primeiro bot online 24/7 sem gastar nada.',
      priceMonthly: 'R$ 0',
      priceYearly: 'R$ 0',
      period: 'para sempre',
      ram: '100 MB',
      bots: '1 Bot Ativo',
      color: 'neutral',
      borderStyle: 'border-white/10 hover:border-white/20',
      glow: 'from-white/5 to-transparent',
      buttonText: 'Plano Atual Ativo',
      buttonStyle: 'bg-white/10 text-neutral-300 border border-white/10 hover:bg-white/15',
      features: [
        '100 MB de RAM dedicada',
        '1 Bot online 24 horas por dia',
        'Suporte completo a Python & Node.js',
        'Cluster Lavalink Standard para músicas',
        'Auto-Mod & Boas-Vindas integradas',
        'Terminal de Logs ao vivo',
        'Auto-Reinicialização se o bot cair',
      ],
      notIncluded: [
        'Cluster VIP ultrarrápido de baixa latência',
        'Múltiplos bots no mesmo plano',
        'Prioridade máxima na fila de execução',
      ]
    },
    {
      id: 'pro',
      name: 'Pro Turbo',
      badge: '🔥 Mais Escolhido',
      badgeColor: 'from-cyan-500/30 via-emerald-500/20 to-cyan-500/30 text-cyan-300 border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]',
      description: 'A melhor escolha para bots de música sem lag, vendas Pix e IA.',
      priceMonthly: 'R$ 9,90',
      priceYearly: 'R$ 7,90',
      period: '/mês',
      ram: '250 MB',
      bots: 'Até 5 Bots',
      popular: true,
      color: 'cyan',
      borderStyle: 'border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.25)] hover:border-cyan-400',
      glow: 'from-cyan-500/15 via-emerald-500/10 to-transparent',
      buttonText: 'Assinar Plano Pro',
      buttonStyle: 'apple-pill-primary text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]',
      features: [
        '250 MB de RAM dedicada de alta velocidade',
        'Até 5 Bots rodando simultaneamente',
        'Cluster Lavalink VIP (Latência <50ms, zero lag)',
        'Suporte a Bots de Vendas Pix com QR Code',
        'Suporte a Bots de IA (OpenAI, Gemini, Claude)',
        'CPU Prioritária (Respostas instantâneas)',
        'Backups automáticos do banco de dados',
        'Console de Logs em Tempo Real sem limite',
        'Suporte Prioritário no Discord',
      ],
      notIncluded: []
    },
    {
      id: 'enterprise',
      name: 'Elite Master',
      badge: '⚡ Máxima Potência',
      badgeColor: 'from-purple-500/30 to-pink-500/20 text-purple-300 border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.3)]',
      description: 'Para grandes servidores, redes de comunidades e bots corporativos.',
      priceMonthly: 'R$ 24,90',
      priceYearly: 'R$ 19,90',
      period: '/mês',
      ram: '500 MB',
      bots: 'Até 15 Bots',
      color: 'purple',
      borderStyle: 'border-purple-500/30 hover:border-purple-400/60 shadow-[0_0_30px_rgba(168,85,247,0.15)]',
      glow: 'from-purple-500/15 to-transparent',
      buttonText: 'Contratar Elite Master',
      buttonStyle: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.35)]',
      features: [
        '500 MB de RAM ultra-rápida dedicada',
        'Até 15 Bots rodando 24/7 sem limites',
        'Roteamento Lavalink Dedicado Multi-Call',
        'Acesso VIP a todas as APIs externas',
        'Subdomínio ou IP dedicado opcional',
        'Logs e métricas avançadas exportáveis',
        'Proteção Anti-DDoS de Camada 7',
        'Suporte VIP 1-on-1 com engenheiro no Discord',
      ],
      notIncluded: []
    }
  ];

  const faqs = [
    {
      q: 'Como funciona o pagamento? É ativado na hora?',
      a: 'Sim! Pagamentos via Pix são aprovados em menos de 10 segundos pelo nosso gateway integrado. Assim que aprovado, a memória RAM extra e os recursos são liberados instantaneamente na sua conta.'
    },
    {
      q: 'Posso mudar de plano ou cancelar a qualquer momento?',
      a: 'Com certeza! Você pode fazer upgrade a qualquer momento pagando apenas a diferença. Não temos contratos de fidelidade — você tem controle total para cancelar quando quiser com 1 clique.'
    },
    {
      q: 'Que tipo de bots eu posso hospedar nesses planos?',
      a: 'Literalmente qualquer bot! Bots de Música, Vendas com QR Code do Pix, Inteligência Artificial (OpenAI, Gemini), RPG, Economia, Moderação e Tickets. Suportamos projetos em Python, JavaScript, TypeScript e Java.'
    },
    {
      q: 'O que acontece se o meu bot passar da memória RAM?',
      a: 'Nosso painel avisa com medidores em tempo real antes do limite ser atingido. Além disso, nossos clusters otimizados removem dependências pesadas automaticamente para manter o consumo muito baixo.'
    }
  ];

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      {/* Header com Brilho e Título Hero */}
      <section className="relative text-center max-w-3xl mx-auto pt-4 px-4">
        {/* Glow de Fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-64 bg-cyan-500/15 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-80 h-56 bg-purple-500/10 blur-[90px] rounded-full pointer-events-none -z-10"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 text-xs font-mono text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Infraestrutura de Alto Desempenho • Zero Quedas</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-white leading-tight">
          Planos Transparentes para <br />
          <span className="bg-gradient-to-r from-cyan-400 via-emerald-300 to-indigo-400 bg-clip-text text-transparent">
            Bots de Alta Performance
          </span>
        </h1>

        <p className="text-neutral-400 text-sm sm:text-base mt-4 leading-relaxed">
          Mantenha seus bots de música, vendas, moderação e IA online 24/7 com clusters de baixíssima latência e suporte nativo a Python & Node.js.
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
            <span>Anual</span>
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] text-emerald-300 font-bold border border-emerald-400/30">
              -20% OFF
            </span>
          </button>
        </div>
      </section>

      {/* Grid de Cartões de Planos */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {plans.map((plan) => {
          const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`apple-glass-card rounded-[32px] p-7 border relative flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${plan.borderStyle}`}
            >
              {/* Efeito de Reflexo de Luz Superior */}
              <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

              {/* Destaque "Popular" no topo */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(6,182,212,0.5)] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Mais Popular</span>
                </div>
              )}

              <div>
                {/* Badge do Plano */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-3 py-1 rounded-full text-[11px] font-mono font-semibold border ${plan.badgeColor}`}>
                    {plan.badge}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{plan.ram}</span>
                  </div>
                </div>

                {/* Nome e Descrição */}
                <h3 className="text-2xl font-bold text-white tracking-tight">{plan.name}</h3>
                <p className="text-xs text-neutral-400 mt-1 min-h-[36px]">{plan.description}</p>

                {/* Preço */}
                <div className="my-6 pb-6 border-b border-white/10 flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-white tracking-tight">{price}</span>
                  <span className="text-xs font-mono text-neutral-400">{plan.period}</span>
                </div>

                {/* Resumo Rápido dos Recursos Principais */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Memória RAM</span>
                    <span className="text-sm font-bold text-cyan-300 font-mono">{plan.ram}</span>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-center">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono block">Capacidade</span>
                    <span className="text-sm font-bold text-emerald-300 font-mono">{plan.bots}</span>
                  </div>
                </div>

                {/* Lista de Recursos */}
                <div className="space-y-3 font-mono text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 block font-semibold mb-1">
                    Recursos Inclusos:
                  </span>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-neutral-300">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}

                  {plan.notIncluded.length > 0 && (
                    <div className="pt-2 space-y-2 text-neutral-500">
                      {plan.notIncluded.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span className="text-neutral-600 text-xs shrink-0">&times;</span>
                          <span className="leading-snug line-through">{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="mt-8 pt-4">
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

      {/* Banner de Garantia e Métodos de Pagamento */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="apple-glass-card rounded-[28px] p-6 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 border border-white/15 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Garantia de Satisfação e Ativação Instantânea</h4>
              <p className="text-xs text-neutral-400 mt-0.5">
                Seus servidores sobem imediatamente após a confirmação do pagamento com 99.9% de SLA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>Pix Imediato</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <span>Cartão de Crédito</span>
            </div>
          </div>
        </div>
      </section>

      {/* Perguntas Frequentes (FAQ) */}
      <section className="max-w-3xl mx-auto px-4 pt-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-neutral-300 mb-2">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tire suas Dúvidas</span>
          </div>
          <h3 className="text-2xl font-bold text-white">Perguntas Frequentes</h3>
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

      {/* Modal de Prévia de Checkout / Assinatura */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="apple-glass-card w-full max-w-md rounded-[32px] p-6 border border-white/20 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-400/30">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Confirmar Assinatura</h4>
                  <span className="text-xs font-mono text-cyan-300">{selectedPlanForModal.name}</span>
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
                  <span className="text-neutral-400 block text-[11px]">Valor Selecionado:</span>
                  <span className="text-xl font-bold text-white">
                    {billingCycle === 'yearly' ? selectedPlanForModal.priceYearly : selectedPlanForModal.priceMonthly}
                  </span>
                  <span className="text-[10px] text-neutral-400"> {selectedPlanForModal.period}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                  ⚡ Ativação Instantânea
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-neutral-300 font-semibold block">Escolha a Forma de Pagamento:</span>
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
                  <span>Ambiente 100% Criptografado & Seguro</span>
                </div>
                <p>O gateway de pagamentos oficial será conectado na próxima etapa com o provedor de sua preferência (Mercado Pago / Asaas / Stripe).</p>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setSelectedPlanForModal(null)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-300 text-xs font-mono hover:bg-white/10"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  alert(`O plano "${selectedPlanForModal.name}" foi selecionado! Na próxima etapa conectaremos o gateway de pagamentos ao vivo.`);
                  setSelectedPlanForModal(null);
                }}
                className="flex-1 apple-pill-primary py-3 rounded-xl text-white text-xs font-bold font-mono shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>Prosseguir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
