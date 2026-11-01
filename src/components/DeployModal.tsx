'use client';

import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileCode, 
  AlertCircle, 
  Bot, 
  Send,
  HardDrive
} from 'lucide-react';
import { BotPlatform } from '@/lib/types';

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
  const [activeTab, setActiveTab] = useState<'zip' | 'manual'>('manual');
  
  // ZIP Upload States
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipToken, setZipToken] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Manual States
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<BotPlatform>('DISCORD');
  const [token, setToken] = useState('');
  const [ram, setRam] = useState(100);
  const [mainFile, setMainFile] = useState('index.js');
  const [configType, setConfigType] = useState<'aethel' | 'discloud'>('aethel');

  if (!isOpen) return null;

  const handleZipUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zipFile) {
      setUploadError('Por favor selecione um arquivo ZIP para upload.');
      return;
    }

    const maxLimitBytes = 100 * 1024 * 1024;
    if (zipFile.size > maxLimitBytes) {
      setUploadError('Arquivo excede a franquia estrita de 100 MB da infraestrutura.');
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
              <h3 className="text-base sm:text-lg font-bold text-white">Novo Deploy de Bot</h3>
              <p className="text-[11px] text-neutral-400 font-mono">
                Hospedagem 24/7 de bots com 100 MB via Farol Discloud
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
                  Plataforma do Bot
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
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5 text-emerald-400" /> Discord Bot
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">100 MB via Farol</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPlatform('TELEGRAM');
                      setRam(100);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      platform === 'TELEGRAM'
                        ? 'bg-cyan-500/15 border-cyan-400/40 text-white'
                        : 'bg-black/30 border-white/10 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <span className="font-semibold text-xs flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5 text-cyan-400" /> Telegram Bot
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">100 MB via Farol</span>
                  </button>
                </div>
              </div>

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
                      Cota estrita: até 100 MB por instância
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-300 mb-1">
                  Token do Bot (Opcional se já estiver no .env do ZIP)
                </label>
                <input
                  type="password"
                  value={zipToken}
                  onChange={(e) => setZipToken(e.target.value)}
                  placeholder="Token do bot..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
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
                  className="apple-pill-btn apple-pill-primary px-5 py-2.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {isUploading ? 'Fazendo Deploy...' : 'Iniciar Deploy na Malha'}
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
                  <label className="block text-xs font-mono text-neutral-300 mb-1">Plataforma</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as BotPlatform)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="DISCORD">Discord Bot (100 MB via Farol)</option>
                    <option value="TELEGRAM">Telegram Bot (100 MB via Farol)</option>
                  </select>
                </div>
              </div>

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
