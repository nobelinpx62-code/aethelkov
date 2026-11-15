'use client';

import React, { useState, useEffect } from 'react';
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
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PlansViewProps {
  currentUser?: any;
  onOpenDeploy?: () => void;
  onPlanPurchased?: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ currentUser, onOpenDeploy, onPlanPurchased }) => {
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<any | null>(null);
  
  // Estados do Pix Interativo
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [pixData, setPixData] = useState<any | null>(null);
  const [pixError, setPixError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  // Auto-polling para verificar se o cliente pagou o Pix
  useEffect(() => {
    if (!pixData?.paymentId || isPaid) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/status?paymentId=${pixData.paymentId}`);
        const data = await res.json();
        if (data.approved) {
          setIsPaid(true);
          onPlanPurchased?.();
          clearInterval(interval);
        }
      } catch (_) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [pixData?.paymentId, isPaid, onPlanPurchased]);

  // Função para chamar o backend e gerar o Pix via Mercado Pago
  const handleGeneratePix = async (plan: any) => {
    setIsGeneratingPix(true);
    setPixError(null);
    setPixData(null);
    setIsPaid(false);

    try {
      const res = await fetch('/api/payments/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          payerEmail: currentUser?.email || 'cliente@aethelkov.app',
          payerName: currentUser?.user_metadata?.full_name || 'Cliente Aethel',
          userId: currentUser?.id || 'default-user',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao gerar cobrança Pix.');
      }

      setPixData(data);
    } catch (err: any) {
      setPixError(err.message);
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const handleCopyPix = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const resetModal = () => {
    setSelectedPlanForModal(null);
    setPixData(null);
    setPixError(null);
    setIsPaid(false);
    setIsGeneratingPix(false);
  };

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

      {/* Modal de Pagamento Integrado ao Mercado Pago Pix */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="apple-glass-card w-full max-w-md max-h-[92vh] overflow-y-auto custom-scrollbar rounded-[32px] p-6 border border-white/20 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h4 className="text-base font-bold text-white">Contratar Plano {selectedPlanForModal.name}</h4>
                <span className="text-xs font-mono text-[#00e676]">{selectedPlanForModal.ramText}</span>
              </div>
              <button
                onClick={resetModal}
                className="text-neutral-400 hover:text-white p-1 rounded-full hover:bg-white/10 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Cenário 1: Pagamento Aprovado com Sucesso */}
            {isPaid ? (
              <div className="py-8 text-center space-y-4 animate-fadeIn font-mono">
                <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h3 className="text-xl font-bold text-white">Pagamento Confirmado!</h3>
                <p className="text-xs text-neutral-300 leading-relaxed max-w-xs mx-auto">
                  O Pix foi identificado com sucesso! Os <strong>{selectedPlanForModal.ramText}</strong> já foram liberados e ativados na sua conta.
                </p>
                <button
                  onClick={resetModal}
                  className="apple-pill-btn apple-pill-primary px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-lg mt-2"
                >
                  Concluir e Voltar ao Painel
                </button>
              </div>
            ) : pixData ? (
              /* Cenário 2: Exibição do QR Code e Pix Copia e Cola */
              <div className="py-4 space-y-4 font-mono text-xs animate-fadeIn">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-center flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Aguardando pagamento... (Aprovação em ~5s)</span>
                </div>

                {/* Imagem do QR Code Pix */}
                {pixData.qrCodeBase64 ? (
                  <div className="flex justify-center p-3 bg-white rounded-2xl w-52 h-52 mx-auto shadow-xl">
                    <img
                      src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                      alt="QR Code Pix"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="p-6 text-center bg-black/40 rounded-2xl border border-white/10">
                    <QrCode className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
                    <span className="text-neutral-400 text-[11px]">Escaneie o código Pix abaixo no app do seu banco:</span>
                  </div>
                )}

                {/* Pix Copia e Cola */}
                <div className="space-y-1">
                  <span className="text-neutral-400 block text-[11px] font-semibold">Código Pix Copia e Cola:</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={pixData.qrCode || ''}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-neutral-300 text-[11px] font-mono truncate focus:outline-none"
                    />
                    <button
                      onClick={handleCopyPix}
                      className="px-3 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[10px] text-neutral-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Validade de 15 minutos</span>
                  </div>
                  <p>Abra o aplicativo do seu banco, escolha <strong>Pix</strong> e selecione <strong>Pagar com QR Code</strong> ou <strong>Pix Copia e Cola</strong>.</p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={resetModal}
                    className="w-full py-2.5 rounded-xl bg-white/5 text-neutral-300 text-xs font-mono hover:bg-white/10"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              /* Cenário 3: Confirmação Inicial antes de Gerar */
              <div className="py-5 space-y-4 font-mono text-xs">
                {pixError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{pixError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-neutral-400 block text-[11px]">Valor da Assinatura:</span>
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

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-neutral-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero restrições de código. Seu bot sobe em container isolado.</span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={resetModal}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-neutral-300 text-xs font-mono hover:bg-white/10"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => handleGeneratePix(selectedPlanForModal)}
                    disabled={isGeneratingPix}
                    className="flex-1 apple-pill-primary py-3 rounded-xl text-white text-xs font-bold font-mono shadow-lg flex items-center justify-center gap-1.5"
                  >
                    {isGeneratingPix ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gerando Pix...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>Pagar com Pix</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
