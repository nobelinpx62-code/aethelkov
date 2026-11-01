'use client';

import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Plus, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  HardDrive, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { 
  AethelSubdomain, 
  getUserSubdomains, 
  createSubdomain, 
  deleteSubdomain,
  validateSubdomainName 
} from '@/lib/subdomainService';

interface SubdomainManagerProps {
  userId: string;
  onDeploySiteWithSubdomain?: (subdomain: string) => void;
}

export const SubdomainManager: React.FC<SubdomainManagerProps> = ({
  userId,
  onDeploySiteWithSubdomain,
}) => {
  const [subdomains, setSubdomains] = useState<AethelSubdomain[]>([]);
  const [newSubInput, setNewSubInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadSubdomains = () => {
    const list = getUserSubdomains(userId);
    setSubdomains(list);
  };

  useEffect(() => {
    loadSubdomains();
  }, [userId]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const val = validateSubdomainName(newSubInput);
    if (!val.valid) {
      setErrorMsg(val.error || 'Nome de subdomínio inválido.');
      return;
    }

    setIsLoading(true);
    const result = createSubdomain(userId, newSubInput);

    if (result.success && result.subdomain) {
      setSuccessMsg(`Subdomínio registrado com sucesso! Rota ativa em: ${result.subdomain.full_url}`);
      setNewSubInput('');
      loadSubdomains();
      setTimeout(() => setSuccessMsg(null), 5000);
    } else {
      setErrorMsg(result.error || 'Falha ao registrar subdomínio.');
    }

    setIsLoading(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Tem certeza que deseja liberar o subdomínio "${name}"? Se ele estiver vinculado a um site, o site perderá a rota.`)) {
      deleteSubdomain(id);
      loadSubdomains();
    }
  };

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn font-sans">
      {/* Cabeçalho Apple Liquid Glass */}
      <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1.5px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
              <Globe className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Gerenciador de Subdomínios & Sites Web
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-semibold">
                  512 MB por Site
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Crie rotas públicas mundiais com SSL HTTPS automático para hospedar seus sites, proxies e APIs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-2xl border border-white/10 font-mono text-xs">
            <span className="text-neutral-400">Subdomínios Ativos:</span>
            <span className="text-cyan-300 font-bold text-sm">{subdomains.length}</span>
            <span className="text-neutral-500">/ 3</span>
          </div>
        </div>

        {/* Formulário para Registrar Novo Subdomínio */}
        <form onSubmit={handleCreate} className="relative z-10 mt-6 pt-6 border-t border-white/10 space-y-3">
          <span className="font-mono text-xs font-semibold text-neutral-300 uppercase tracking-wider block">
            Registrar Novo Subdomínio Exclusivo
          </span>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full flex items-center rounded-2xl bg-black/50 border border-white/15 focus-within:border-cyan-400 transition-colors overflow-hidden">
              <span className="pl-4 font-mono text-[11px] sm:text-xs text-neutral-400 select-none hidden sm:inline">
                aethelkov.vercel.app/sites/
              </span>
              <span className="pl-3 font-mono text-[11px] text-neutral-400 select-none sm:hidden">
                /sites/
              </span>
              <input
                type="text"
                value={newSubInput}
                onChange={(e) => setNewSubInput(e.target.value.toLowerCase().trim())}
                placeholder="meu-site"
                className="w-full py-3 px-1.5 bg-transparent text-white placeholder-neutral-500 font-mono text-xs sm:text-sm focus:outline-none"
                required
              />
              <span className="pr-4 font-mono text-xs text-cyan-400 font-semibold select-none shrink-0">
                512 MB
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading || !newSubInput}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-semibold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_6px_20px_rgba(6,182,212,0.35)] disabled:opacity-50 shrink-0 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{isLoading ? 'Registrando...' : 'Registrar Subdomínio'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>
      </div>

      {/* Grade de Subdomínios Registrados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Seus Subdomínios Registrados</span>
          </span>
          <span className="text-xs text-neutral-500 font-mono">SSL Wildcard Ativo</span>
        </div>

        {subdomains.length === 0 ? (
          <div className="apple-glass-card rounded-[28px] p-8 border border-white/10 text-center space-y-3">
            <Globe className="w-10 h-10 text-neutral-500 mx-auto opacity-50" />
            <h4 className="text-base font-semibold text-white">Nenhum subdomínio registrado ainda</h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              Digite um nome no campo acima para registrar seu primeiro subdomínio com 512 MB de RAM para seu site ou proxy.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subdomains.map((sub) => {
              const isLinked = sub.status === 'LINKED';

              return (
                <div
                  key={sub.id}
                  className="apple-glass-card rounded-[28px] p-5 border border-white/15 relative overflow-hidden flex flex-col justify-between space-y-4 hover:border-cyan-400/40 transition-all shadow-lg group"
                >
                  <div className="glass-specular pointer-events-none absolute inset-x-8 top-0 h-[1px]"></div>

                  {/* Topo do Card */}
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>SSL HTTPS Ativo</span>
                    </span>

                    <button
                      onClick={() => handleDelete(sub.id, sub.subdomain)}
                      className="p-1 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Excluir subdomínio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* URL do Subdomínio */}
                  <div className="space-y-1">
                    <span className="font-mono text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate block">
                      /sites/<span className="text-cyan-400">{sub.subdomain}</span>
                    </span>
                    <span className="font-mono text-[11px] text-neutral-400 flex items-center gap-1.5">
                      <HardDrive className="w-3 h-3 text-cyan-400" />
                      <span>Cota Dedicada: <strong>{sub.ram_allocated_mb} MB</strong></span>
                    </span>
                  </div>

                  {/* Status de Vínculo */}
                  <div className="p-3 rounded-2xl bg-black/40 border border-white/5 space-y-1 font-mono text-[11px]">
                    <span className="text-neutral-500 text-[10px] uppercase block">Destino Web</span>
                    {isLinked ? (
                      <span className="text-emerald-400 flex items-center gap-1.5 font-medium">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>Vinculado à Instância: {sub.target_bot_name || 'Site'}</span>
                      </span>
                    ) : (
                      <span className="text-amber-300 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                        <span>Disponível para Novo Deploy</span>
                      </span>
                    )}
                  </div>

                  {/* Ações: Copiar Link, Testar e Fazer Deploy */}
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => handleCopy(sub.full_url, sub.id)}
                      className="flex-1 apple-pill-btn flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-mono text-[11px] text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      {copiedId === sub.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={sub.full_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-400 hover:text-cyan-300 transition-colors"
                      title="Abrir no Navegador"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    {!isLinked && onDeploySiteWithSubdomain && (
                      <button
                        type="button"
                        onClick={() => onDeploySiteWithSubdomain(sub.subdomain)}
                        className="apple-pill-btn apple-pill-primary px-3 py-1.5 rounded-xl font-mono text-[11px] font-semibold text-white flex items-center gap-1"
                        title="Fazer deploy de site neste subdomínio"
                      >
                        <span>Upar Site</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Explicação de Boas Práticas */}
      <div className="apple-glass rounded-2xl p-4 sm:p-5 border border-white/10 text-neutral-300 font-sans text-xs space-y-2">
        <div className="flex items-center gap-2 text-cyan-300 font-mono text-[11px] font-semibold uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Como funciona a Hospedagem de Sites na Aethel Kov</span>
        </div>
        <p className="leading-relaxed text-neutral-400">
          1. <strong>Registre seu subdomínio</strong> exclusivo nesta aba (você pode ter até 3 subdomínios gratuitos).<br />
          2. No menu <strong>+ Nova Instância</strong>, escolha a plataforma <strong>SITE / WEB</strong> e selecione o subdomínio desejado.<br />
          3. Suba o arquivo <code>.zip</code> da pasta inteira do seu projeto (com <code>index.html</code> ou <code>index.js</code>) ou utilize nosso editor de código com pastas.<br />
          4. Sua aplicação receberá <strong>512 MB de RAM dedicada</strong> e ficará disponível mundialmente 24/7 sob certificado SSL HTTPS sem custo algum!
        </p>
      </div>
    </div>
  );
};

