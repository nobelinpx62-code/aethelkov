'use client';

import React, { useState } from 'react';
import { 
  Cpu, 
  HardDrive, 
  Network, 
  Code2, 
  Zap, 
  ArrowRight, 
  QrCode, 
  CreditCard, 
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface PlansViewProps {
  currentUser?: any;
  onOpenDeploy?: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ currentUser, onOpenDeploy }) => {
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any | null>(null);

  // Planos puros de infraestrutura: Sem restrições de código, o limite é puramente a RAM contratada!
  const plans = [
    {
      id: 'free',
      name: 'Starter',
      ramText: '100 MB RAM',
      price: 'R$ 0',
      period: '/mês',
      titleColor: 'text-neutral-200',
      specs: [
        { icon: Cpu, label: '0.5 vCPU Compartilhado' },
        { icon: HardDrive, label: 'SSD NVMe de Alta Performance' },
        { icon: Network, label: 'Banda Ilimitada' },
        { icon: Code2, label: 'Programe o que quiser (Zero restrições)' },
      ],
      borderStyle: 'border-white/10 hover:border-white/25',
      buttonText: 'Plano Grátis Ativo',
      buttonStyle: 'bg-white/10 text-neutral-300 border border-white/10 hover:bg-white/15',
    },
    {
      id: '1gb',
      name: 'Gold',
      ramText: '1 GB RAM',
      price: 'R$ 5,00',
      period: '/mês',
      popular: true,
      titleColor: 'text-cyan-400',
      specs: [
        { icon: Cpu, label: '1 vCPU' },
        { icon: HardDrive, label: 'SSD NVMe Empresarial' },
        { icon: Network, label: 'Banda Ilimitada' },
        { icon: Code2, label: 'Programe o que quiser (Zero restrições)' },
      ],
      borderStyle: 'border-cyan-400/50 shadow-[0_0_35px_rgba(6,182,212,0.25)] hover:border-cyan-400',
      buttonText: 'Contratar por R$ 5,00',
      buttonStyle: 'apple-pill-primary text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]',
    },
    {
      id: '2gb',
      name: 'Platinum',
      ramText: '2 GB RAM',
      price: 'R$ 10,00',
      period: '/mês',
      titleColor: 'text-emerald-400',
      specs: [
        { icon: Cpu, label: '2 vCPU' },
        { icon: HardDrive, label: 'SSD NVMe Empresarial' },
        { icon: Network, label: 'Banda Ilimitada' },
        { icon: Code2, label: 'Programe o que quiser (Zero restrições)' },
      ],
      borderStyle: 'border-emerald-500/30 hover:border-emerald-400/60 shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      buttonText: 'Contratar por R$ 10,00',
      buttonStyle: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg',
    },
    {
      id: '4gb',
      name: 'Diamond',
      ramText: '4 GB RAM',
      price: 'R$ 23,99',
      period: '/mês',
      titleColor: 'text-purple-400',
      specs: [
        { icon: Cpu, label: '3 vCPU' },
        { icon: HardDrive, label: 'SSD NVMe Empresarial' },
        { icon: Network, label: 'Banda Ilimitada' },
        { icon: Code2, label: 'Programe o que quiser (Zero restrições)' },
      ],
      borderStyle: 'border-purple-500/30 hover:border-purple-400/60 shadow-[0_0_25px_rgba(168,85,247,0.15)]',
      buttonText: 'Contratar por R$ 23,99',
      buttonStyle: 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-lg',
    },
    {
      id: '8gb',
      name: 'Monster',
      ramText: '8 GB RAM',
      price: 'R$ 45,00',
      period: '/mês',
      titleColor: 'text-amber-400',
      specs: [
        { icon: Cpu, label: '4 vCPU' },
        { icon: HardDrive, label: 'SSD NVMe Empresarial' },
        { icon: Network, label: 'Banda Ilimitada' },
        { icon: Code2, label: 'Programe o que quiser (Zero restrições)' },
      ],
      borderStyle: 'border-amber-500/30 hover:border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.2)]',
      buttonText: 'Contratar por R$ 45,00',
      buttonStyle: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-lg',
    },
  ];

  return (
    <div className="space-y-10 animate-fadeIn pb-16">
      {/* Header Minimalista e Objetivo */}
      <section className="text-center max-w-2xl mx-auto pt-4 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-4 text-xs font-mono text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Hospedagem de Bots • Zero Restrições de Código</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-white">
          Planos de Infraestrutura
        </h1>

        <p className="text-neutral-400 text-sm mt-3 leading-relaxed">
          Sem bloqueio de recursos. Você programa e hospeda o que quiser em <strong>Python, Node.js ou Java</strong>. 
          O limite é puramente a memória RAM contratada.
        </p>
      </section>

      {/* Grid de Cards Idênticos ao Estilo Discloud */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto px-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`apple-glass-card rounded-[28px] p-6 border relative flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${plan.borderStyle}`}
          >
            {/* Efeito de Reflexo Superior */}
            <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

            {/* Destaque para o plano de 1 GB */}
            {plan.popular && (
              <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                Melhor Custo-Benefício
              </div>
            )}

            <div>
              {/* Linha do Título e RAM (Exatamente como na imagem) */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                <h3 className={`text-2xl font-bold tracking-tight ${plan.titleColor}`}>
                  {plan.name}
                </h3>
                <span className="text-lg font-bold text-[#00e676] font-mono tracking-tight">
                  {plan.ramText}
                </span>
              </div>

              {/* Lista de Especificações Técnicas Limpas */}
              <div className="space-y-3 font-mono text-xs text-neutral-300">
                {plan.specs.map((spec, idx) => {
                  const Icon = spec.icon;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-neutral-400 shrink-0" />
                      <span className="leading-tight">{spec.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Preço */}
              <div className="mt-6 pt-5 border-t border-white/10 flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-white tracking-tight">{plan.price}</span>
                <span className="text-xs font-mono text-neutral-400">{plan.period}</span>
              </div>
            </div>

            {/* Botão de Contratação */}
            <div className="mt-6">
              <button
                onClick={() => setSelectedPlanForModal(plan)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${plan.buttonStyle}`}
              >
                <span>{plan.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Modal de Pagamento Simples e Rápido */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="apple-glass-card w-full max-w-md rounded-[32px] p-6 border border-white/20 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h4 className="text-base font-bold text-white">Contratar Plano {selectedPlanForModal.name}</h4>
                <span className="text-xs font-mono text-[#00e676]">{selectedPlanForModal.ramText}</span>
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
                    {selectedPlanForModal.price}
                  </span>
                  <span className="text-[10px] text-neutral-400"> {selectedPlanForModal.period}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-[#00e676] block">{selectedPlanForModal.ramText}</span>
                  <span className="text-[10px] text-cyan-300">⚡ Ativação Imediata</span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-neutral-300 font-semibold block">Pagar via:</span>
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

              <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-neutral-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero restrições de código. Seu bot sobe em container isolado.</span>
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
                  alert(`Plano "${selectedPlanForModal.name}" (${selectedPlanForModal.ramText}) selecionado! Na próxima etapa integraremos o gateway do Pix.`);
                  setSelectedPlanForModal(null);
                }}
                className="flex-1 apple-pill-primary py-3 rounded-xl text-white text-xs font-bold font-mono shadow-lg flex items-center justify-center gap-1.5"
              >
                <span>Continuar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
