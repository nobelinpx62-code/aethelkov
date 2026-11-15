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
  AlertCircle,
  Lock,
  ChevronRight
} from 'lucide-react';

interface PlansViewProps {
  currentUser?: any;
  subscription?: any;
  onOpenDeploy?: () => void;
  onPlanPurchased?: () => void;
}

export const PlansView: React.FC<PlansViewProps> = ({ 
  currentUser, 
  subscription,
  onOpenDeploy, 
  onPlanPurchased 
}) => {
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
          isUpgrade: plan.isUpgrade || false,
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
  const basePlans = [
    {
      id: 'free',
      name: 'Starter',
      tier: 0,
      ramMb: 100,
      ramText: '100 MB RAM',
      price: 'R$ 0',
      rawPrice: 0,
      period: '/mês',
      titleColor: 'text-neutral-200',
      specs: [
        { icon: Cpu, label: '0.5 vCPU Compartilhado' },
        { icon: HardDrive, label: 'SSD NVMe de Alta Performance' },
        { icon: Network, label: 'Banda Ilimitada' },
        { icon: Code2, label: 'Programe o que quiser (Zero restrições)' },
      ],
      borderStyle: 'border-white/10 hover:border-white/25',
      buttonText: 'Plano Grátis Padrão',
      buttonStyle: 'bg-white/10 text-neutral-300 border border-white/10 hover:bg-white/15',
    },
    {
      id: '1gb',
      name: 'Gold',
      tier: 1,
      ramMb: 1024,
      ramText: '1 GB RAM',
      price: 'R$ 5,00',
      rawPrice: 5.00,
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
      tier: 2,
      ramMb: 2048,
      ramText: '2 GB RAM',
      price: 'R$ 10,00',
      rawPrice: 10.00,
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
      tier: 3,
      ramMb: 4096,
      ramText: '4 GB RAM',
      price: 'R$ 23,99',
      rawPrice: 23.99,
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
      tier: 4,
      ramMb: 8192,
      ramText: '8 GB RAM',
      price: 'R$ 45,00',
      rawPrice: 45.00,
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

  // Identifica o tier ativo atual do usuário
  const activePlanId = subscription?.isActive ? subscription.planId : 'free';
  const currentTier = basePlans.find((p) => p.id === activePlanId)?.tier || 0;

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

        {subscription?.isActive && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-[#00e676] animate-pulse"></span>
            <span>Você tem o <strong>Plano {subscription.planId.toUpperCase()}</strong> ativo ({subscription.daysRemaining} dias restantes)</span>
          </div>
        )}
      </section>

      {/* Grid de Cards Idênticos ao Estilo Discloud */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {basePlans.map((plan) => {
          const isCurrentPlan = subscription?.isActive && subscription.planId === plan.id;
          const isLowerTier = subscription?.isActive && plan.tier < currentTier;
          const isUpgradeTier = subscription?.isActive && plan.tier > currentTier;

          // Regra de Upgrade: paga 50% (metade) do valor normal!
          const upgradePriceNum = isUpgradeTier ? Math.round((plan.rawPrice / 2) * 100) / 100 : plan.rawPrice;
          const upgradePriceStr = `R$ ${upgradePriceNum.toFixed(2).replace('.', ',')}`;

          return (
            <div
              key={plan.id}
              className={`apple-glass-card rounded-[28px] p-6 border relative flex flex-col justify-between transition-all duration-300 hover:scale-[1.02] ${
                isCurrentPlan 
                  ? 'border-emerald-500/50 shadow-[0_0_35px_rgba(16,185,129,0.25)] bg-emerald-500/5' 
                  : isLowerTier
                    ? 'border-white/5 opacity-60'
                    : isUpgradeTier
                      ? 'border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.2)]'
                      : plan.borderStyle
              }`}
            >
              {/* Efeito de Reflexo Superior */}
              <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

              {/* Tag de Status Especial */}
              {isCurrentPlan ? (
                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-emerald-500 text-black text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>Seu Plano Atual Ativo</span>
                </div>
              ) : isUpgradeTier ? (
                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>50% OFF no Upgrade</span>
                </div>
              ) : plan.popular ? (
                <div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
                  Melhor Custo-Benefício
                </div>
              ) : null}

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

                {/* Bloco de Preço */}
                <div className="mt-6 pt-5 border-t border-white/10">
                  {isUpgradeTier ? (
                    <div>
                      <span className="text-xs font-mono text-neutral-500 line-through block">
                        De {plan.price} {plan.period}
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl font-extrabold text-[#00e676] tracking-tight">
                          {upgradePriceStr}
                        </span>
                        <span className="text-xs font-mono text-cyan-300 font-semibold">(50% OFF)</span>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 block mt-1">
                        Mantém seus {subscription.daysRemaining} dias restantes!
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold text-white tracking-tight">{plan.price}</span>
                      <span className="text-xs font-mono text-neutral-400">{plan.period}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Contratação / Upgrade / Bloqueio */}
              <div className="mt-6">
                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 cursor-not-allowed opacity-90"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Plano Atual Ativo ({subscription.daysRemaining}d)</span>
                  </button>
                ) : isLowerTier ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 bg-white/5 text-neutral-500 border border-white/5 cursor-not-allowed opacity-50"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Plano Inferior</span>
                  </button>
                ) : isUpgradeTier ? (
                  <button
                    onClick={() =>
                      setSelectedPlanForModal({
                        ...plan,
                        isUpgrade: true,
                        displayPrice: upgradePriceStr,
                        numericPrice: upgradePriceNum,
                        daysRemaining: subscription.daysRemaining,
                      })
                    }
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 apple-pill-primary text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02]"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Fazer Upgrade por {upgradePriceStr}</span>
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      setSelectedPlanForModal({
                        ...plan,
                        isUpgrade: false,
                        displayPrice: plan.price,
                        numericPrice: plan.rawPrice,
                      })
                    }
                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${plan.buttonStyle}`}
                  >
                    <span>{plan.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Modal de Pagamento Integrado ao Mercado Pago Pix */}
      {selectedPlanForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="apple-glass-card w-full max-w-md max-h-[92vh] overflow-y-auto custom-scrollbar rounded-[32px] p-6 border border-white/20 shadow-2xl relative animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h4 className="text-base font-bold text-white">
                  {selectedPlanForModal.isUpgrade ? 'Fazer Upgrade para' : 'Contratar'} Plano {selectedPlanForModal.name}
                </h4>
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
              <div className="py-6 text-center space-y-4 animate-fadeIn font-mono">
                <div className="relative flex h-20 w-20 mx-auto items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-500/30 to-cyan-500/20 text-emerald-400 border border-emerald-400/50 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-pulse" />
                  <Sparkles className="w-5 h-5 text-amber-300 absolute -top-2 -right-2 animate-bounce" />
                </div>
                
                <div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-400 block mb-1">
                    🎉 Pagamento Confirmado!
                  </span>
                  <h3 className="text-2xl font-black text-white tracking-tight">
                    {selectedPlanForModal.isUpgrade ? 'Upgrade Concluído com Sucesso!' : `Parabéns! Plano ${selectedPlanForModal.name} Ativado!`}
                  </h3>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-neutral-300 space-y-2 max-w-xs mx-auto">
                  <div className="flex items-center justify-between text-white font-semibold">
                    <span>Nova RAM:</span>
                    <span className="text-[#00e676] font-mono text-sm font-bold">+{selectedPlanForModal.ramText}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                    <span>Validade:</span>
                    <span className="text-cyan-300 font-semibold">
                      {selectedPlanForModal.isUpgrade 
                        ? `${selectedPlanForModal.daysRemaining || 30} dias restantes mantidos` 
                        : '30 dias completos'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                    <span>Recursos:</span>
                    <span className="text-emerald-400 font-bold">⚡ 100% Desbloqueados</span>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  Sua nova cota já foi entregue e ativada no seu perfil. Você já pode criar instâncias ou subir bots sem restrições!
                </p>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={resetModal}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-neutral-300 text-xs font-mono hover:bg-white/10 transition-all"
                  >
                    Voltar ao Painel
                  </button>
                  <button
                    onClick={() => {
                      resetModal();
                      onOpenDeploy?.();
                    }}
                    className="flex-1 apple-pill-primary py-3 px-4 rounded-xl text-white text-xs font-bold font-mono shadow-lg flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Criar Meu Bot</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
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

                {selectedPlanForModal.isUpgrade ? (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-400/30 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-400/30">
                          ⚡ 50% OFF Upgrade
                        </span>
                      </div>
                      <span className="text-neutral-400 block text-[11px]">Valor Promocional do Upgrade:</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-neutral-500 line-through font-mono">{selectedPlanForModal.price}</span>
                        <span className="text-2xl font-bold text-[#00e676]">
                          {selectedPlanForModal.displayPrice}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#00e676] block">{selectedPlanForModal.ramText}</span>
                      <span className="text-[10px] text-cyan-300 block">Mantém seus {selectedPlanForModal.daysRemaining}d</span>
                      <span className="text-[9px] text-emerald-400">⚡ Ativação Imediata</span>
                    </div>
                  </div>
                ) : (
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
                )}

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] text-neutral-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {selectedPlanForModal.isUpgrade 
                      ? 'Upgrade imediato: sua RAM é expandida na hora e seus dias continuam os mesmos.'
                      : 'Zero restrições de código. Seu bot sobe em container isolado.'}
                  </span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={resetModal}
                    className="flex-1 py-3 px-4 rounded-xl bg-white/5 text-neutral-300 text-xs font-mono hover:bg-white/10"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => handleGeneratePix(selectedPlanForModal)}
                    disabled={isGeneratingPix}
                    className="flex-1 apple-pill-primary py-3 px-4 rounded-xl text-white text-xs font-bold font-mono shadow-lg flex items-center justify-center gap-1.5"
                  >
                    {isGeneratingPix ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gerando Pix...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-4 h-4" />
                        <span>Pagar {selectedPlanForModal.displayPrice} com Pix</span>
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
