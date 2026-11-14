'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { BotPlatform, AethelBot } from '@/lib/types';
import { inspectZipBot, detectPlatformFromToken, InspectedBotData } from '@/lib/botInspector';
import JSZip from 'jszip';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingBots?: AethelBot[];
  totalQuotaMb?: number;
}

export const DeployModal: React.FC<DeployModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  existingBots = [],
  totalQuotaMb = 100,
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'manual'>('zip');
  
  // ZIP Upload States
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipToken, setZipToken] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [inspectedData, setInspectedData] = useState<InspectedBotData | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [customEnv, setCustomEnv] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');
  const [showEnvSection, setShowEnvSection] = useState(false);

  // Manual States
  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<BotPlatform>('DISCORD');
  const [token, setToken] = useState('');
  const [ram, setRam] = useState(100);
  const [mainFile, setMainFile] = useState('index.js');
  const [configType, setConfigType] = useState<'aethel' | 'discloud'>('aethel');

  // Validação de cota de memória RAM: cada aplicação reserva no mínimo 100 MB
  const currentReservedRam = existingBots.reduce(
    (sum, b) => sum + Math.max(b.ram_limit_mb || 100, 100),
    0
  );
  const isQuotaExceeded = currentReservedRam >= totalQuotaMb;

  // Função central para resetar todo o formulário (sem resquícios de deploys anteriores)
  const resetState = () => {
    setZipFile(null);
    setZipToken('');
    setIsUploading(false);
    setUploadError(null);
    setInspectedData(null);
    setIsInspecting(false);
    setCustomEnv({});
    setNewEnvKey('');
    setNewEnvVal('');
    setShowEnvSection(false);
    setName('');
    setPlatform('DISCORD');
    setToken('');
    setRam(100);
    setMainFile('index.js');
    setConfigType('aethel');
    setActiveTab('zip');
    setFileInputKey((k) => k + 1);
  };

  // Garante que a cada abertura do modal, todos os dados estejam 100% limpos
  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetState();
    onClose();
  };

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
      if (inspected.detectedEnvVars && Object.keys(inspected.detectedEnvVars).length > 0) {
        setCustomEnv((prev) => ({ ...inspected.detectedEnvVars, ...prev }));
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
      if (Object.keys(customEnv).length > 0) {
        formData.append('env', JSON.stringify(customEnv));
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha no upload');
      }

      // Salva os arquivos extraídos no localStorage para que o Editor abra com o código real
      if (data.botId && zipFile) {
        try {
          const buffer = await zipFile.arrayBuffer();
          const zip = await JSZip.loadAsync(buffer);
          const extractedFiles: Record<string, string> = {};
          for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
            if (!zipEntry.dir && !relativePath.includes('node_modules') && !relativePath.includes('.git')) {
              try {
                extractedFiles[relativePath] = await zipEntry.async('string');
              } catch (_) {}
            }
          }
          if (Object.keys(extractedFiles).length > 0) {
            localStorage.setItem(`aethel_bot_files_${data.botId}`, JSON.stringify(extractedFiles));
          }
        } catch (zipErr) {
          console.warn('[DeployModal] Falha ao extrair arquivos para o editor:', zipErr);
        }
      }

      resetState();
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

      resetState();
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
            onClick={handleClose}
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

        {/* Alerta de Cota Esgotada (Máx 1 Aplicação com 100 MB de RAM) */}
        {isQuotaExceeded && (
          <div className="mx-6 mt-4 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono space-y-2 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>LIMITE DE COTA DE MEMÓRIA ATINGIDO ({currentReservedRam} MB / {totalQuotaMb} MB)</span>
            </div>
            <p className="text-neutral-300 leading-relaxed">
              O consumo mínimo por aplicação é de <strong>100 MB</strong> (definido no <code>aethel.config</code> e <code>discloud.config</code>). 
              Como sua cota é de <strong>{totalQuotaMb} MB</strong>, os 100 MB já estão <strong>100% reservados</strong> para sua aplicação atual:
            </p>
            <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 text-[11px] text-neutral-300 space-y-1">
              {existingBots.map((b) => (
                <div key={b.id} className="flex items-center justify-between">
                  <span className="font-semibold text-white">&bull; {b.bot_name}</span>
                  <span className="text-cyan-300 font-semibold">{Math.max(b.ram_limit_mb || 100, 100)} MB Reservados</span>
                </div>
              ))}
            </div>
            <p className="text-neutral-400 text-[11px]">
              Para criar uma nova aplicação, você precisa primeiro <strong>excluir a aplicação existente</strong> através das opções da instância.
            </p>
          </div>
        )}

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
                    key={fileInputKey}
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

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                          {inspectedData.platform === 'TELEGRAM' ? 'Telegram' : 'Discord'}
                        </span>
                      </div>
                    </div>

                    {/* Linguagem Detectada */}
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 font-bold">
                        {inspectedData.language === 'python' ? '🐍' : inspectedData.language === 'java' ? '☕' : '🟨'}
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 block">Linguagem</span>
                        <span className="font-bold text-amber-300 uppercase">
                          {inspectedData.language === 'python' ? 'Python' : inspectedData.language === 'java' ? 'Java' : 'Node.js'}
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

                  {/* Badges de Recursos Detectados */}
                  {inspectedData.detectionDetails.detectedFeatures?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {inspectedData.detectionDetails.detectedFeatures.map((feat, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-[10px] text-cyan-300 font-semibold">
                          ✨ {feat}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-neutral-400 space-y-0.5 pt-1">
                    <div>
                      <strong>Nome:</strong> <span className="text-white">{inspectedData.name}</span> • <strong>Arquivo Principal:</strong> <span className="text-white">{inspectedData.mainFile}</span>
                    </div>
                    <div className="text-[10px] text-emerald-400">
                      {inspectedData.hasDiscloudConfig
                        ? '✅ discloud.config detectado no pacote.'
                        : '⚡ discloud.config será gerado automaticamente pela plataforma.'}
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

              {/* Seção de Variáveis de Ambiente (.env) para APIs, Vendas Pix, OpenAI, etc. */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2.5 font-mono text-xs">
                <div 
                  onClick={() => setShowEnvSection(!showEnvSection)} 
                  className="flex items-center justify-between cursor-pointer select-none text-neutral-300 hover:text-white"
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Variáveis de Ambiente (.env) • APIs, Pix, OpenAI ({Object.keys(customEnv).length})</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-bold">{showEnvSection ? '▲ Ocultar' : '▼ Configurar'}</span>
                </div>

                {showEnvSection && (
                  <div className="space-y-2 pt-2 border-t border-white/10 animate-fadeIn">
                    <p className="text-[10px] text-neutral-400">
                      Configure tokens de terceiros (ex: <code>OPENAI_API_KEY</code>, <code>MERCADOPAGO_TOKEN</code>, etc.).
                    </p>

                    {/* Lista de variáveis configuradas */}
                    {Object.entries(customEnv).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-[11px]">
                        <span className="text-cyan-300 font-semibold truncate max-w-[45%]">{k}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-neutral-400 truncate max-w-[120px] font-mono">••••••••••</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = { ...customEnv };
                              delete updated[k];
                              setCustomEnv(updated);
                            }}
                            className="p-1 text-rose-400 hover:text-rose-300 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Formulário para adicionar nova variável */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="NOME_DA_VARIAVEL"
                        value={newEnvKey}
                        onChange={(e) => setNewEnvKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-[11px] font-mono focus:border-cyan-400 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Valor do segredo"
                        value={newEnvVal}
                        onChange={(e) => setNewEnvVal(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-[11px] font-mono focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newEnvKey.trim()) {
                            setCustomEnv((prev) => ({ ...prev, [newEnvKey.trim()]: newEnvVal.trim() }));
                            setNewEnvKey('');
                            setNewEnvVal('');
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 text-[11px] font-semibold hover:bg-cyan-500/30"
                      >
                        + Adicionar
                      </button>
                    </div>
                  </div>
                )}
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
                  disabled={isUploading || isQuotaExceeded || !zipFile}
                  className={`apple-pill-btn apple-pill-primary px-5 py-2.5 text-xs font-semibold text-white flex items-center gap-2 ${
                    isQuotaExceeded || !zipFile ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isQuotaExceeded ? (
                    <span>Cota Esgotada (100 MB Reservados)</span>
                  ) : isUploading ? (
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
                  disabled={isUploading || isQuotaExceeded}
                  className={`apple-pill-btn apple-pill-primary px-5 py-2.5 text-xs font-semibold text-white ${
                    isQuotaExceeded ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isQuotaExceeded
                    ? 'Cota Esgotada (100 MB Reservados)'
                    : isUploading
                    ? 'Criando...'
                    : 'Registrar Instância'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
