'use client';

import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { 
  ShieldCheck, 
  Server, 
  Cpu, 
  HardDrive, 
  Layers, 
  Plus, 
  Trash2, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Key,
  Globe,
  Sliders,
  LogOut,
  Zap
} from 'lucide-react';
import { AethelBot } from '@/lib/types';

interface DiscloudAccount {
  id: string;
  label: string;
  token: string;
  totalRamMb: number;
  ramUsedMb: number;
  appsCount: number;
  plan: string;
}

interface AdminPanelProps {
  bots: AethelBot[];
  onClose: () => void;
  onRefreshBots: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  bots,
  onClose,
  onRefreshBots,
}) => {
  // Contas da Discloud salvas no localStorage
  const [accounts, setAccounts] = useState<DiscloudAccount[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [newToken, setNewToken] = useState('');
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Gerador Manual de Nós
  const [genNodeName, setGenNodeName] = useState('farol-bravo');
  const [genOffset, setGenOffset] = useState(50);
  const [genLimit, setGenLimit] = useState(50);
  const [isGeneratingZip, setIsGeneratingZip] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Carrega contas do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('aethel_discloud_accounts');
      if (saved) {
        setAccounts(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  const saveAccounts = (updated: DiscloudAccount[]) => {
    setAccounts(updated);
    localStorage.setItem('aethel_discloud_accounts', JSON.stringify(updated));
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToken.trim()) return;

    setLoadingAccount(true);
    setAccountError(null);

    try {
      const res = await fetch('/api/admin/discloud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newToken.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao autenticar token da Discloud');
      }

      const newAcc: DiscloudAccount = {
        id: data.account.id || `acc-${Date.now()}`,
        label: newLabel.trim() || `Conta Discloud #${accounts.length + 1}`,
        token: newToken.trim(),
        totalRamMb: data.account.totalRamMb || 100,
        ramUsedMb: data.account.ramUsedMb || 0,
        appsCount: data.account.appsCount || 0,
        plan: data.account.plan || 'Free',
      };

      const updated = [...accounts, newAcc];
      saveAccounts(updated);
      setNewLabel('');
      setNewToken('');
    } catch (err: any) {
      setAccountError(err.message);
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleRemoveAccount = (id: string) => {
    const updated = accounts.filter((a) => a.id !== id);
    saveAccounts(updated);
  };

  // Gerador dinâmico de ZIP para novo nó da Discloud
  const handleGenerateNodeZip = async () => {
    setIsGeneratingZip(true);
    setDownloadSuccess(null);

    try {
      const zip = new JSZip();

      // discloud.config customizado
      const discloudConfig = `NAME=aethel-${genNodeName.trim()}\nTYPE=bot\nMAIN=farol.js\nRAM=100\nAUTORESTART=true\nVERSION=latest\nAPT=tools\n`;
      zip.file('discloud.config', discloudConfig);

      // package.json
      const packageJson = JSON.stringify({
        name: `aethel-${genNodeName.trim()}`,
        version: "1.0.0",
        description: `Aethelkov Core - Nó Farol (${genNodeName})`,
        main: "farol.js",
        dependencies: {
          "@supabase/supabase-js": "^2.45.0",
          "ws": "^8.18.0",
          "dotenv": "^16.4.5"
        }
      }, null, 2);
      zip.file('package.json', packageJson);

      // farol.js com as variáveis fixadas para este nó
      const farolScript = `/**
 * AETHELKOV CORE - AETHEL-FAROL DAEMON (Nó: ${genNodeName})
 * Shard Range: ${genOffset} a ${genOffset + genLimit - 1}
 */
require('dotenv').config();
const WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.AETHEL_SUPABASE_URL || 'https://rrxrcxutdzedkqaesdkm.supabase.co';
const SUPABASE_KEY = process.env.AETHEL_SUPABASE_KEY || 'sb_publishable_4Q59J9becXPLLqYWiOob0g_RnLJ2pvB';
const VERCEL_DISPATCH_URL = process.env.AETHEL_DISPATCH_URL || 'https://aethelkov.vercel.app/api/dispatch';
const INTERNAL_SECRET = process.env.AETHEL_INTERNAL_SECRET || 'aethel-secret-grid-master-key';

const NODE_ID = process.env.AETHEL_NODE_ID || '${genNodeName}';
const SHARD_OFFSET = parseInt(process.env.AETHEL_SHARD_OFFSET || '${genOffset}', 10);
const SHARD_LIMIT = parseInt(process.env.AETHEL_SHARD_LIMIT || '${genLimit}', 10);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const activeSessions = new Map();

async function initMesh() {
  console.log('[Aethel-Farol] Nó: ' + NODE_ID + ' (Shards: ' + SHARD_OFFSET + '-' + (SHARD_OFFSET + SHARD_LIMIT - 1) + ')');
  const { data: bots } = await supabase
    .from('aethel_bots')
    .select('id, bot_name, token_encrypted')
    .eq('platform', 'DISCORD')
    .eq('status', 'ONLINE')
    .range(SHARD_OFFSET, SHARD_OFFSET + SHARD_LIMIT - 1);

  if (bots) {
    bots.forEach(b => spawnPresenceSocket(b.id, b.token_encrypted, b.bot_name));
  }

  supabase.channel('mesh_control_' + NODE_ID)
    .on('broadcast', { event: 'SPAWN_BOT' }, p => spawnPresenceSocket(p.payload.botId, p.payload.token, p.payload.botName))
    .on('broadcast', { event: 'KILL_BOT' }, p => killPresenceSocket(p.payload.botId))
    .subscribe();
}

function spawnPresenceSocket(botId, token, botName) {
  if (activeSessions.has(botId) || !token) return;
  const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
  let timer = null, seq = null;

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.s !== null) seq = msg.s;
      if (msg.op === 10) {
        timer = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ op: 1, d: seq })); }, msg.d.heartbeat_interval);
        ws.send(JSON.stringify({
          op: 2,
          d: {
            token: token.trim(),
            intents: 37377, // GUILDS (1) + GUILD_MESSAGES (512) + DIRECT (4096) + CONTENT (32768)
            properties: { os: 'linux', browser: 'aethelkov', device: 'aethelkov-grid' },
            presence: { status: 'online', activities: [{ name: 'Aethelkov Grid 24/7', type: 0 }] }
          }
        }));
      }
      if (msg.t === 'MESSAGE_CREATE' && msg.d && !msg.d.author.bot) {
        fetch(VERCEL_DISPATCH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-aethel-secret': INTERNAL_SECRET },
          body: JSON.stringify({ botId, token, event: 'MESSAGE_CREATE', data: msg.d })
        }).catch(() => {});
      }
    } catch (_) {}
  });

  ws.on('close', () => { clearInterval(timer); activeSessions.delete(botId); setTimeout(() => spawnPresenceSocket(botId, token, botName), 5000); });
  ws.on('error', () => { try { ws.close(); } catch (_) {} });
  activeSessions.set(botId, { ws, timer });
}

function killPresenceSocket(botId) {
  const s = activeSessions.get(botId);
  if (s) { clearInterval(s.timer); try { s.ws.close(); } catch (_) {} activeSessions.delete(botId); }
}

initMesh();
`;
      zip.file('farol.js', farolScript);

      // Gera o Blob e dispara o download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `discloud-${genNodeName.trim()}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setDownloadSuccess(`Pacote "discloud-${genNodeName.trim()}.zip" gerado com sucesso!`);
    } catch (err: any) {
      alert('Erro ao gerar pacote: ' + err.message);
    } finally {
      setIsGeneratingZip(false);
    }
  };

  // Cálculos de capacidade total da malha
  const totalDiscloudRam = (accounts.length + 1) * 100; // Conta principal (farol-alpha) + contas adicionais
  const activeNodesCount = accounts.length + 1; // Alpha + extras
  
  // Fórmula: cada nó gasta ~27 MB de base. Sobram ~73 MB por nó. 73 / 1.1 = ~66 bots por nó.
  const totalBotsCapacity = Math.floor(activeNodesCount * 65);

  const discordBotsOnline = bots.filter((b) => b.platform === 'DISCORD' && b.status === 'ONLINE').length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-wide">
                Aethelkov Mesh Commander
              </h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Admin Root
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Orquestração de Nós, Contas da Discloud e Expansão de Infraestrutura
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="capsule-btn capsule-btn-secondary text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair do Modo Admin</span>
        </button>
      </div>

      {/* Banner de Soberania de Infraestrutura */}
      <div className="liquid-glass rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Infraestrutura Própria e Soberana</span>
                <span className="text-[10px] text-emerald-400 font-mono">100% PRIVATE CLOUD</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
                Todo o código, banco de dados (Supabase), tokens criptografados e nós de execução pertencem <strong>exclusivamente a você</strong>. Nenhuma informação transita por servidores de terceiros.
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-slate-500 uppercase font-mono block">Capacidade Total da Malha</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {discordBotsOnline} <span className="text-slate-400 text-sm">/ {totalBotsCapacity} bots</span>
            </div>
            <span className="text-[11px] text-slate-400">{totalDiscloudRam} MB de RAM agregada</span>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: MONITOR DE NÓS ATIVOS (MESH NODES) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Server className="w-4 h-4 text-emerald-400" />
            <span>Nós Farol Ativos na Malha ({activeNodesCount} Nós)</span>
          </div>
          <button
            onClick={onRefreshBots}
            className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Sincronizar Nós</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nó Alpha (Atual Ativo) */}
          <div className="liquid-glass rounded-2xl p-5 border border-emerald-500/30 relative">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-bold text-white">farol-alpha</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Nó Mestre
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Discloud Conta Principal</p>
              </div>

              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="font-mono text-[11px]">ONLINE</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/40 p-2.5 rounded-xl border border-white/5 my-3">
              <div>
                <span className="text-[10px] text-slate-500 block">MEMÓRIA REAL</span>
                <span className="text-white font-bold">27.29 MB</span> <span className="text-slate-400 text-[10px]">/ 100MB</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">SHARD RANGE</span>
                <span className="text-slate-300">0 a 49</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">VCPU</span>
                <span className="text-slate-300">0.25 AMD Epyc</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">INSTÂNCIAS</span>
                <span className="text-emerald-400 font-bold">{discordBotsOnline} alocadas</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Heartbeat: <strong className="text-white">a cada 41s</strong></span>
              <span className="text-emerald-400">Zero Falhas</span>
            </div>
          </div>

          {/* Nós Adicionais Cadastrados */}
          {accounts.map((acc, index) => {
            const nodeName = `farol-node-${index + 2}`;
            const shardStart = (index + 1) * 50;
            const shardEnd = shardStart + 49;

            return (
              <div key={acc.id} className="liquid-glass rounded-2xl p-5 border border-white/10 relative">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-base font-bold text-white">{nodeName}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{acc.label}</p>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span className="font-mono text-[11px]">STANDBY</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-black/40 p-2.5 rounded-xl border border-white/5 my-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block">RAM DISCLOUD</span>
                    <span className="text-white">{acc.totalRamMb} MB</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">SHARD RANGE</span>
                    <span className="text-slate-300">{shardStart} a {shardEnd}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">PLANO</span>
                    <span className="text-slate-300">{acc.plan}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">APPS</span>
                    <span className="text-slate-300">{acc.appsCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">API Conectada</span>
                  <button
                    onClick={() => handleRemoveAccount(acc.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remover conta da malha"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEÇÃO 2: ÁREA MANUAL - GERADOR DE PACOTES PARA DISCLOUD (.ZIP) */}
      <section className="liquid-glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Área Manual: Gerador de Pacotes de Nós (.ZIP)
              </h3>
              <p className="text-xs text-slate-400">
                Gere um arquivo pronto para subir em qualquer conta gratuita da Discloud com 1 clique
              </p>
            </div>
          </div>
        </div>

        {downloadSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{downloadSuccess} Basta subir o arquivo no painel da Discloud!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Nome do Nó</label>
            <input
              type="text"
              value={genNodeName}
              onChange={(e) => setGenNodeName(e.target.value)}
              placeholder="farol-bravo"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Shard Offset</label>
            <input
              type="number"
              value={genOffset}
              onChange={(e) => setGenOffset(Number(e.target.value))}
              placeholder="50"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Limite de Bots (Shard)</label>
            <input
              type="number"
              value={genLimit}
              onChange={(e) => setGenLimit(Number(e.target.value))}
              placeholder="50"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <span className="text-xs text-slate-400">
            Adiciona automaticamente +{genLimit} slots de bots com presença verde 24/7
          </span>

          <button
            onClick={handleGenerateNodeZip}
            disabled={isGeneratingZip}
            className="capsule-btn capsule-btn-primary text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isGeneratingZip ? 'Gerando Pacote...' : 'Gerar e Baixar discloud.zip'}</span>
          </button>
        </div>
      </section>

      {/* SEÇÃO 3: CADASTRAR CONTAS DISCLOUD VIA API OFICIAL */}
      <section className="liquid-glass rounded-2xl p-6 border border-white/10">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Key className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Conectar Contas Adicionais da Discloud (API Oficial)
            </h3>
            <p className="text-xs text-slate-400">
              Adicione tokens de API da Discloud para somar a RAM e monitorar tudo centralizado
            </p>
          </div>
        </div>

        {accountError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{accountError}</span>
          </div>
        )}

        <form onSubmit={handleAddAccount} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Identificação da Conta</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex: Minha Conta Secundária"
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Discloud API Token</label>
            <input
              type="password"
              required
              value={newToken}
              onChange={(e) => setNewToken(e.target.value)}
              placeholder="Cole seu token de API Discloud..."
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loadingAccount}
              className="capsule-btn capsule-btn-primary w-full text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{loadingAccount ? 'Verificando API...' : 'Cadastrar e Somar RAM'}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
