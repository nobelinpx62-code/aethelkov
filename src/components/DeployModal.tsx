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
  Trash2, 
  Globe,
  ArrowRight,
  ArrowLeft,
  Terminal,
  Cpu,
  Layers,
  Check,
  ExternalLink,
  Plus,
  RefreshCw,
  FolderArchive
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

type WizardStep = 1 | 2 | 3 | 4 | 5;

export const DeployModal: React.FC<DeployModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  existingBots = [],
  totalQuotaMb = 100,
}) => {
  // Controle de Etapas do Assistente em Tela Cheia
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isDragging, setIsDragging] = useState(false);

  // Estados de Upload & Inspeção de Arquivos
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectedData, setInspectedData] = useState<InspectedBotData | null>(null);
  const [hasDetectedConfig, setHasDetectedConfig] = useState(false);
  const [detectedConfigName, setDetectedConfigName] = useState<'aethel.config' | 'discloud.config' | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);

  // Estados dos Parâmetros da Aplicação (Preenchidos pelo assistente ou extraídos da config)
  const [appName, setAppName] = useState('');
  const [appType, setAppType] = useState<'bot' | 'site'>('bot');
  const [subdomain, setSubdomain] = useState('');
  const [platform, setPlatform] = useState<BotPlatform>('DISCORD');
  const [language, setLanguage] = useState<'nodejs' | 'python' | 'java' | 'other'>('nodejs');
  const [ram, setRam] = useState(100);
  const [mainFile, setMainFile] = useState('index.js');
  const [token, setToken] = useState('');
  const [customEnv, setCustomEnv] = useState<Record<string, string>>({});
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');

  // Estados de Operação & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Cálculo de Cota de RAM: mínimo 100 MB por aplicação
  const currentReservedRam = existingBots.reduce(
    (sum, b) => sum + Math.max(b.ram_limit_mb || 100, 100),
    0
  );
  const availableRamForNewApp = Math.max(0, totalQuotaMb - currentReservedRam);
  const isQuotaExceeded = currentReservedRam >= totalQuotaMb;

  // Reseta todo o estado para nova sessão
  const resetAllState = () => {
    setCurrentStep(1);
    setIsDragging(false);
    setZipFile(null);
    setIsInspecting(false);
    setInspectedData(null);
    setHasDetectedConfig(false);
    setDetectedConfigName(null);
    setAppName('');
    setAppType('bot');
    setSubdomain('');
    setPlatform('DISCORD');
    setLanguage('nodejs');
    setRam(100);
    setMainFile('index.js');
    setToken('');
    setCustomEnv({});
    setNewEnvKey('');
    setNewEnvVal('');
    setIsSubmitting(false);
    setSubmitStatusText('');
    setErrorNotice(null);
    setFileInputKey((k) => k + 1);
  };

  useEffect(() => {
    if (isOpen) {
      resetAllState();
    }
  }, [isOpen]);

  // Fecha o modal ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // ========================================================
  // PROCESSAMENTO DO ARQUIVO ZIP COM AUTO-DETECÇÃO
  // ========================================================
  const handleProcessZip = async (file: File | null) => {
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      setErrorNotice('O arquivo excede o limite estrito de 100 MB da franquia.');
      return;
    }

    setZipFile(file);
    setErrorNotice(null);
    setIsInspecting(true);

    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const inspected = await inspectZipBot(zip);
      setInspectedData(inspected);

      // Aplica dados detectados aos estados
      if (inspected.name) setAppName(inspected.name);
      if (inspected.isSite) {
        setAppType('site');
        if (inspected.subdomain) setSubdomain(inspected.subdomain);
      } else {
        setAppType('bot');
        setPlatform(inspected.platform || 'DISCORD');
      }
      if (inspected.mainFile) setMainFile(inspected.mainFile);
      if (inspected.ramLimitMb) setRam(Math.max(100, inspected.ramLimitMb));
      if (inspected.language) setLanguage(inspected.language);
      if (inspected.token) setToken(inspected.token);
      if (inspected.detectedEnvVars && Object.keys(inspected.detectedEnvVars).length > 0) {
        setCustomEnv(inspected.detectedEnvVars);
      }

      // REGRA CENTRAL SOLICITADA PELO USUÁRIO:
      // Tenta achar aethel.config ou discloud.config:
      // Se achar, confirma imediatamente com resumo e deploy de 1 clique!
      // Se NÃO achar, abre automaticamente a tela manual em etapas!
      if (inspected.hasConfigFile) {
        setHasDetectedConfig(true);
        setDetectedConfigName(inspected.configFileName || 'aethel.config');
        setCurrentStep(1); // Fica no Step 1 mostrando o card verde comemorativo
      } else {
        setHasDetectedConfig(false);
        setDetectedConfigName(null);
        // Transição suave para o assistente passo a passo
        setTimeout(() => {
          setCurrentStep(2);
        }, 300);
      }
    } catch (err: any) {
      console.warn('[DeployStudio] Falha ao inspecionar ZIP:', err);
      setErrorNotice('Falha ao descompactar ou analisar o arquivo ZIP.');
    } finally {
      setIsInspecting(false);
    }
  };

  // Gerenciamento de drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleProcessZip(files[0]);
    }
  };

  // ========================================================
  // ENVIO FINAL (DEPLOY NA MALHA)
  // ========================================================
  const handleExecuteDeploy = async () => {
    if (!appName.trim()) {
      setErrorNotice('O nome da aplicação é obrigatório.');
      setCurrentStep(2);
      return;
    }

    if (appType === 'bot' && !token.trim()) {
      setErrorNotice('O token de autenticação do bot é obrigatório.');
      setCurrentStep(4);
      return;
    }

    let cleanSub = '';
    if (appType === 'site') {
      cleanSub = (subdomain.trim() || appName.trim()).toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (cleanSub.length < 3) {
        setErrorNotice('O subdomínio do site deve ter pelo menos 3 caracteres alfanuméricos.');
        setCurrentStep(2);
        return;
      }
    }

    setIsSubmitting(true);
    setErrorNotice(null);
    setSubmitStatusText('Preparando pacote da aplicação...');

    try {
      if (zipFile) {
        // Fluxo com arquivo ZIP
        setSubmitStatusText('Enviando arquivos e analisando integridade...');
        const formData = new FormData();
        formData.append('file', zipFile);
        if (token.trim()) formData.append('token', token.trim());
        formData.append('name', appName.trim());
        formData.append('type', appType);
        formData.append('ram', String(Math.max(100, ram)));
        formData.append('main', mainFile.trim() || (appType === 'site' ? 'index.html' : 'index.js'));
        formData.append('platform', appType === 'site' ? 'DISCORD' : platform);
        if (cleanSub) formData.append('subdomain', cleanSub);
        if (Object.keys(customEnv).length > 0) {
          formData.append('env', JSON.stringify(customEnv));
        }

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha no upload da aplicação.');

        // Salva arquivos extraídos no localStorage para o editor de código
        if (data.botId && zipFile) {
          try {
            const buffer = await zipFile.arrayBuffer();
            const zip = await JSZip.loadAsync(buffer);
            const extractedFiles: Record<string, string> = {};
            for (const [path, entry] of Object.entries(zip.files)) {
              if (!entry.dir && !path.includes('node_modules') && !path.includes('.git')) {
                try {
                  extractedFiles[path] = await entry.async('string');
                } catch (_) {}
              }
            }
            if (Object.keys(extractedFiles).length > 0) {
              localStorage.setItem(`aethel_bot_files_${data.botId}`, JSON.stringify(extractedFiles));
              if (appType === 'site' && cleanSub) {
                // Sincroniza também no storage de subdomínio
                await fetch(`/api/sites/${cleanSub}/save`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ files: extractedFiles, botId: data.botId }),
                }).catch(() => {});
              }
            }
          } catch (_) {}
        }
      } else {
        // Fluxo Manual (Sem ZIP inicial)
        setSubmitStatusText('Registrando nó na malha operacional...');
        const assignedNode = appType === 'site' ? `site:${cleanSub}` : 'farol-alpha';

        const res = await fetch('/api/bots', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bot_name: appName.trim(),
            platform: appType === 'site' ? 'DISCORD' : platform,
            token: appType === 'site' ? (token.trim() || `site:${cleanSub}`) : token.trim(),
            ram_limit_mb: Math.max(100, Math.min(ram, totalQuotaMb)),
            main_file: mainFile.trim() || (appType === 'site' ? 'index.html' : 'index.js'),
            config_type: 'aethel',
            assigned_node: assignedNode,
            app_type: appType,
            subdomain: appType === 'site' ? cleanSub : undefined,
            env_vars: Object.keys(customEnv).length > 0 ? customEnv : undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha ao registrar aplicação.');

        // Se for um Site Web criado manualmente, inicializa os arquivos HTML/CSS/JS automaticamente
        if (appType === 'site' && cleanSub) {
          const starterSiteFiles: Record<string, string> = {
            'index.html': `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName.trim()} • Aethelkov</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <div class="badge">🌐 SITE ONLINE</div>
    <h1>${appName.trim()}</h1>
    <p>Seu site está no ar com sucesso com subdomínio próprio e SSL na <strong>Aethelkov</strong>!</p>
    <button id="btnClick">Testar Interatividade</button>
    <div id="output"></div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
            'style.css': `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background: #06070a;
  color: #f5f5f7;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 28px;
  padding: 40px;
  max-width: 520px;
  width: 100%;
  text-align: center;
  backdrop-filter: blur(20px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
}
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 9999px;
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #34d399;
  font-size: 11px;
  font-family: monospace;
  font-weight: 600;
  margin-bottom: 16px;
}
h1 { font-size: 28px; font-weight: 800; margin-bottom: 12px; }
p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
button {
  background: #10b981;
  color: #000;
  border: none;
  padding: 12px 30px;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}
button:hover { background: #34d399; transform: scale(1.04); }
#output { margin-top: 18px; font-size: 13px; color: #38bdf8; font-family: monospace; }`,
            'script.js': `const btn = document.getElementById('btnClick');
const output = document.getElementById('output');
let count = 0;

btn?.addEventListener('click', () => {
  count++;
  output.textContent = '🎉 Botão acionado ' + count + ' vez(es)! JavaScript funcionando com perfeição.';
});`,
            'aethel.config': `NAME=${appName.trim()}\nTYPE=site\nMAIN=index.html\nSUBDOMAIN=${cleanSub}\n`,
          };

          if (data.bot_id) {
            localStorage.setItem(`aethel_bot_files_${data.bot_id}`, JSON.stringify(starterSiteFiles));
          }

          // Publica o ZIP inicial no storage do subdomínio
          await fetch(`/api/sites/${cleanSub}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ files: starterSiteFiles, botId: data.bot_id }),
          }).catch(() => {});
        }
      }

      setSubmitStatusText('Aplicação lançada com sucesso!');
      setTimeout(() => {
        resetAllState();
        onSuccess();
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorNotice(err.message || 'Erro durante o deploy.');
      setIsSubmitting(false);
    }
  };

  // Adicionar variável de ambiente
  const handleAddEnv = () => {
    if (!newEnvKey.trim()) return;
    const cleanKey = newEnvKey.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    setCustomEnv((prev) => ({
      ...prev,
      [cleanKey]: newEnvVal.trim(),
    }));
    setNewEnvKey('');
    setNewEnvVal('');
  };

  const handleRemoveEnv = (keyToRemove: string) => {
    setCustomEnv((prev) => {
      const copy = { ...prev };
      delete copy[keyToRemove];
      return copy;
    });
  };

  // Preview formatado de aethel.config
  const generatedAethelConfigText = [
    `# Aethelkov Runtime Configuration`,
    `NAME=${appName.trim() || 'minha-aplicacao'}`,
    `TYPE=${appType}`,
    `MAIN=${mainFile.trim() || (appType === 'site' ? 'index.html' : 'index.js')}`,
    `RAM=${Math.max(100, ram)}`,
    appType === 'site' 
      ? `SUBDOMAIN=${(subdomain.trim() || appName.trim()).toLowerCase().replace(/[^a-z0-9-]/g, '') || 'meusite'}`
      : `PLATFORM=${platform}`,
    `AUTORESTART=true`,
    `VERSION=latest`,
  ].join('\n');

  // Breadcrumbs dos Passos
  const stepLabels = [
    { num: 1, name: 'Arquivos & Detecção' },
    { num: 2, name: 'Identidade & Tipo' },
    { num: 3, name: 'Runtime & RAM' },
    { num: 4, name: 'Inicialização & Tokens' },
    { num: 5, name: 'Revisão & Lançar' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#07080d]/98 backdrop-blur-3xl text-white overflow-hidden animate-fadeIn select-none">
      {/* ========================================================
          BARRA SUPERIOR (APPLE STUDIO HEADER)
          ======================================================== */}
      <header className="flex-shrink-0 h-16 sm:h-20 border-b border-white/10 px-4 sm:px-8 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-emerald-500/20 to-indigo-500/20 border border-white/20 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <Layers className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Aethelkov Studio
              </h2>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-400/30">
                PRO HOSTING
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono hidden sm:block">
              Hospedagem inteligente de Bots (Discord/Telegram) e Sites Web com Subdomínio
            </p>
          </div>
        </div>

        {/* Stepper no Desktop */}
        <div className="hidden lg:flex items-center gap-2 font-mono text-xs">
          {stepLabels.map((s, idx) => {
            const isDone = currentStep > s.num;
            const isCurrent = currentStep === s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  onClick={() => {
                    if (s.num <= currentStep || zipFile || appName) {
                      setCurrentStep(s.num as WizardStep);
                    }
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                    isCurrent
                      ? 'bg-white/15 text-white font-semibold border border-white/20 shadow-sm'
                      : isDone
                      ? 'text-emerald-400 hover:text-white'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-cyan-400 text-black shadow-[0_0_10px_#22d3ee]'
                        : isDone
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                        : 'bg-white/5 text-neutral-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3 h-3" /> : s.num}
                  </span>
                  <span>{s.name}</span>
                </button>
                {idx < stepLabels.length - 1 && (
                  <div className={`w-4 h-[1px] ${isDone ? 'bg-emerald-500/50' : 'bg-white/10'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Botão Fechar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white font-mono text-xs transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>
      </header>

      {/* Indicador de Progresso Mobile */}
      <div className="lg:hidden border-b border-white/10 bg-black/60 px-4 py-2.5 flex items-center justify-between font-mono text-xs">
        <span className="text-neutral-400">
          Etapa <strong className="text-white">{currentStep}</strong> de 5
        </span>
        <span className="text-cyan-300 font-semibold truncate max-w-[200px]">
          {stepLabels[currentStep - 1]?.name}
        </span>
      </div>

      {/* ========================================================
          CORPO PRINCIPAL COM CONTEÚDO EM ETAPAS
          ======================================================== */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-8 flex flex-col items-center">
        <div className="w-full max-w-3xl flex-1 flex flex-col justify-center">

          {/* ALERTA DE COTA ESGOTADA */}
          {isQuotaExceeded && (
            <div className="mb-6 p-4 rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>LIMITE DE COTA ATINGIDO ({currentReservedRam} MB / {totalQuotaMb} MB RESERVADOS)</span>
              </div>
              <p className="text-neutral-300">
                O consumo mínimo por aplicação é de <strong>100 MB</strong>. Sua cota contratada é de <strong>{totalQuotaMb} MB</strong> e já está 100% alocada para as aplicações existentes.
              </p>
              <p className="text-neutral-400 text-[11px]">
                Para hospedar novos bots ou sites, exclua uma instância existente ou adquira mais memória na aba <strong>Planos & Assinaturas</strong>.
              </p>
            </div>
          )}

          {/* ALERTA DE ERRO */}
          {errorNotice && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <strong className="block text-white font-semibold mb-0.5">Aviso de Operação</strong>
                <span>{errorNotice}</span>
              </div>
            </div>
          )}

          {/* ========================================================
              ETAPA 1: UPLOAD DE ARQUIVO & AUTO-DETECÇÃO DE CONFIG
              ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Hospede sua Aplicação na Malha Aethelkov
                </h1>
                <p className="text-sm text-neutral-400 max-w-lg mx-auto">
                  Envie o código do seu projeto em arquivo ZIP. Procuraremos automaticamente por <code className="text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded">aethel.config</code> ou <code className="text-cyan-300 bg-white/5 px-1.5 py-0.5 rounded">discloud.config</code>.
                </p>
              </div>

              {/* SE ENCONTROU CONFIG: CARD VERDE COMEMORATIVO */}
              {hasDetectedConfig && inspectedData ? (
                <div className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/40 space-y-5 animate-fadeIn shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                  <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-sm block">
                          Arquivo de Configuração Detectado com Sucesso!
                        </span>
                        <span className="text-[11px] font-mono text-emerald-300">
                          Identificado via <strong className="text-white">{detectedConfigName}</strong>
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                      100% PRONTO
                    </span>
                  </div>

                  {/* Resumo dos parâmetros extraídos */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                      <span className="text-[10px] text-neutral-400 block mb-1">NOME</span>
                      <strong className="text-white text-sm truncate block">{appName}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                      <span className="text-[10px] text-neutral-400 block mb-1">TIPO</span>
                      <strong className="text-cyan-300 text-sm block">
                        {appType === 'site' ? 'SITE WEB' : platform}
                      </strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                      <span className="text-[10px] text-neutral-400 block mb-1">ARQUIVO MAIN</span>
                      <strong className="text-white text-sm truncate block">{mainFile}</strong>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                      <span className="text-[10px] text-neutral-400 block mb-1">MEMÓRIA RAM</span>
                      <strong className="text-emerald-400 text-sm block">{ram} MB</strong>
                    </div>
                  </div>

                  {/* Subdomínio do site se aplicável */}
                  {appType === 'site' && (
                    <div className="p-3 rounded-2xl bg-black/50 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                      <span className="text-neutral-300 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <span>Subdomínio Atribuído:</span>
                      </span>
                      <span className="font-bold text-white bg-emerald-500/20 px-3 py-1 rounded-lg border border-emerald-500/30 select-all">
                        https://{subdomain || appName}.linkthelkov.online
                      </span>
                    </div>
                  )}

                  {/* Se for bot e não tiver token, pede o token aqui */}
                  {appType === 'bot' && !token && (
                    <div className="space-y-1.5 pt-2">
                      <label className="block text-xs font-mono text-neutral-300">
                        Token de Autenticação do Bot (Obrigatório)
                      </label>
                      <input
                        type="password"
                        required
                        value={token}
                        onChange={(e) => {
                          setToken(e.target.value);
                          setPlatform(detectPlatformFromToken(e.target.value));
                        }}
                        placeholder="Cole o token do seu bot aqui..."
                        className="w-full px-4 py-3 rounded-2xl bg-black/60 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}

                  {/* Botões de Ação Imediata */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white font-mono text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <span>✏️ Ajustar no Assistente</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExecuteDeploy}
                      disabled={isSubmitting || (appType === 'bot' && !token.trim()) || isQuotaExceeded}
                      className={`w-full sm:w-auto apple-pill-btn apple-pill-primary px-8 py-3 rounded-2xl font-semibold text-xs text-white flex items-center justify-center gap-2 shadow-xl ${
                        isSubmitting || (appType === 'bot' && !token.trim()) || isQuotaExceeded
                          ? 'opacity-50 cursor-not-allowed'
                          : ''
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{submitStatusText || 'Lançando Aplicação...'}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-cyan-300" />
                          <span>Lançar Imediatamente na Malha</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* ÁREA DE DROPZONE DO ARQUIVO ZIP */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all bg-black/40 ${
                    isDragging
                      ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_40px_rgba(34,211,238,0.25)]'
                      : 'border-white/15 hover:border-cyan-400/50'
                  }`}
                >
                  <input
                    key={fileInputKey}
                    type="file"
                    accept=".zip"
                    onChange={(e) => handleProcessZip(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {isInspecting ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-6 animate-pulse">
                      <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <RefreshCw className="w-7 h-7 animate-spin" />
                      </div>
                      <span className="text-base font-semibold text-white">
                        Examinando arquivos do ZIP...
                      </span>
                      <span className="text-xs font-mono text-neutral-400">
                        Procurando por aethel.config ou discloud.config
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-4">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-emerald-500/20 border border-white/15 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.2)]">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-white">
                        {zipFile ? zipFile.name : 'Arraste seu arquivo ZIP aqui ou clique para selecionar'}
                      </h3>
                      <p className="text-xs font-mono text-neutral-400 max-w-md">
                        Limite de 100 MB. Se o ZIP não tiver configuração pronta, abriremos o assistente automaticamente.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* OPÇÃO DE CONFIGURAR DO ZERO SEM ZIP */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-mono text-neutral-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 p-2 rounded-xl hover:bg-white/5"
                >
                  <span>Prefere configurar do zero sem arquivo ZIP?</span>
                  <strong className="text-white underline">Clique aqui para iniciar o assistente →</strong>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              ETAPA 2: IDENTIDADE & TIPO DE APLICAÇÃO
              ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Passo 1 de 4: Definição Básica
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Identidade & Tipo da Aplicação
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Dê um nome para sua aplicação e escolha se você está hospedando um Bot ou um Site Web.
                </p>
              </div>

              {/* Nome da Aplicação */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-neutral-300">
                  Nome da Aplicação <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="ex: meu-bot-vip ou meu-site-web"
                  className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-white font-mono text-sm focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              {/* Seleção do Tipo da Aplicação */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-neutral-300">
                  Tipo da Aplicação <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Bot Discord */}
                  <div
                    onClick={() => {
                      setAppType('bot');
                      setPlatform('DISCORD');
                    }}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      appType === 'bot' && platform === 'DISCORD'
                        ? 'bg-indigo-500/15 border-indigo-500/60 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                        <Bot className="w-5 h-5" />
                      </div>
                      {appType === 'bot' && platform === 'DISCORD' && (
                        <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <strong className="text-white text-sm block">Bot Discord</strong>
                      <span className="text-[11px] text-neutral-400 leading-tight block mt-0.5">
                        Conexão WebSocket Gateway para servidores Discord.
                      </span>
                    </div>
                  </div>

                  {/* Bot Telegram */}
                  <div
                    onClick={() => {
                      setAppType('bot');
                      setPlatform('TELEGRAM');
                    }}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      appType === 'bot' && platform === 'TELEGRAM'
                        ? 'bg-cyan-500/15 border-cyan-500/60 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Send className="w-5 h-5" />
                      </div>
                      {appType === 'bot' && platform === 'TELEGRAM' && (
                        <div className="w-5 h-5 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <strong className="text-white text-sm block">Bot Telegram</strong>
                      <span className="text-[11px] text-neutral-400 leading-tight block mt-0.5">
                        Polling ou Webhook com a API do @BotFather.
                      </span>
                    </div>
                  </div>

                  {/* Site Web */}
                  <div
                    onClick={() => {
                      setAppType('site');
                      setMainFile('index.html');
                      setLanguage('other');
                    }}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      appType === 'site'
                        ? 'bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                        : 'bg-black/40 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Globe className="w-5 h-5" />
                      </div>
                      {appType === 'site' && (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div>
                      <strong className="text-white text-sm block">Site Web (Estilo Vercel)</strong>
                      <span className="text-[11px] text-neutral-400 leading-tight block mt-0.5">
                        HTML5, CSS3, JavaScript com subdomínio próprio e SSL grátis.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Se escolheu Site Web: Configurações Dedicadas de Site */}
              {appType === 'site' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <label className="block text-xs font-mono text-emerald-300 font-semibold">
                      Escolha seu Subdomínio Personalizado (Gratuito com SSL)
                    </label>
                    <div className="flex items-center rounded-2xl bg-black/60 border border-white/15 px-3 py-2 text-white font-mono text-xs focus-within:border-emerald-400">
                      <span className="text-neutral-500 select-none mr-1">https://</span>
                      <input
                        type="text"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder={appName.toLowerCase().replace(/[^a-z0-9-]/g, '') || 'meusite'}
                        className="flex-1 bg-transparent border-none text-white focus:outline-none"
                      />
                      <span className="text-cyan-400 select-none font-semibold">.linkthelkov.online</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                      <span>Certificado SSL/TLS: <strong className="text-emerald-400 font-semibold">Ativo & Automático</strong></span>
                      <span className="text-neutral-500">Mínimo 3 caracteres alfanuméricos</span>
                    </div>
                  </div>

                  {/* Modalidade: Estático vs Backend */}
                  <div className="space-y-2">
                    <label className="block text-xs font-mono text-neutral-300">
                      Modalidade do Site
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => {
                          setMainFile('index.html');
                          setLanguage('other');
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          mainFile === 'index.html'
                            ? 'bg-emerald-500/20 border-emerald-500/60 shadow-sm'
                            : 'bg-black/40 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">🌐</span>
                          {mainFile === 'index.html' && (
                            <span className="text-xs text-emerald-400 font-mono font-bold">RECOMENDADO</span>
                          )}
                        </div>
                        <div>
                          <strong className="text-white text-sm block">Site Estático (Padrão Vercel)</strong>
                          <span className="text-[11px] text-neutral-400 block mt-0.5 leading-tight">
                            Basta index.html, CSS e JavaScript. Sem precisar de Node.js ou server.js!
                          </span>
                        </div>
                      </div>

                      <div
                        onClick={() => {
                          setMainFile('server.js');
                          setLanguage('nodejs');
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          mainFile !== 'index.html'
                            ? 'bg-white/15 border-white/40 shadow-sm'
                            : 'bg-black/40 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xl">⚙️</span>
                          {mainFile !== 'index.html' && (
                            <span className="text-xs text-cyan-400 font-mono font-bold">ATIVO</span>
                          )}
                        </div>
                        <div>
                          <strong className="text-white text-sm block">Aplicação Web com Backend</strong>
                          <span className="text-[11px] text-neutral-400 block mt-0.5 leading-tight">
                            Para projetos dinâmicos que executam um servidor HTTP próprio (server.js / app.py).
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Navegação */}
              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-mono text-xs transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!appName.trim()) {
                      setErrorNotice('Por favor informe o nome da sua aplicação.');
                      return;
                    }
                    setErrorNotice(null);
                    setCurrentStep(3);
                  }}
                  className="apple-pill-btn apple-pill-primary px-7 py-3 rounded-2xl font-semibold text-xs text-white flex items-center gap-2 shadow-lg"
                >
                  <span>Próximo: Runtime & Memória</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              ETAPA 3: LINGUAGEM & RECURSOS (SEPARADO: SITE VS BOT)
              ======================================================== */}
          {currentStep === 3 && appType === 'site' && mainFile === 'index.html' ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Passo 2 de 4: Hospedagem Web Estática
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Motor Web Estático (Estilo Vercel)
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Sites estáticos rodam com velocidade máxima de borda e zero necessidade de scripts Node.js ou server.js.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-3xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Arquivo de Entrada</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-mono">
                    index.html <span className="text-neutral-500">(HTML5 padrão)</span>
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Carregamento de folhas de estilo (style.css), JavaScript (script.js) e assets estáticos.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-black/40 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Segurança & SSL</span>
                  </div>
                  <p className="text-xs text-neutral-300 font-mono">
                    HTTPS Automático TLS 1.3
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Certificado wildcard ativo com terminação SSL em *.linkthelkov.online.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3 font-mono text-xs">
                <span className="text-neutral-400 block font-semibold">Armazenamento & Performance</span>
                <div className="flex items-center justify-between text-neutral-300">
                  <span>Cota de Armazenamento:</span>
                  <strong className="text-white">100 MB dedicado</strong>
                </div>
                <div className="flex items-center justify-between text-neutral-300">
                  <span>Distribuição:</span>
                  <strong className="text-emerald-400">Global Edge CDN</strong>
                </div>
              </div>

              {/* Botões de Navegação */}
              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-mono text-xs transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorNotice(null);
                    setCurrentStep(4);
                  }}
                  className="apple-pill-btn apple-pill-primary px-7 py-3 rounded-2xl font-semibold text-xs text-white flex items-center gap-2 shadow-lg"
                >
                  <span>Próximo: Publicação & Domínio</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Passo 2 de 4: Recursos do Sistema
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {appType === 'site' ? 'Runtime da Aplicação Web' : 'Linguagem & Memória RAM'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400">
                  {appType === 'site'
                    ? 'Selecione o backend da sua aplicação web e aloque a memória necessária.'
                    : 'Selecione o ambiente de execução e reserve a memória necessária para a aplicação.'}
                </p>
              </div>

              {/* Seleção de Linguagem / Runtime */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-neutral-300">
                  Linguagem de Programação
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'nodejs', name: 'Node.js', icon: '🟨', desc: 'JS / TypeScript' },
                    { id: 'python', name: 'Python', icon: '🐍', desc: 'Python 3.10+' },
                    { id: 'java', name: 'Java', icon: '☕', desc: 'OpenJDK / JAR' },
                    { id: 'other', name: 'Outro', icon: '⚙️', desc: 'Binário / Estático' },
                  ].map((lang) => (
                    <div
                      key={lang.id}
                      onClick={() => setLanguage(lang.id as any)}
                      className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                        language === lang.id
                          ? 'bg-white/15 border-white/40 shadow-sm'
                          : 'bg-black/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-2xl">{lang.icon}</span>
                      <div>
                        <strong className="text-white text-sm block">{lang.name}</strong>
                        <span className="text-[10px] text-neutral-400 font-mono">{lang.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seleção de Memória RAM */}
              <div className="space-y-3 p-5 rounded-3xl bg-black/40 border border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-neutral-300 flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>Alocação de Memória RAM</span>
                  </label>
                  <span className="font-mono text-sm font-bold text-cyan-300 bg-cyan-500/20 px-3 py-0.5 rounded-full border border-cyan-400/30">
                    {ram} MB
                  </span>
                </div>

                {/* Chips de Seleção Rápida */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[100, 256, 512, 1024, 2048].map((ramOption) => {
                    const isDisabled = ramOption > totalQuotaMb;
                    return (
                      <button
                        key={ramOption}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => setRam(ramOption)}
                        className={`px-3.5 py-1.5 rounded-2xl font-mono text-xs transition-all ${
                          ram === ramOption
                            ? 'bg-cyan-400 text-black font-bold shadow-[0_0_12px_#22d3ee]'
                            : isDisabled
                            ? 'bg-white/5 text-neutral-600 border border-white/5 cursor-not-allowed'
                            : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10'
                        }`}
                      >
                        {ramOption >= 1024 ? `${ramOption / 1024} GB` : `${ramOption} MB`}
                      </button>
                    );
                  })}
                </div>

                {/* Slider Interativo */}
                <input
                  type="range"
                  min={100}
                  max={Math.max(100, totalQuotaMb)}
                  step={32}
                  value={ram}
                  onChange={(e) => setRam(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />

                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-1 border-t border-white/5">
                  <span>Mínimo do sistema: <strong>100 MB</strong></span>
                  <span>Cota Total do seu Plano: <strong>{totalQuotaMb} MB</strong></span>
                </div>
              </div>

              {/* Botões de Navegação */}
              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-mono text-xs transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorNotice(null);
                    setCurrentStep(4);
                  }}
                  className="apple-pill-btn apple-pill-primary px-7 py-3 rounded-2xl font-semibold text-xs text-white flex items-center gap-2 shadow-lg"
                >
                  <span>{appType === 'site' ? 'Próximo: Publicação & Domínio' : 'Próximo: Inicialização & Tokens'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              ETAPA 4: INICIALIZAÇÃO / AUTENTICAÇÃO (SEPARADO: SITE VS BOT)
              ======================================================== */}
          {currentStep === 4 && appType === 'site' ? (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Passo 3 de 4: Publicação & Domínio
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Seu Site Pronto para o Mundo 🚀
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Sites são públicos e seguros por padrão. Não exigem tokens de bot ou autenticação externa.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-black/50 border border-emerald-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 block uppercase">Endereço Web Oficial</span>
                    <strong className="text-cyan-300 font-mono text-sm sm:text-base">
                      https://{(subdomain || appName).toLowerCase().replace(/[^a-z0-9-]/g, '')}.linkthelkov.online
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10 font-mono text-xs">
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Arquivo de Entrada:</span>
                    <strong className="text-white">{mainFile || 'index.html'}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px]">Certificado de Segurança:</span>
                    <strong className="text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> SSL TLS 1.3
                    </strong>
                  </div>
                </div>
              </div>

              {!zipFile && (
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    Como você está criando o site manualmente, geraremos um <strong className="text-white">index.html, style.css e script.js</strong> modernos e funcionais de exemplo. Você poderá editá-los livremente pelo Editor de Código da plataforma!
                  </p>
                </div>
              )}

              {/* Botões de Navegação */}
              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-mono text-xs transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setErrorNotice(null);
                    setCurrentStep(5);
                  }}
                  className="apple-pill-btn apple-pill-primary px-7 py-3 rounded-2xl font-semibold text-xs text-white flex items-center gap-2 shadow-lg"
                >
                  <span>Próximo: Revisar & Lançar Site</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Passo 3 de 4: Parâmetros de Execução
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Inicialização & Autenticação
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Configure o arquivo principal de entrada, autenticação do bot e variáveis de ambiente seguras.
                </p>
              </div>

              {/* Arquivo Main / Comando */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-neutral-300">
                  Arquivo Principal de Execução (Entrypoint)
                </label>
                <input
                  type="text"
                  required
                  value={mainFile}
                  onChange={(e) => setMainFile(e.target.value)}
                  placeholder={appType === 'site' ? 'index.html' : 'index.js'}
                  className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-cyan-400"
                />
                <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[11px]">
                  <span className="text-neutral-500">Sugestões:</span>
                  {(appType === 'site' ? ['index.html', 'server.js', 'index.js', 'app.py'] : ['index.js', 'main.py', 'bot.js', 'app.js']).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setMainFile(sug)}
                      className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 border border-white/10"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Autenticação: Token de Bot */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-neutral-300">
                  Token de Autenticação ({platform === 'TELEGRAM' ? 'Telegram Bot API' : 'Discord Bot'}) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={token}
                    onChange={(e) => {
                      setToken(e.target.value);
                      setPlatform(detectPlatformFromToken(e.target.value));
                    }}
                    placeholder={platform === 'TELEGRAM' ? '123456789:ABCDefghijk...' : 'MTIzNDU2...'}
                    className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-white font-mono text-xs focus:outline-none focus:border-cyan-400 pr-10"
                  />
                  <Key className="w-4 h-4 text-neutral-500 absolute right-3.5 top-3.5" />
                </div>
                <span className="text-[10px] text-neutral-500 font-mono block">
                  {platform === 'TELEGRAM'
                    ? 'Obtido conversando com o @BotFather no Telegram.'
                    : 'Obtido na aba "Bot" no Discord Developer Portal.'}
                </span>
              </div>

              {/* Variáveis de Ambiente (.env) */}
              <div className="space-y-3 p-4 rounded-3xl bg-black/40 border border-white/10 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Variáveis de Ambiente (.env)</span>
                  <span className="text-[10px] text-neutral-500">{Object.keys(customEnv).length} cadastradas</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={newEnvKey}
                    onChange={(e) => setNewEnvKey(e.target.value)}
                    placeholder="CHAVE (ex: PORT)"
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400 uppercase"
                  />
                  <input
                    type="text"
                    value={newEnvVal}
                    onChange={(e) => setNewEnvVal(e.target.value)}
                    placeholder="VALOR (ex: 3000)"
                    className="sm:col-span-2 px-3 py-2 rounded-xl bg-black/60 border border-white/15 text-white text-xs focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddEnv}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {Object.keys(customEnv).length > 0 && (
                  <div className="space-y-1.5 pt-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {Object.entries(customEnv).map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5 text-[11px]">
                        <span className="text-cyan-300 font-semibold">{k}</span>
                        <span className="text-neutral-400 truncate max-w-[200px]">{v || '(vazio)'}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEnv(k)}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões de Navegação */}
              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-mono text-xs transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (appType === 'bot' && !token.trim()) {
                      setErrorNotice('O token de autenticação do bot é obrigatório.');
                      return;
                    }
                    setErrorNotice(null);
                    setCurrentStep(5);
                  }}
                  className="apple-pill-btn apple-pill-primary px-7 py-3 rounded-2xl font-semibold text-xs text-white flex items-center gap-2 shadow-lg"
                >
                  <span>Revisar & Lançar</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================
              ETAPA 5: REVISÃO & LANÇAMENTO NA MALHA AETHELKOV
              ======================================================== */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                  Passo 4 de 4: Revisão Final
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Tudo Pronto para o Lançamento
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Revise a configuração gerada do seu projeto antes de iniciar o deploy na infraestrutura Aethelkov.
                </p>
              </div>

              {/* Card Terminal com o aethel.config gerado em tempo real */}
              <div className="rounded-3xl bg-[#090b10] border border-white/15 overflow-hidden shadow-2xl">
                <div className="h-9 px-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-[10px] font-mono text-neutral-400 ml-2">aethel.config (Auto-gerado)</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300">Aethelkov Engine v3</span>
                </div>
                <pre className="p-4 sm:p-5 font-mono text-xs text-cyan-200 overflow-x-auto leading-relaxed">
                  {generatedAethelConfigText}
                </pre>
              </div>

              {/* Resumo visual dos parâmetros */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-neutral-500 block mb-1">APLICAÇÃO</span>
                  <strong className="text-white text-sm truncate block">{appName}</strong>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-neutral-500 block mb-1">TIPO</span>
                  <strong className="text-emerald-400 text-sm block">
                    {appType === 'site' ? 'SITE WEB' : platform}
                  </strong>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-neutral-500 block mb-1">MEMÓRIA</span>
                  <strong className="text-cyan-300 text-sm block">{ram} MB</strong>
                </div>
                <div className="p-3 rounded-2xl bg-black/40 border border-white/10">
                  <span className="text-[10px] text-neutral-500 block mb-1">ARQUIVO MAIN</span>
                  <strong className="text-white text-sm truncate block">{mainFile}</strong>
                </div>
              </div>

              {/* Subdomínio Ativo */}
              {appType === 'site' && (
                <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between font-mono text-xs">
                  <div className="flex items-center gap-2 text-emerald-300">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>URL Pública Final:</span>
                  </div>
                  <a
                    href={`https://${(subdomain || appName).toLowerCase().replace(/[^a-z0-9-]/g, '')}.linkthelkov.online`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-white bg-black/50 px-3 py-1 rounded-xl border border-white/10 hover:text-cyan-300 flex items-center gap-1.5"
                  >
                    <span>https://{(subdomain || appName).toLowerCase().replace(/[^a-z0-9-]/g, '')}.linkthelkov.online</span>
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                  </a>
                </div>
              )}

              {/* Botões de Ação Final */}
              <div className="pt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentStep(4)}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white font-mono text-xs transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </button>

                <button
                  type="button"
                  onClick={handleExecuteDeploy}
                  disabled={isSubmitting || isQuotaExceeded}
                  className={`apple-pill-btn apple-pill-primary px-8 sm:px-10 py-3.5 rounded-2xl font-semibold text-xs sm:text-sm text-white flex items-center gap-2 shadow-2xl ${
                    isSubmitting || isQuotaExceeded ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-300" />
                      <span>{submitStatusText || 'Lançando Aplicação...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-300" />
                      <span>{appType === 'site' ? '🚀 Lançar Meu Site Agora (com SSL)' : '🚀 Lançar Aplicação na Malha Aethelkov'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};
