'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Plus, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Cpu, 
  Zap,
  ArrowRight,
  RefreshCw,
  Terminal
} from 'lucide-react';
import { SubdomainBinding, SubdomainQuota } from '@/lib/subdomainManager';
import { AethelBot } from '@/lib/types';

interface SubdomainsViewProps {
  currentUser?: any;
  bots: AethelBot[];
  onOpenDeploy?: () => void;
  onOpenBotDetails?: (botId: string) => void;
  onOpenPlans?: () => void;
  onRefresh?: () => void;
}

export const SubdomainsView: React.FC<SubdomainsViewProps> = ({
  currentUser,
  bots,
  onOpenDeploy,
  onOpenBotDetails,
  onOpenPlans,
  onRefresh,
}) => {
  const [subdomains, setSubdomains] = useState<SubdomainBinding[]>([]);
  const [quota, setQuota] = useState<SubdomainQuota>({
    maxSubdomains: 1,
    usedSubdomains: 0,
    remaining: 1,
    planId: 'free',
  });
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Estados do formulário de criação
  const [newSubdomain, setNewSubdomain] = useState('');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<{ available: boolean; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fetchSubdomains = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subdomains?userId=${currentUser?.id || ''}`);
      const data = await res.json();
      if (data.success) {
        setSubdomains(data.subdomains || []);
        if (data.quota) setQuota(data.quota);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubdomains();
  }, [currentUser?.id]);

  // Checagem de disponibilidade em tempo real
  useEffect(() => {
    const clean = newSubdomain.trim().toLowerCase();
    if (clean.length < 3) {
      setAvailabilityMessage(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch(`/api/subdomains?check=${clean}`);
        const data = await res.json();
        if (data.available) {
          setAvailabilityMessage({
            available: true,
            text: `✓ ${clean}.linkthelkov.online está disponível!`,
          });
        } else {
          setAvailabilityMessage({
            available: false,
            text: data.error || `✗ "${clean}" já está em uso ou é inválido.`,
          });
        }
      } catch (_) {
        setAvailabilityMessage(null);
      } finally {
        setIsChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [newSubdomain]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleCreateSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubdomain.trim()) return;

    setIsSubmitting(true);
    setErrorToast(null);
    setSuccessToast(null);

    const targetApp = bots.find((b) => b.id === selectedAppId);

    try {
      const res = await fetch('/api/subdomains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subdomain: newSubdomain.trim().toLowerCase(),
          appId: targetApp?.id || '',
          appName: targetApp?.bot_name || newSubdomain.trim(),
          userId: currentUser?.id || '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao criar subdomínio.');
      }

      setSuccessToast(`Subdomínio https://${newSubdomain.trim().toLowerCase()}.linkthelkov.online ativado com sucesso!`);
      setNewSubdomain('');
      setSelectedAppId('');
      setAvailabilityMessage(null);
      fetchSubdomains();
      onRefresh?.();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setErrorToast(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubdomain = async (sub: string) => {
    if (!confirm(`Tem certeza que deseja apagar o subdomínio "${sub}.linkthelkov.online"? O site vinculado deixará de receber tráfego público.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/subdomains?subdomain=${sub}&userId=${currentUser?.id || ''}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccessToast(`Subdomínio "${sub}" removido com sucesso.`);
      fetchSubdomains();
      onRefresh?.();
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setErrorToast(err.message || 'Erro ao remover subdomínio.');
    }
  };

  const isLimitReached = quota.usedSubdomains >= quota.maxSubdomains;
  const webApps = bots.filter((b) => b.assigned_node?.startsWith('site:') || b.platform === 'DISCORD');

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Header Minimalista */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-xs font-mono text-cyan-300 mb-2">
            <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span>Roteamento Web & Certificado SSL Grátis</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Subdomínios Web
          </h1>
          <p className="text-sm text-neutral-400 mt-1 max-w-xl">
            Aponte seus sites, dashboards e APIs para <strong className="text-white">*.linkthelkov.online</strong>.
            Divida a RAM do seu plano entre bots e sites com autonomia total.
          </p>
        </div>

        <button
          onClick={fetchSubdomains}
          className="apple-pill-btn flex items-center gap-2 self-start sm:self-auto rounded-full px-4 py-2 text-xs font-mono text-neutral-300 hover:text-white"
          title="Atualizar lista"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Atualizar</span>
        </button>
      </section>

      {/* Toasts */}
      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3 animate-fadeIn shadow-lg">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Card de Cota de Subdomínios do Plano */}
      <section className="apple-glass-card rounded-[32px] p-6 border border-white/12 relative overflow-hidden">
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-white">Cota de Subdomínios do Plano</span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-[10px] font-mono font-bold text-cyan-300 border border-cyan-400/30 uppercase">
                Plano {quota.planId.toUpperCase()}
              </span>
            </div>

            <p className="text-xs text-neutral-400">
              Você está utilizando <strong className="text-white">{quota.usedSubdomains}</strong> de <strong className="text-white">{quota.maxSubdomains}</strong> subdomínios permitidos no seu plano.
            </p>

            {/* Barra de Progresso */}
            <div className="w-full max-w-md h-2 rounded-full bg-black/50 border border-white/5 overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  isLimitReached ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]' : 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_10px_#06b6d4]'
                }`}
                style={{ width: `${Math.min(100, (quota.usedSubdomains / Math.max(1, quota.maxSubdomains)) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLimitReached ? (
              <button
                onClick={onOpenPlans}
                className="apple-pill-btn flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white apple-pill-primary shadow-[0_0_20px_rgba(6,182,212,0.4)]"
              >
                <Zap className="w-4 h-4 text-amber-300" />
                <span>Liberar Mais Subdomínios (Upgrade)</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-mono text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>{quota.remaining} vaga(s) disponível(is)</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Formulário de Reserva / Novo Subdomínio */}
      <section className="apple-glass-card rounded-[32px] p-6 md:p-8 border border-white/12 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400" />
          <span>Vincular Novo Subdomínio</span>
        </h2>
        <p className="text-xs text-neutral-400">
          Escolha o prefixo que você deseja. Ele ficará ativo instantaneamente com roteamento HTTPS.
        </p>

        <form onSubmit={handleCreateSubdomain} className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Campo Subdomínio */}
          <div className="md:col-span-5 relative">
            <div className="flex items-center rounded-2xl bg-black/50 border border-white/15 px-3.5 py-2.5 focus-within:border-cyan-400 transition-colors">
              <span className="text-neutral-500 font-mono text-xs select-none">https://</span>
              <input
                type="text"
                placeholder="meusite"
                value={newSubdomain}
                onChange={(e) => setNewSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                disabled={isLimitReached || isSubmitting}
                className="bg-transparent text-white font-mono text-xs w-full focus:outline-none px-1"
              />
              <span className="text-cyan-400 font-mono text-xs select-none">.linkthelkov.online</span>
            </div>

            {/* Mensagem de disponibilidade */}
            {isChecking && (
              <span className="text-[10px] font-mono text-neutral-400 mt-1 block">Verificando...</span>
            )}
            {!isChecking && availabilityMessage && (
              <span className={`text-[10px] font-mono mt-1 block ${availabilityMessage.available ? 'text-emerald-400' : 'text-rose-400'}`}>
                {availabilityMessage.text}
              </span>
            )}
          </div>

          {/* Selecionar Aplicação Vinculada */}
          <div className="md:col-span-4">
            <select
              value={selectedAppId}
              onChange={(e) => setSelectedAppId(e.target.value)}
              disabled={isLimitReached || isSubmitting}
              className="w-full rounded-2xl bg-black/50 border border-white/15 px-3.5 py-2.5 text-xs text-white font-mono focus:border-cyan-400 focus:outline-none"
            >
              <option value="">Vincular a uma aplicação... (Opcional)</option>
              {webApps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.bot_name} ({app.ram_limit_mb} MB RAM)
                </option>
              ))}
            </select>
          </div>

          {/* Botão Salvar */}
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isLimitReached || isSubmitting || !newSubdomain.trim() || availabilityMessage?.available === false}
              className={`w-full py-2.5 px-4 rounded-2xl text-xs font-semibold tracking-wide flex items-center justify-center gap-2 transition-all ${
                isLimitReached
                  ? 'bg-white/5 text-neutral-500 border border-white/5 cursor-not-allowed'
                  : 'apple-pill-primary text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]'
              }`}
            >
              {isSubmitting ? (
                <span>Ativando...</span>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" />
                  <span>Criar Subdomínio</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Grid de Subdomínios Ativos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
            <span>Subdomínios Ativos</span>
            <span className="text-xs font-mono text-neutral-400">({subdomains.length})</span>
          </h2>
        </div>

        {subdomains.length === 0 ? (
          <div className="apple-glass-card rounded-[32px] p-12 text-center border border-white/10 relative overflow-hidden">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4 text-neutral-400">
              <Globe className="w-8 h-8 text-cyan-400/60" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Nenhum subdomínio configurado</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto mb-5">
              Crie seu primeiro subdomínio no formulário acima ou faça upload de um projeto com <code className="text-cyan-300">TYPE=site</code> e <code className="text-cyan-300">SUBDOMAIN=seunome</code> no arquivo <code className="text-white">aethel.config</code>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subdomains.map((sub) => {
              const linkedApp = bots.find((b) => b.id === sub.appId || b.assigned_node === `site:${sub.subdomain}`);
              const isAppOnline = linkedApp ? linkedApp.status === 'ONLINE' : true;

              return (
                <div
                  key={sub.subdomain}
                  className="apple-glass-card rounded-[28px] p-5 border border-white/12 relative flex flex-col justify-between hover:border-cyan-400/40 transition-all duration-300 group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
                          <Globe className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white font-mono group-hover:text-cyan-300 transition-colors">
                            {sub.subdomain}.linkthelkov.online
                          </h3>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            Criado em {new Date(sub.createdAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>{isAppOnline ? 'ONLINE' : 'STOPPED'}</span>
                      </span>
                    </div>

                    {/* Aplicação Vinculada */}
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs flex items-center justify-between">
                      <span className="text-neutral-400 text-[11px]">Aplicação:</span>
                      <span className="text-white font-semibold text-[11px] truncate max-w-[180px]">
                        {linkedApp?.bot_name || sub.appName || 'Aplicação Web'}
                      </span>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      {/* Copiar Link */}
                      <button
                        onClick={() => handleCopy(sub.url)}
                        className="apple-pill-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono text-neutral-300 hover:text-white"
                        title="Copiar URL"
                      >
                        {copiedUrl === sub.url ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>

                      {/* Abrir Link em Nova Aba */}
                      <a
                        href={sub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="apple-pill-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-mono text-cyan-300 border-cyan-400/30 hover:bg-cyan-500/20"
                      >
                        <span>Acessar</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Se houver app vinculado, botão para ir aos detalhes */}
                      {linkedApp && onOpenBotDetails && (
                        <button
                          onClick={() => onOpenBotDetails(linkedApp.id)}
                          className="apple-pill-btn p-1.5 rounded-full text-neutral-400 hover:text-white"
                          title="Abrir Painel Operacional do Site"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Excluir Subdomínio */}
                      <button
                        onClick={() => handleDeleteSubdomain(sub.subdomain)}
                        className="apple-pill-btn p-1.5 rounded-full text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Apagar / Desvincular Subdomínio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Caixa Informativa do Padrão Discloud / Aethel Config */}
      <section className="apple-glass-card rounded-[28px] p-6 border border-white/10 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-cyan-300">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="font-bold uppercase tracking-wider text-[11px]">Como conectar automaticamente via arquivo aethel.config:</span>
        </div>

        <p className="text-neutral-400 text-xs font-sans leading-relaxed">
          Basta adicionar as linhas <code className="text-cyan-300">TYPE=site</code> e <code className="text-cyan-300">SUBDOMAIN=seunome</code> (sem <code className="text-neutral-500">https://</code>, sem barras) no seu arquivo de configuração. O Aethelkov detecta e liga o site na hora:
        </p>

        <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 text-emerald-300 text-xs">
          <pre>{`NAME=meu-site
TYPE=site
MAIN=index.js
RAM=512
SUBDOMAIN=meusite`}</pre>
        </div>

        <p className="text-neutral-500 text-[11px] font-sans">
          💡 Seu site ficará acessível imediatamente no endereço: <strong className="text-cyan-300">https://meusite.linkthelkov.online</strong>
        </p>
      </section>
    </div>
  );
};
