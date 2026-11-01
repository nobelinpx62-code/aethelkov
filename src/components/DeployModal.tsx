'use client';

import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileCode, 
  AlertCircle, 
  Bot, 
  Send,
  HardDrive,
  CheckCircle2,
  Sparkles,
  Key,
  ShieldCheck
} from 'lucide-react';
import { BotPlatform } from '@/lib/types';
import { inspectZipBot, detectPlatformFromToken, InspectedBotData } from '@/lib/botInspector';
import JSZip from 'jszip';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess 
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'manual'>('zip');
  
  // ZIP Upload States
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipToken, setZipToken] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [inspectedData, setInspectedData] = useState<InspectedBotData | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);

  // Manual States
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<BotPlatform>('DISCORD');
  const [token, setToken] = useState('');
  const [ram, setRam] = useState(100);
  const [mainFile, setMainFile] = useState('index.js');
  const [configType, setConfigType] = useState<'aethel' | 'discloud'>('aethel');

  if (!isOpen) return null;

  // Auto-inspeção imediata do arquivo ZIP no navegador
  const handleFileChange = async (file: File | null) => {
    setZipFile(file);
    setUploadError(null);
    setInspectedData(null);

    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setUploadError('O arquivo excede o limite de 100 MB da franquia.');
      return;
    }

    setIsInspecting(true);
    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const inspected = await inspectZipBot(zip, zipToken);
      setInspectedData(inspected);
      if (inspected.token && !zipToken) {
        setZipToken(inspected.token);
      }
    } catch (err: any) {
      console.warn('[DeployModal] Falha ao inspecionar ZIP:', err);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleZipUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      setUploadError('Por favor selecione um arquivo ZIP para upload.');
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

      onSuccess();
      onClose();
    } catch (err: any) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleManualTokenChange = (val: string) => {
    setToken(val);
    const detected = detectPlatformFromToken(val);
    setPlatform(detected);
  };

  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setUploadError('Nome da instância é obrigatório.');
      return;
    }

    if (!token.trim()) {
      setUploadError('Token de autenticação do bot é obrigatório.');
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
          token: token.trim(),
          ram_limit_mb: Math.min(Number(ram) || 100, 100),
          main_file: mainFile.trim() || 'index.js',
          config_type: configType,
          assigned_node: 'farol-alpha',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao cadastrar instância.');
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
              <h3 className="text-base sm:text-lg font-bold text-white">Deploy Inteligente de Bots</h3>
              <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Auto-detecção ativa de Telegram & Discord</span>
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
            onClick={() => { setActiveTab('zip'); setUploadError(null); }}
            className={`flex-1 py-3 font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'zip'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload de ZIP (Automático)</span>
          </button>

          <button
            onClick={() => { setActiveTab('manual'); setUploadError(null); }}
            className={`flex-1 py-3 font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Configuração Manual</span>
          </button>
        </div>

        {/* Error Alert */}
        {uploadError && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        <div className="p-6">
          {activeTab === 'zip' ? (
            /* ========================================================
               TAB 1: UPLOAD DE ZIP COM AUTO-DETECÇÃO
               ======================================================== */
            <form onSubmit={handleZipUpload} className="space-y-4">
              {/* Área de Seleção de Arquivo */}
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Selecione o arquivo ZIP do seu Bot
                </label>
                <div className="relative border-2 border-dashed border-white/15 hover:border-cyan-400/50 rounded-2xl p-6 text-center transition-colors bg-black/40">
                  <input
                    type="file"
                    accept=".zip"
                    required
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UploadCloud className="w-8 h-8 text-cyan-400" />
                    <span className="text-xs text-neutral-200 font-mono font-medium">
                      {zipFile ? zipFile.name : 'Arraste o arquivo ZIP ou clique para escolher'}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Cota estrita: até 100 MB • Aceita discloud.config, aethel.config ou package.json
                    </span>
                  </div>
                </div>
              </div>

              {/* CARD DE AUTO-DETECÇÃO INTELIGENTE (QUANDO O ZIP É SELECIONADO) */}
              {isInspecting ? (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 font-mono text-xs text-cyan-300 flex items-center gap-3 animate-pulse">
                  <Sparkles className="w-5 h-5 animate-spin" />
                  <span>Analisando arquivos do ZIP e procurando tokens...</span>
                </div>
              ) : inspectedData ? (
                <div className="p-4 rounded-2xl bg-black/50 border border-white/15 space-y-3 font-mono text-xs animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Diagnóstico Automático da Aplicação</span>
                    </span>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> 100% Compatível
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Plataforma Detectada */}
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                      {inspectedData.platform === 'TELEGRAM' ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                          <Send className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Plataforma</span>
                        <span className={`font-bold ${inspectedData.platform === 'TELEGRAM' ? 'text-cyan-300' : 'text-emerald-400'}`}>
                          {inspectedData.platform === 'TELEGRAM' ? '🤖 Telegram Bot' : '🤖 Discord Bot'}
                        </span>
                      </div>
                    </div>

                    {/* Token Status */}
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                        <Key className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-[10px] text-neutral-400 block">Token</span>
                        {inspectedData.token ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{inspectedData.token.slice(0, 7)}•••••••</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold">Informe abaixo</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-neutral-400 space-y-0.5 pt-1">
                    <div>
                      <strong>Nome:</strong> <span className="text-white">{inspectedData.name}</span> • <strong>Main:</strong> <span className="text-white">{inspectedData.mainFile}</span>
                    </div>
                    <div className="text-[10px] text-cyan-400">
                      ℹ️ {inspectedData.detectionDetails.platformReason}
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Campo de Token: Auto-preenchido se detectado, ou manual se o arquivo não tiver */}
              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1 flex items-center justify-between">
                  <span>Token do Bot</span>
                  {inspectedData?.token && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Token extraído do projeto
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={zipToken}
                  onChange={(e) => setZipToken(e.target.value)}
                  placeholder="Token do Telegram ou Discord (extraído automaticamente do ZIP)"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                  Se o token já estiver no código (.js, .py, grammy, telegraf ou .env), o sistema detecta sozinho!
                </span>
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
                  disabled={isUploading || !zipFile}
                  className="apple-pill-btn apple-pill-primary px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>Fazendo Deploy...</span>
                    </>
                  ) : (
                    <span>Iniciar Deploy na Malha</span>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ========================================================
               TAB 2: CONFIGURAÇÃO MANUAL COM AUTO-DETECÇÃO DE PLATAFORMA
               ======================================================== */
            <form onSubmit={handleManualCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">Nome do Bot</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="meu-bot"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">
                    Plataforma (Auto-detectada pelo Token)
                  </label>
                  <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono">
                    {platform === 'TELEGRAM' ? (
                      <span className="text-cyan-300 flex items-center gap-1.5 font-semibold">
                        <Send className="w-3.5 h-3.5" /> Telegram Bot
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                        <Bot className="w-3.5 h-3.5" /> Discord Bot
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Token de Autenticação (@BotFather ou Discord Developer Portal)
                </label>
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => handleManualTokenChange(e.target.value)}
                  placeholder="Cole seu token aqui..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-neutral-500 font-mono mt-1 block">
                  Tokens no formato Telegram (ex: <code>123456789:AA...</code>) são identificados automaticamente.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">Arquivo Main</label>
                  <input
                    type="text"
                    value={mainFile}
                    onChange={(e) => setMainFile(e.target.value)}
                    placeholder="index.js"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-neutral-300 mb-1">
                    RAM (Máx 100 MB)
                  </label>
                  <div className="flex items-center px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono">
                    <HardDrive className="w-3.5 h-3.5 text-cyan-400 mr-2 shrink-0" />
                    <span>{ram} MB</span>
                  </div>
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-mono text-neutral-300 mb-1">Formato</label>
                  <select
                    value={configType}
                    onChange={(e) => setConfigType(e.target.value as 'aethel' | 'discloud')}
                    className="w-full px-3 py-2 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="aethel">aethel.config</option>
                    <option value="discloud">discloud.config</option>
                  </select>
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
                  disabled={isUploading}
                  className="apple-pill-btn apple-pill-primary px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isUploading ? 'Criando...' : 'Registrar Instância'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
