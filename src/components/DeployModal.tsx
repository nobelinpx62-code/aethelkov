'use client';

import React, { useState } from 'react';
import { X, UploadCloud, FileCode, CheckCircle2, AlertCircle, Bot, Send } from 'lucide-react';
import { BotPlatform } from '@/lib/types';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'manual'>('zip');
  
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

    if (zipFile.size > 100 * 1024 * 1024) {
      setUploadError('Arquivo excede a franquia estrita de 100 MB.');
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
    if (!name.trim() || !token.trim()) {
      setUploadError('Nome e Token são obrigatórios.');
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
        throw new Error(data.error || 'Falha ao cadastrar bot.');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="liquid-glass w-full max-w-xl rounded-3xl overflow-hidden border border-white/10 shadow-2xl animate-subtle-float">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">Novo Deploy de Instância</h3>
            <p className="text-xs text-slate-400">Deploy simplificado via aethel.config</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/10 bg-black/30">
          <button
            onClick={() => { setActiveTab('zip'); setUploadError(null); }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'zip'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload ZIP (100 MB Cota)</span>
          </button>
          <button
            onClick={() => { setActiveTab('manual'); setUploadError(null); }}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'manual'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Config Manual</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {uploadError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {activeTab === 'zip' ? (
            <form onSubmit={handleZipUpload} className="space-y-4">
              <div className="border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-2xl p-6 text-center transition-colors bg-black/20">
                <input
                  type="file"
                  id="zip-upload"
                  accept=".zip"
                  onChange={(e) => setZipFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="zip-upload" className="cursor-pointer block">
                  <UploadCloud className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium text-white">
                    {zipFile ? zipFile.name : 'Clique para selecionar o arquivo .zip'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {zipFile
                      ? `${(zipFile.size / (1024 * 1024)).toFixed(2)} MB`
                      : 'Pacote ZIP com aethel.config (Máx 100 MB)'}
                  </p>
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Token do Bot (Opcional se já estiver no config)
                </label>
                <input
                  type="password"
                  value={zipToken}
                  onChange={(e) => setZipToken(e.target.value)}
                  placeholder="Bot token Discord ou Telegram..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="capsule-btn capsule-btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="capsule-btn capsule-btn-primary text-xs"
                >
                  {isUploading ? 'Fazendo Deploy...' : 'Iniciar Deploy na Malha'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleManualCreate} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome da Instância</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="meu-bot"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Plataforma</label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as BotPlatform)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DISCORD">Discord</option>
                    <option value="TELEGRAM">Telegram</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Token de Autenticação</label>
                <input
                  type="password"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Token seguro..."
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Arquivo Main</label>
                  <input
                    type="text"
                    value={mainFile}
                    onChange={(e) => setMainFile(e.target.value)}
                    placeholder="index.js"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">RAM (Máx 100 MB)</label>
                  <input
                    type="number"
                    max={100}
                    min={25}
                    value={ram}
                    onChange={(e) => setRam(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Formato Config</label>
                  <select
                    value={configType}
                    onChange={(e) => setConfigType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="aethel">aethel.config</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="capsule-btn capsule-btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="capsule-btn capsule-btn-primary text-xs"
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

