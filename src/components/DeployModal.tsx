'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UploadCloud, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Bot, 
  Send,
  Globe,
  HardDrive,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { BotPlatform } from '@/lib/types';
import { 
  getUserSubdomains, 
  linkSubdomainToInstance, 
  AethelSubdomain 
} from '@/lib/subdomainService';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId?: string;
  onGoToSubdomains?: () => void;
  initialSubdomain?: string | null;
}

export const DeployModal: React.FC<DeployModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  userId = 'default',
  onGoToSubdomains,
  initialSubdomain = null,
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'manual'>('manual');
  
  // ZIP Upload States
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipToken, setZipToken] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Manual States
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<BotPlatform>(initialSubdomain ? 'SITE' : 'DISCORD');
  const [token, setToken] = useState('');
  const [ram, setRam] = useState(initialSubdomain ? 512 : 100);
  const [mainFile, setMainFile] = useState(initialSubdomain ? 'index.html' : 'index.js');
  const [configType, setConfigType] = useState<'aethel' | 'discloud' | 'site'>(initialSubdomain ? 'site' : 'aethel');

  // Subdomínios Registrados do Usuário
  const [userSubdomains, setUserSubdomains] = useState<AethelSubdomain[]>([]);
  const [selectedSubdomain, setSelectedSubdomain] = useState<string>(initialSubdomain || '');

  useEffect(() => {
    if (isOpen) {
      const subs = getUserSubdomains(userId);
      setUserSubdomains(subs);
      if (initialSubdomain) {
        setPlatform('SITE');
        setRam(512);
        setMainFile('index.html');
        setConfigType('site');
        setSelectedSubdomain(initialSubdomain);
        setName(initialSubdomain);
      } else if (subs.length > 0 && !selectedSubdomain) {
        setSelectedSubdomain(subs[0].subdomain);
      }
    }
  }, [isOpen, userId, initialSubdomain]);

  if (!isOpen) return null;

  const isSiteMode = platform === 'SITE';

  const handleZipUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      setUploadError('Por favor selecione um arquivo ZIP para upload.');
      return;
    }

    if (isSiteMode && !selectedSubdomain) {
      setUploadError('Você precisa selecionar um subdomínio registrado para o seu site.');
      return;
    }

    const maxLimitBytes = isSiteMode ? 512 * 1024 * 1024 : 100 * 1024 * 1024;
    if (zipFile.size > maxLimitBytes) {
      setUploadError(`Arquivo excede a franquia estrita de ${isSiteMode ? '512 MB' : '100 MB'}.`);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', zipFile);
      if (zipToken.trim()) {
        formData.append('token', zipToken.trim());
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha no upload');
      }

      if (isSiteMode && selectedSubdomain && data.botId) {
        linkSubdomainToInstance(selectedSubdomain, data.botId, name.trim() || selectedSubdomain);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setUploadError('Nome da instância é obrigatório.');
      return;
    }

    if (!isSiteMode && !token.trim()) {
      setUploadError('Token de autenticação é obrigatório para bots de Discord e Telegram.');
      return;
    }

    if (isSiteMode && !selectedSubdomain) {
      setUploadError('Para publicar um site você precisa registrar um subdomínio antes!');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await fetch('/api/bots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_name: name.trim(),
          platform,
          token: token.trim() || (isSiteMode ? `site-token-${Date.now()}` : ''),
          ram_limit_mb: isSiteMode ? 512 : Math.min(Number(ram) || 100, 100),
          main_file: mainFile.trim() || (isSiteMode ? 'index.html' : 'index.js'),
          config_type: isSiteMode ? 'site' : configType,
          assigned_node: isSiteMode ? 'aethel-edge-web' : 'farol-alpha',
          subdomain: isSiteMode ? selectedSubdomain : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao cadastrar instância.');
      }

      if (isSiteMode && selectedSubdomain && data.bot_id) {
        linkSubdomainToInstance(selectedSubdomain, data.bot_id, name.trim());
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="apple-glass-card w-full max-w-xl max-h-[92vh] overflow-y-auto custom-scrollbar rounded-[32px] border border-white/15 shadow-[0_20px_70px_rgba(0,0,0,0.85)] animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-white/20">
              <UploadCloud className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">Novo Deploy na Malha Aethel Kov</h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                {isSiteMode ? 'Aplicação Web / Site com 512 MB de RAM' : 'Bot 24/7 com 100 MB via Farol'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/40 font-mono text-xs">
          <button
            onClick={() => { setActiveTab('manual'); setUploadError(null); }}
            className={`flex-1 py-3 font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Configuração Rápida</span>
          </button>

          <button
            onClick={() => { setActiveTab('zip'); setUploadError(null); }}
            className={`flex-1 py-3 font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'zip'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload de ZIP</span>
          </button>
        </div>

        {/* Error Alert */}
        {uploadError && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="p-6">
          {activeTab === 'zip' ? (
            /* ========================================================
               TAB 1: UPLOAD DE ZIP
               ======================================================== */
            <form onSubmit={handleZipUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Selecione a Plataforma / Tipo de Instância
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPlatform('DISCORD');
                      setRam(100);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      platform === 'DISCORD'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                        : 'bg-black/30 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold text-xs block">🤖 Bot Discord/Telegram</span>
                    <span className="text-[10px] font-mono text-neutral-400">100 MB via Farol Discloud</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlatform('SITE');
                      setRam(512);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      platform === 'SITE'
                        ? 'bg-cyan-500/15 border-cyan-400/40 text-white'
                        : 'bg-black/30 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold text-xs block">🌐 Site Web / Proxy</span>
                    <span className="text-[10px] font-mono text-cyan-300">512 MB Dedicada + SSL</span>
                  </button>
                </div>
              </div>

              {/* Se for Site Web, exige selecionar o subdomínio */}
              {isSiteMode && (
                <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 space-y-2">
                  <span className="text-xs font-mono font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Subdomínio Obrigatório do Site</span>
                  </span>

                  {userSubdomains.length === 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-rose-300 font-mono">
                        ⚠️ Você ainda não registrou nenhum subdomínio para seu site!
                      </p>
                      {onGoToSubdomains && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onGoToSubdomains();
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 text-black font-semibold text-xs font-mono"
                        >
                          <span>Registrar Subdomínio Agora</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <select
                      value={selectedSubdomain}
                      onChange={(e) => setSelectedSubdomain(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                    >
                      {userSubdomains.map((s) => (
                        <option key={s.id} value={s.subdomain}>
                          /sites/{s.subdomain} (512 MB Dedicada)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Arquivo do Pacote (.zip)
                </label>
                <div className="relative border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-6 text-center transition-colors bg-black/40">
                  <input
                    type="file"
                    accept=".zip"
                    required
                    onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="w-8 h-8 text-cyan-400" />
                    <span className="text-xs text-neutral-300 font-mono">
                      {zipFile ? zipFile.name : 'Arraste o arquivo ZIP ou clique para escolher'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {isSiteMode ? 'Cota: Pasta inteira até 512 MB' : 'Cota: Pacote até 100 MB'}
                    </span>
                  </div>
                </div>
              </div>

              {!isSiteMode && (
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">
                    Token de Autenticação (Opcional se já estiver no .env do ZIP)
                  </label>
                  <input
                    type="password"
                    value={zipToken}
                    onChange={(e) => setZipToken(e.target.value)}
                    placeholder="Token do bot..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-2xl text-xs font-mono text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (isSiteMode && userSubdomains.length === 0)}
                  className="apple-pill-btn apple-pill-primary px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isUploading ? 'Fazendo Deploy...' : isSiteMode && userSubdomains.length === 0 ? 'Cadastre um Subdomínio Primeiro' : 'Iniciar Deploy na Malha'}
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================
               TAB 2: CONFIGURAÇÃO RÁPIDA MANUAL
               ======================================================== */
            <form onSubmit={handleManualCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">Nome da Instância</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isSiteMode ? 'meu-site-web' : 'meu-bot-discord'}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">Plataforma / Modo</label>
                  <select
                    value={platform}
                    onChange={(e) => {
                      const next = e.target.value as BotPlatform;
                      setPlatform(next);
                      if (next === 'SITE') {
                        setRam(512);
                        setMainFile('index.html');
                        setConfigType('site');
                      } else {
                        setRam(100);
                        setMainFile('index.js');
                        setConfigType('aethel');
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="DISCORD">Discord Bot (100 MB via Farol)</option>
                    <option value="TELEGRAM">Telegram Bot (100 MB via Farol)</option>
                    <option value="SITE">🌐 Site Web / Proxy (512 MB Dedicada)</option>
                  </select>
                </div>
              </div>

              {/* SEÇÃO OBRIGATÓRIA DE SUBDOMÍNIO PARA SITES */}
              {isSiteMode && (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 space-y-2">
                  <span className="text-xs font-mono font-semibold text-cyan-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Subdomínio Obrigatório do Site</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> SSL Automático
                    </span>
                  </span>

                  {userSubdomains.length === 0 ? (
                    <div className="space-y-2 pt-1">
                      <p className="text-xs text-rose-300 font-mono">
                        ⚠️ Você não possui nenhum subdomínio registrado. Para publicar um site, registre um subdomínio primeiro!
                      </p>
                      {onGoToSubdomains && (
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onGoToSubdomains();
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs font-mono transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Ir para Aba Subdomínios & Criar</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <select
                        value={selectedSubdomain}
                        onChange={(e) => setSelectedSubdomain(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                      >
                        {userSubdomains.map((s) => (
                          <option key={s.id} value={s.subdomain}>
                            /sites/{s.subdomain} (512 MB Dedicada)
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-neutral-400 font-mono">
                        Sua aplicação responderá mundialmente sob este link 24/7.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!isSiteMode ? (
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">Token de Autenticação</label>
                  <input
                    type="password"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Token do Discord ou Telegram..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">
                    Chave Secreta ou Token de API (Opcional para sites públicos)
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Chave secreta interna ou deixe vazio..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">Arquivo Main</label>
                  <input
                    type="text"
                    value={mainFile}
                    onChange={(e) => setMainFile(e.target.value)}
                    placeholder={isSiteMode ? 'index.html' : 'index.js'}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">
                    RAM ({isSiteMode ? '512 MB Dedicada' : 'Máx 100 MB'})
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                    <span>{isSiteMode ? '512 MB' : `${ram} MB`}</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-mono text-neutral-300 mb-1">Formato</label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-neutral-300 text-xs font-mono">
                    <span>{isSiteMode ? 'aethel (type=site)' : 'aethel.config'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-2xl text-xs font-mono text-neutral-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (isSiteMode && userSubdomains.length === 0)}
                  className="apple-pill-btn apple-pill-primary px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isUploading ? 'Criando...' : isSiteMode && userSubdomains.length === 0 ? 'Cadastre um Subdomínio Primeiro' : 'Registrar Instância'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
