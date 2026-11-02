'use client';

import React, { useState, useEffect } from 'react';
import {
  Key,
  Copy,
  Check,
  BookOpen,
  ShieldCheck,
  FileText,
  Sparkles,
  RefreshCw,
  Terminal,
  Code2,
  Trash2,
  Eye,
  EyeOff,
  Palette,
  ExternalLink,
  Layers,
  Lock,
  Server,
  Zap,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  UploadCloud,
} from 'lucide-react';
import {
  getUserApiKey,
  generateUserApiKey,
  revokeUserApiKey,
} from '@/lib/apiKeyService';

interface AethelSettingsViewProps {
  currentUser?: any;
}

export const AethelSettingsView: React.FC<AethelSettingsViewProps> = ({ currentUser }) => {
  const [activeSection, setActiveSection] = useState<
    'api' | 'docs' | 'privacy' | 'terms' | 'brand'
  >('api');

  // Chave de API States
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBadgeMd, setCopiedBadgeMd] = useState(false);
  const [copiedBadgeHtml, setCopiedBadgeHtml] = useState(false);
  const [codeLang, setCodeLang] = useState<'curl' | 'node' | 'python'>('curl');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const userKey =
    currentUser?.user_metadata?.provider_id ||
    currentUser?.user_metadata?.sub ||
    currentUser?.email ||
    currentUser?.id ||
    'aethel_default_user';

  // Carrega chave salva
  useEffect(() => {
    const existing = getUserApiKey(userKey);
    if (existing) {
      setApiKey(existing);
    }
  }, [userKey]);

  const handleGenerateKey = () => {
    const newKey = generateUserApiKey(userKey);
    setApiKey(newKey);
    setIsKeyVisible(true);
    setStatusMsg('Nova chave de API gerada com sucesso! Guarde-a com segurança.');
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleRevokeKey = () => {
    if (confirm('Tem certeza que deseja revogar sua chave de API? Qualquer integração externa deixará de funcionar imediatamente.')) {
      revokeUserApiKey(userKey);
      setApiKey(null);
      setStatusMsg('Chave de API revogada com sucesso.');
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const handleCopy = (text: string, type: 'key' | 'badgeMd' | 'badgeHtml') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } else if (type === 'badgeMd') {
      setCopiedBadgeMd(true);
      setTimeout(() => setCopiedBadgeMd(false), 2500);
    } else if (type === 'badgeHtml') {
      setCopiedBadgeHtml(true);
      setTimeout(() => setCopiedBadgeHtml(false), 2500);
    }
  };

  const maskedToken = apiKey
    ? apiKey.substring(0, 14) + '•'.repeat(22) + apiKey.substring(apiKey.length - 4)
    : '';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://aethelkov.vercel.app';
  const badgeUrl = `${origin}/badge.svg`;
  const badgeMarkdown = `[![Hosted on Aethel Cloud](${badgeUrl})](${origin})`;
  const badgeHtml = `<a href="${origin}"><img src="${badgeUrl}" alt="Hosted on Aethel Cloud" /></a>`;

  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/v1/user',
      title: 'Informações da Conta & Cota de RAM',
      desc: 'Retorna estatísticas da conta, cota de RAM (100 MB), RAM em uso, total de aplicações e status.',
      exampleRes: `{
  "status": "ok",
  "statusCode": 200,
  "user": {
    "totalRamMb": 100,
    "ramUsedMb": 100,
    "ramFreeMb": 0,
    "plan": "Aethel Free Mesh (100 MB Cota Estrita)",
    "totalApps": 1,
    "onlineApps": 1,
    "clusters": ["farol-alpha"]
  }
}`,
    },
    {
      method: 'GET',
      path: '/api/v1/app',
      title: 'Listar Aplicações',
      desc: 'Lista todos os bots e microsserviços implantados na sua conta Aethel Cloud.',
      exampleRes: `{
  "status": "ok",
  "statusCode": 200,
  "apps": [
    {
      "id": "app_98a72b...",
      "name": "Meu Telegram Bot",
      "online": true,
      "status": "ONLINE",
      "ram": 100,
      "main": "bot.js",
      "platform": "TELEGRAM"
    }
  ]
}`,
    },
    {
      method: 'GET',
      path: '/api/v1/app/:id',
      title: 'Detalhes da Aplicação',
      desc: 'Obtém metadados detalhados de um bot específico através do seu ID.',
      exampleRes: `{
  "status": "ok",
  "statusCode": 200,
  "apps": {
    "id": "app_98a72b...",
    "name": "Meu Telegram Bot",
    "online": true,
    "status": "ONLINE",
    "ram": 100,
    "main": "bot.js"
  }
}`,
    },
    {
      method: 'PUT',
      path: '/api/v1/app/:id/restart',
      title: 'Reiniciar Aplicação',
      desc: 'Reinicia o processo da instância na malha de nós Farol. Suporta também "start" e "stop".',
      exampleRes: `{
  "status": "ok",
  "statusCode": 200,
  "message": "Ação 'restart' executada com sucesso.",
  "apps": { "id": "app_98a72b...", "status": "ONLINE", "online": true }
}`,
    },
    {
      method: 'GET',
      path: '/api/v1/app/:id/logs',
      title: 'Logs do Terminal em Tempo Real',
      desc: 'Retorna as últimas linhas do console e do terminal de execução da aplicação.',
      exampleRes: `{
  "status": "ok",
  "statusCode": 200,
  "logs": {
    "small": "[20:30:15] [INFO] Bot conectado 24/7 com latência < 20ms",
    "big": "[20:30:15] [INFO] Bot conectado 24/7 com latência < 20ms\\n[20:30:16] [GATEWAY] Heartbeat OK"
  }
}`,
    },
    {
      method: 'POST',
      path: '/api/v1/upload',
      title: 'Deploy via Upload ZIP',
      desc: 'Envia um arquivo ZIP de até 100 MB para implantar um novo bot ou atualizar. Suporta discloud.config ou aethel.config.',
      exampleRes: `{
  "status": "ok",
  "statusCode": 200,
  "message": "Aplicação implantada com sucesso na malha Aethel Cloud!",
  "app": { "id": "bot_302a", "name": "Telegram Bot", "ram": 100, "online": true }
}`,
    },
    {
      method: 'DELETE',
      path: '/api/v1/app/:id',
      title: 'Excluir Aplicação & Liberar Cota',
      desc: 'Desconecta o bot, remove registros e libera imediatamente os 100 MB de RAM para novos deploys.',
      exampleRes: `{
  "status": "ok",
  "statusCode": 200,
  "message": "Aplicação apagada permanentemente. A cota de 100 MB de RAM foi liberada."
}`,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      {/* Cabeçalho Principal das Configurações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-white/15 flex items-center justify-center shadow-lg">
              <Key className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-[-0.03em] text-white">
                Configurações & Aethel API
              </h1>
              <p className="text-xs md:text-sm text-neutral-400">
                Chave de API pública, documentação REST estilo Discloud, diretrizes de marca e termos da malha.
              </p>
            </div>
          </div>
        </div>

        {/* Status de Cota da API */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>API REST v1 Ativa &bull; 24/7</span>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Menu Superior em Abas Pílula (Apple Liquid Material) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none font-mono text-xs">
        <button
          onClick={() => setActiveSection('api')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
            activeSection === 'api'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-semibold'
              : 'text-neutral-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Chave de API</span>
        </button>

        <button
          onClick={() => setActiveSection('docs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
            activeSection === 'docs'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-semibold'
              : 'text-neutral-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Documentação da API</span>
        </button>

        <button
          onClick={() => setActiveSection('privacy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
            activeSection === 'privacy'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-semibold'
              : 'text-neutral-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Política de Privacidade</span>
        </button>

        <button
          onClick={() => setActiveSection('terms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
            activeSection === 'terms'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-semibold'
              : 'text-neutral-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Termos de Uso</span>
        </button>

        <button
          onClick={() => setActiveSection('brand')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap ${
            activeSection === 'brand'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.25)] font-semibold'
              : 'text-neutral-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Marca & Badge</span>
        </button>
      </div>

      {/* =========================================================================
          SEÇÃO 1: GERADOR E GERENCIADOR DE CHAVE DE API
         ========================================================================= */}
      {activeSection === 'api' && (
        <div className="space-y-6">
          <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                  <Key className="w-5 h-5 text-cyan-400" />
                  <span>Sua Chave de API Aethel Cloud</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Use esta chave para autenticar requisições REST via header <code className="text-cyan-300 bg-white/5 px-2 py-0.5 rounded font-mono">api-token</code> no padrão da Discloud.
                </p>
              </div>

              {!apiKey ? (
                <button
                  onClick={handleGenerateKey}
                  className="apple-pill-btn apple-pill-primary flex items-center gap-2 px-6 py-3 rounded-full font-mono text-xs font-semibold text-white shadow-lg active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>Gerar API</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateKey}
                    className="apple-pill-btn flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-xs text-neutral-300 hover:text-white bg-white/5 border border-white/15 hover:bg-white/10 transition-all"
                    title="Gera uma nova chave e substitui a anterior"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Regerar Chave</span>
                  </button>
                  <button
                    onClick={handleRevokeKey}
                    className="apple-pill-btn flex items-center gap-2 px-4 py-2.5 rounded-full font-mono text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
                    title="Revoga o token imediatamente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Revogar</span>
                  </button>
                </div>
              )}
            </div>

            {/* Caixa de Exibição da Chave */}
            {apiKey ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/15 space-y-3">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Chave Ativa e Pronta para Uso</span>
                  </span>
                  <span>Ambiente de Produção (Live)</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <div className="flex-1 flex items-center justify-between px-4 py-3 rounded-xl bg-neutral-900/90 border border-white/10 font-mono text-xs sm:text-sm text-cyan-300 overflow-x-auto select-all">
                    <span>{isKeyVisible ? apiKey : maskedToken}</span>
                    <button
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                      className="ml-3 text-neutral-400 hover:text-white transition-colors p-1"
                      title={isKeyVisible ? 'Ocultar chave' : 'Mostrar chave'}
                    >
                      {isKeyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    onClick={() => handleCopy(apiKey, 'key')}
                    className="apple-pill-btn apple-pill-primary flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-mono text-xs font-semibold text-white whitespace-nowrap active:scale-95 transition-all"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Chave</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-neutral-500 font-mono">
                  &bull; Mantenha esta chave em segredo. Ela concede permissão total para gerenciar, criar, reiniciar e apagar aplicações na sua conta Aethel.
                </p>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-black/40 border border-dashed border-white/15 text-center space-y-3">
                <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Key className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white font-mono">Nenhuma chave de API gerada ainda</h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  Clique no botão "Gerar API" acima para criar sua credencial segura e começar a automatizar seus bots via terminal, scripts ou pipelines de CI/CD.
                </p>
              </div>
            )}

            {/* Exemplos de Código de Integração */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>Exemplos de Autenticação Rápida</span>
                </h3>
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 font-mono text-xs">
                  <button
                    onClick={() => setCodeLang('curl')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      codeLang === 'curl' ? 'bg-white/15 text-cyan-300 font-semibold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setCodeLang('node')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      codeLang === 'node' ? 'bg-white/15 text-cyan-300 font-semibold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    onClick={() => setCodeLang('python')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      codeLang === 'python' ? 'bg-white/15 text-cyan-300 font-semibold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Python
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/80 border border-white/10 font-mono text-xs text-neutral-200 overflow-x-auto relative">
                {codeLang === 'curl' && (
                  <pre className="text-cyan-200 leading-relaxed">
{`# 1. Consultar dados e cota da conta
curl -X GET "${origin}/api/v1/user" \\
  -H "api-token: ${apiKey || 'SUA_CHAVE_AETHEL'}"

# 2. Listar todas as instâncias de bots
curl -X GET "${origin}/api/v1/app" \\
  -H "api-token: ${apiKey || 'SUA_CHAVE_AETHEL'}"

# 3. Reiniciar bot específico
curl -X PUT "${origin}/api/v1/app/SEU_BOT_ID/restart" \\
  -H "api-token: ${apiKey || 'SUA_CHAVE_AETHEL'}"`}
                  </pre>
                )}

                {codeLang === 'node' && (
                  <pre className="text-emerald-300 leading-relaxed">
{`// Requisição com Fetch Nativo / Node 18+
const res = await fetch('${origin}/api/v1/user', {
  headers: {
    'api-token': '${apiKey || 'SUA_CHAVE_AETHEL'}'
  }
});
const data = await res.json();
console.log('Status da Conta:', data.user);`}
                  </pre>
                )}

                {codeLang === 'python' && (
                  <pre className="text-purple-300 leading-relaxed">
{`import requests

url = "${origin}/api/v1/user"
headers = {
    "api-token": "${apiKey || 'SUA_CHAVE_AETHEL'}"
}

response = requests.get(url, headers=headers)
print(response.json())`}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 2: DOCUMENTAÇÃO COMPLETA DA API REST (ESTILO DISCLOUD)
         ========================================================================= */}
      {activeSection === 'docs' && (
        <div className="space-y-6">
          <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <span>Documentação da Aethel Cloud API v1</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                A API da Aethel Cloud segue fielmente a estrutura e comportamento da Discloud API v2, permitindo que scripts existentes, bibliotecas ou bots de automação funcionem imediatamente.
              </p>
            </div>

            {/* Detalhes de Conexão Base */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono text-neutral-400">URL Base da API</span>
                <p className="font-mono text-xs sm:text-sm text-cyan-300 select-all font-semibold">
                  {origin}/api/v1
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-mono text-neutral-400">Header Obrigatório</span>
                <p className="font-mono text-xs sm:text-sm text-emerald-400 select-all font-semibold">
                  api-token: &lt;sua_chave_gerada&gt;
                </p>
              </div>
            </div>

            {/* Lista Interativa de Endpoints */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider text-neutral-300">
                Endpoints Disponíveis
              </h3>

              <div className="space-y-4">
                {apiEndpoints.map((ep, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-neutral-900/70 border border-white/10 hover:border-cyan-500/30 transition-all space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold ${
                            ep.method === 'GET'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : ep.method === 'POST'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : ep.method === 'PUT'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <code className="font-mono text-xs sm:text-sm text-white font-semibold">
                          {ep.path}
                        </code>
                      </div>
                      <span className="text-xs text-neutral-400 font-mono">{ep.title}</span>
                    </div>

                    <p className="text-xs text-neutral-300 leading-relaxed">{ep.desc}</p>

                    {/* Exemplo de Resposta */}
                    <div className="rounded-xl bg-black/80 border border-white/5 p-3.5 font-mono text-[11px] text-neutral-300 overflow-x-auto">
                      <span className="text-[10px] text-neutral-500 uppercase block mb-1">
                        Exemplo de Resposta JSON (200 OK)
                      </span>
                      <pre className="text-neutral-300">{ep.exampleRes}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 3: POLÍTICA DE PRIVACIDADE
         ========================================================================= */}
      {activeSection === 'privacy' && (
        <div className="space-y-6">
          <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Política de Privacidade da Aethel Cloud</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Última atualização: Novembro de 2026 &bull; Compromisso de isolamento total e sigilo absoluto.
              </p>
            </div>

            <div className="space-y-6 text-xs sm:text-sm text-neutral-300 leading-relaxed font-sans">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>1. Criptografia & Proteção de Tokens</span>
                </h3>
                <p>
                  Todos os tokens de bots enviados para a Aethel Cloud (tanto do Telegram Bot API quanto do Discord Developer Portal) são protegidos com isolamento e criptografia em repouso. Nossa equipe ou quaisquer nós adjacentes da malha não possuem permissão de leitura sobre seus tokens em texto aberto.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  <span>2. Isolamento de Memória & Nós Operacionais</span>
                </h3>
                <p>
                  Cada instância de bot opera sob uma sandbox restrita e independente de até 100 MB de memória RAM. Não há compartilhamento de espaço de execução ou acesso a processos de outros usuários da malha.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>3. Exclusão Imediata e Permanente</span>
                </h3>
                <p>
                  Ao excluir uma aplicação (seja pelo painel ou via <code className="text-rose-300 font-mono">DELETE /api/v1/app/:id</code>), todos os arquivos ZIP, registros de terminal e webhooks associados são excluídos imediatamente dos servidores e do banco de dados, liberando sua cota de 100 MB sem qualquer retenção residual.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-purple-400" />
                  <span>4. Ausência de Telemetria Invasiva</span>
                </h3>
                <p>
                  Não monitoramos o conteúdo das conversas ou mensagens privadas que seus bots transacionam. O sistema apenas coleta métricas de saúde operacional (consumo de RAM, status de rede e erros de compilação) para garantir o funcionamento 24/7.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 4: TERMOS DE USO
         ========================================================================= */}
      {activeSection === 'terms' && (
        <div className="space-y-6">
          <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Termos de Uso da Malha Aethel</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Diretrizes de uso aceitável para manter a estabilidade de alta performance da infraestrutura.
              </p>
            </div>

            <div className="space-y-6 text-xs sm:text-sm text-neutral-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <h3 className="font-semibold text-white">1. Política de Cota Estrita (100 MB)</h3>
                <p>
                  Cada conta padrão tem direito à reserva estrita de 100 MB de memória RAM, suficiente para hospedar 1 aplicação estável. Bônus e presentes recebidos por moderação ou eventos devem respeitar o incremento mínimo de 100 MB para permitir instâncias adicionais.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <h3 className="font-semibold text-white text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>2. Condutas Proibidas na Malha</span>
                </h3>
                <ul className="list-disc list-inside space-y-1 text-neutral-400">
                  <li>Disparo de ataques de negação de serviço (DDoS) ou spam em massa.</li>
                  <li>Mineração de criptomoedas ou processos de carga contínua de CPU artificial.</li>
                  <li>Violação direta dos Termos de Serviço da Discord Inc. ou Telegram FZ-LLC.</li>
                  <li>Hospedagem de scripts de phishing ou roubo de credenciais de usuários.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <h3 className="font-semibold text-white">3. Disponibilidade e Manutenção</h3>
                <p>
                  A malha Aethel busca disponibilidade 24/7. Eventuais reinicializações preventivas para aplicação de patches de segurança no nó Farol podem ocorrer de forma transparente e automática sem perda de dados persistidos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SEÇÃO 5: MARCA AETHEL & BADGE PARA README
         ========================================================================= */}
      {activeSection === 'brand' && (
        <div className="space-y-6">
          <div className="apple-glass-card rounded-3xl p-6 sm:p-8 border border-white/15 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-cyan-400" />
                <span>Diretrizes de Marca & Badge Oficial</span>
              </h2>
              <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                Exiba que sua aplicação roda na malha da Aethel Cloud no seu repositório do GitHub ou documentação.
              </p>
            </div>

            {/* Badge Oficial "Hosted on Aethel Cloud" */}
            <div className="p-6 rounded-2xl bg-black/60 border border-white/15 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Badge Oficial para GitHub & README</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Badge vetorial SVG de alta resolução no tema Dark Liquid Glass.
                  </p>
                </div>

                {/* Preview Visual do Badge */}
                <div className="flex items-center gap-2 p-2 rounded-xl bg-black/80 border border-white/10">
                  <img
                    src="/badge.svg"
                    alt="Hosted on Aethel Cloud"
                    className="h-7 w-auto shadow-[0_0_15px_rgba(0,242,254,0.3)]"
                  />
                </div>
              </div>

              {/* Copiador Markdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Código Markdown (para README.md)</span>
                  <button
                    onClick={() => handleCopy(badgeMarkdown, 'badgeMd')}
                    className="flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    {copiedBadgeMd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBadgeMd ? 'Copiado!' : 'Copiar Markdown'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-black/80 border border-white/10 font-mono text-xs text-cyan-200 select-all overflow-x-auto">
                  {badgeMarkdown}
                </div>
              </div>

              {/* Copiador HTML */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>Código HTML (para websites e documentações)</span>
                  <button
                    onClick={() => handleCopy(badgeHtml, 'badgeHtml')}
                    className="flex items-center gap-1.5 text-cyan-300 hover:text-cyan-200 transition-colors"
                  >
                    {copiedBadgeHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBadgeHtml ? 'Copiado!' : 'Copiar HTML'}</span>
                  </button>
                </div>
                <div className="p-3.5 rounded-xl bg-black/80 border border-white/10 font-mono text-xs text-emerald-300 select-all overflow-x-auto">
                  {badgeHtml}
                </div>
              </div>
            </div>

            {/* Paleta Oficial e Cores da Marca */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-white font-mono uppercase tracking-wider text-neutral-300">
                Paleta de Cores Oficial
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#00f2fe] shadow-[0_0_10px_rgba(0,242,254,0.5)]"></div>
                  <div className="font-mono text-xs">
                    <span className="text-white font-semibold block">Aethel Cyan</span>
                    <span className="text-neutral-400 text-[10px]">#00f2fe</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.5)]"></div>
                  <div className="font-mono text-xs">
                    <span className="text-white font-semibold block">Sky Glow</span>
                    <span className="text-neutral-400 text-[10px]">#38bdf8</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                  <div className="font-mono text-xs">
                    <span className="text-white font-semibold block">Online Emerald</span>
                    <span className="text-neutral-400 text-[10px]">#10b981</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-[#090d16] border border-white/20"></div>
                  <div className="font-mono text-xs">
                    <span className="text-white font-semibold block">Deep Void</span>
                    <span className="text-neutral-400 text-[10px]">#090d16</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

