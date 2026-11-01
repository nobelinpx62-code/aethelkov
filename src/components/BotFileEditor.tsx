'use client';

import React, { useState, useMemo } from 'react';
import { 
  Folder, 
  FolderOpen, 
  FileCode, 
  FileText, 
  FileJson, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Code2, 
  Eye, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Layers,
  FileCheck
} from 'lucide-react';

interface BotFileEditorProps {
  botName: string;
  mainFile: string;
  tokenEncrypted: string;
  ramLimitMb: number;
  platform: string;
  onSave: (files: Record<string, string>, currentFile: string) => Promise<void>;
  isSaving: boolean;
  saveToast: string | null;
}

// Tokenizador de Sintaxe Seguro de Alta Performance (One Dark / Apple Glass Style)
export function highlightCode(code: string, fileName: string): string {
  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const isEnv = fileName.endsWith('.env') || fileName.endsWith('.config');

  if (isEnv) {
    return code
      .split('\n')
      .map((line) => {
        if (line.trim().startsWith('#')) {
          return `<span class="text-neutral-500 italic">${escapeHtml(line)}</span>`;
        }
        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
          const key = line.slice(0, eqIdx);
          const val = line.slice(eqIdx + 1);
          return `<span class="text-cyan-400 font-semibold">${escapeHtml(key)}</span><span class="text-neutral-400">=</span><span class="text-emerald-300 font-medium">${escapeHtml(val)}</span>`;
        }
        return escapeHtml(line);
      })
      .join('\n');
  }

  // Regex de Tokenização em 1 Passagem
  const TOKEN_REGEX = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|if|else|import|export|from|async|await|class|new|try|catch|throw|module|exports|require|default|switch|case|break|while|for|of|in|extends|super)\b)|(\b(?:true|false|null|undefined)\b)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\())|([{}()[\].,;:+\-*/%=<>!&|^~?]+)|(\s+)|([^a-zA-Z0-9_\s{}()[\].,;:+\-*/%=<>!&|^~?]+)/g;

  return code
    .split('\n')
    .map((line) => {
      let out = '';
      let match: RegExpExecArray | null;
      TOKEN_REGEX.lastIndex = 0;

      while ((match = TOKEN_REGEX.exec(line)) !== null) {
        const [
          raw,
          comment,
          str,
          keyword,
          primitive,
          num,
          fnCall,
          operator,
          whitespace,
          other,
        ] = match;

        if (comment) {
          out += `<span class="text-neutral-500 italic">${escapeHtml(comment)}</span>`;
        } else if (str) {
          out += `<span class="text-emerald-300">${escapeHtml(str)}</span>`;
        } else if (keyword) {
          out += `<span class="text-purple-400 font-semibold">${escapeHtml(keyword)}</span>`;
        } else if (primitive) {
          out += `<span class="text-rose-400 font-semibold">${escapeHtml(primitive)}</span>`;
        } else if (num) {
          out += `<span class="text-amber-300">${escapeHtml(num)}</span>`;
        } else if (fnCall) {
          out += `<span class="text-cyan-300 font-medium">${escapeHtml(fnCall)}</span>`;
        } else if (operator) {
          out += `<span class="text-neutral-400">${escapeHtml(operator)}</span>`;
        } else if (whitespace) {
          out += whitespace;
        } else if (other) {
          out += escapeHtml(other);
        } else {
          out += escapeHtml(raw);
        }
      }

      return out || '&nbsp;';
    })
    .join('\n');
}

export const BotFileEditor: React.FC<BotFileEditorProps> = ({
  botName,
  mainFile,
  tokenEncrypted,
  ramLimitMb,
  platform,
  onSave,
  isSaving,
  saveToast,
}) => {
  // Arquivos em árvore hierárquica preparados para pastas e subpastas
  const [files, setFiles] = useState<Record<string, string>>({
    'aethel.config': `NAME=${botName}\nTYPE=bot\nMAIN=${mainFile || 'index.js'}\nRAM=${ramLimitMb || 100}\nPLATFORM=${platform}\nAUTORESTART=true\nVERSION=latest`,
    [mainFile || 'index.js']: `/**\n * ${botName} - Main Entry Point\n * Executado na malha de nós Aethel Kov\n */\nconst { Client } = require('ws');\n\nconsole.log('[Aethel-Runner] Instância inicializada com sucesso!');\n\nmodule.exports = {\n  ready: () => {\n    console.log('Bot conectado 24/7 com latência < 20ms!');\n  },\n  message: (msg) => {\n    if (msg.content === '!ping') {\n      msg.reply('Pong! Latência da Malha: 18ms.');\n    }\n  }\n};`,
    'package.json': `{\n  "name": "${botName.toLowerCase().replace(/[^a-z0-9]/g, '-')}",\n  "version": "1.0.0",\n  "main": "${mainFile || 'index.js'}",\n  "dependencies": {\n    "ws": "^8.18.0"\n  }\n}`,
    '.env': `TOKEN=${tokenEncrypted ? '••••••••••••••••' : ''}\nPREFIX=!\nNODE_ENV=production`,
    'src/commands/ping.js': `// Comando de Teste de Latência\nmodule.exports = {\n  name: 'ping',\n  description: 'Retorna a latência atual do bot',\n  execute: (message) => {\n    message.reply('Pong! Heartbeat ativo na Aethel Kov.');\n  }\n};`,
    'src/commands/help.js': `// Comando de Ajuda\nmodule.exports = {\n  name: 'help',\n  description: 'Lista de comandos disponíveis',\n  execute: (message) => {\n    message.reply('Comandos: !ping, !help, !status.');\n  }\n};`,
    'src/events/ready.js': `// Evento disparado quando a conexão é estabelecida\nmodule.exports = {\n  event: 'ready',\n  once: true,\n  run: (client) => {\n    console.log('[Aethel-Runner] Event Ready disparado com sucesso!');\n  }\n};`,
    'config/settings.json': `{\n  "autoRestart": true,\n  "maxMemoryMb": ${ramLimitMb || 100},\n  "logLevel": "DEBUG",\n  "heartbeatIntervalMs": 800\n}`
  });

  const [selectedFile, setSelectedFile] = useState<string>(mainFile || 'index.js');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'edit' | 'split' | 'highlight'>('split');
  const [newFileInputOpen, setNewFileInputOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFolderInputOpen, setNewFolderInputOpen] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');

  // Agrupamento hierárquico em pastas e arquivos
  const fileTree = useMemo(() => {
    const tree: { folders: Record<string, string[]>; rootFiles: string[] } = {
      folders: {},
      rootFiles: [],
    };

    Object.keys(files).sort().forEach((path) => {
      if (path.includes('/')) {
        const parts = path.split('/');
        const folder = parts.slice(0, -1).join('/');
        if (!tree.folders[folder]) {
          tree.folders[folder] = [];
        }
        tree.folders[folder].push(path);
      } else {
        tree.rootFiles.push(path);
      }
    });

    return tree;
  }, [files]);

  const toggleFolder = (folder: string) => {
    setCollapsedFolders((prev) => ({ ...prev, [folder]: !prev[folder] }));
  };

  const handleCreateFile = () => {
    if (!newFilePath.trim()) return;
    const cleanPath = newFilePath.trim().replace(/^\/+/, '');
    if (files[cleanPath]) {
      alert('Já existe um arquivo com este nome.');
      return;
    }

    setFiles((prev) => ({
      ...prev,
      [cleanPath]: cleanPath.endsWith('.json') 
        ? '{\n  "version": "1.0.0"\n}' 
        : cleanPath.endsWith('.env')
        ? 'KEY=VALUE'
        : `// ${cleanPath}\nconsole.log('Arquivo criado via Editor Aethel');\n`,
    }));
    setSelectedFile(cleanPath);
    setNewFilePath('');
    setNewFileInputOpen(false);
  };

  const handleCreateFolder = () => {
    if (!newFolderPath.trim()) return;
    const cleanFolder = newFolderPath.trim().replace(/^\/+|\/+$/g, '');
    const placeholderFile = `${cleanFolder}/index.js`;
    if (files[placeholderFile]) {
      alert('Esta pasta já existe.');
      return;
    }

    setFiles((prev) => ({
      ...prev,
      [placeholderFile]: `// Módulo ${cleanFolder}\nmodule.exports = {};\n`,
    }));
    setSelectedFile(placeholderFile);
    setNewFolderPath('');
    setNewFolderInputOpen(false);
  };

  const handleDeleteCurrentFile = () => {
    if (Object.keys(files).length <= 1) {
      alert('Você não pode excluir o único arquivo restante.');
      return;
    }
    if (confirm(`Tem certeza que deseja excluir o arquivo "${selectedFile}"?`)) {
      const nextFiles = { ...files };
      delete nextFiles[selectedFile];
      setFiles(nextFiles);
      setSelectedFile(Object.keys(nextFiles)[0]);
    }
  };

  const currentContent = files[selectedFile] || '';
  const currentLinesCount = currentContent.split('\n').length;
  const currentSizeBytes = new Blob([currentContent]).size;
  const currentSizeFormatted =
    currentSizeBytes < 1024
      ? `${currentSizeBytes} B`
      : `${(currentSizeBytes / 1024).toFixed(1)} KB`;

  const highlightedHtml = useMemo(() => {
    return highlightCode(currentContent, selectedFile);
  }, [currentContent, selectedFile]);

  // Ícone específico para cada extensão
  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      return <FileCode className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
    if (fileName.endsWith('.json')) {
      return <FileJson className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    }
    if (fileName.endsWith('.env') || fileName.endsWith('.config')) {
      return <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    return <FileCode className="w-3.5 h-3.5 text-neutral-400 shrink-0" />;
  };

  return (
    <div className="apple-glass-card rounded-[28px] sm:rounded-[36px] overflow-hidden border border-white/12 shadow-[0_30px_70px_rgba(0,0,0,0.7)] animate-fadeIn">
      {/* Topo do Editor de Arquivos */}
      <div className="p-4 sm:p-5 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-400/30 text-cyan-300">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-sans text-sm font-semibold text-white flex items-center gap-2">
              <span>Editor de Código com Pastas & Syntax Highlighting</span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                <Sparkles className="w-2.5 h-2.5" /> Hot-Reload Ativo
              </span>
            </h4>
            <p className="font-mono text-[11px] text-neutral-400">
              Arquivo ativo: <span className="text-cyan-300">{selectedFile}</span> ({currentSizeFormatted})
            </p>
          </div>
        </div>

        {/* Modos de Visualização & Botão Salvar */}
        <div className="flex items-center gap-2">
          {/* Seletor de Modo: Edição / Lado a Lado / Destaque */}
          <div className="hidden sm:flex rounded-full bg-black/50 p-1 border border-white/10 font-mono text-xs">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1 rounded-full transition-all ${
                viewMode === 'edit'
                  ? 'bg-white/20 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-full transition-all ${
                viewMode === 'split'
                  ? 'bg-white/20 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Lado a Lado
            </button>
            <button
              type="button"
              onClick={() => setViewMode('highlight')}
              className={`px-3 py-1 rounded-full transition-all ${
                viewMode === 'highlight'
                  ? 'bg-white/20 text-white font-medium shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Realce
            </button>
          </div>

          <button
            type="button"
            onClick={() => onSave(files, selectedFile)}
            disabled={isSaving}
            className="apple-pill-btn apple-pill-primary flex items-center gap-2 rounded-full px-4 sm:px-5 py-2 text-xs font-semibold text-white disabled:opacity-50 shadow-md active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Aplicando Hot-Reload...' : 'Salvar & Atualizar Bot'}</span>
          </button>
        </div>
      </div>

      {/* Toast de Sucesso */}
      {saveToast && (
        <div className="p-3 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Grid Principal: Árvore de Pastas & Arquivos (Esquerda) + Editor (Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
        
        {/* ========================================================
            BARRA LATERAL: EXPLORER HIERÁRQUICO DE PASTAS E ARQUIVOS
           ======================================================== */}
        <div className="lg:col-span-3 bg-black/50 p-3 sm:p-4 border-r border-white/10 flex flex-col justify-between font-mono text-xs">
          <div className="space-y-3">
            {/* Cabeçalho do Explorer com Ações para Criar Arquivo/Pasta */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Pastas & Arquivos</span>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setNewFileInputOpen((prev) => !prev);
                    setNewFolderInputOpen(false);
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                  title="Criar novo arquivo (ex: src/commands/avatar.js)"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNewFolderInputOpen((prev) => !prev);
                    setNewFileInputOpen(false);
                  }}
                  className="p-1 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
                  title="Criar nova pasta (ex: handlers)"
                >
                  <Folder className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCurrentFile}
                  className="p-1 rounded-lg hover:bg-rose-500/10 text-neutral-400 hover:text-rose-400 transition-colors"
                  title="Excluir arquivo ativo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Input para Novo Arquivo */}
            {newFileInputOpen && (
              <div className="p-2.5 rounded-xl bg-white/5 border border-cyan-400/40 space-y-2 animate-fadeIn">
                <span className="text-[10px] text-cyan-300 block">Novo Arquivo (ex: src/utils.js)</span>
                <input
                  type="text"
                  value={newFilePath}
                  onChange={(e) => setNewFilePath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
                  placeholder="caminho/arquivo.js"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewFileInputOpen(false)}
                    className="px-2 py-0.5 rounded text-[10px] text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateFile}
                    className="px-2.5 py-0.5 rounded bg-cyan-500 text-black font-semibold text-[10px]"
                  >
                    Criar
                  </button>
                </div>
              </div>
            )}

            {/* Input para Nova Pasta */}
            {newFolderInputOpen && (
              <div className="p-2.5 rounded-xl bg-white/5 border border-amber-400/40 space-y-2 animate-fadeIn">
                <span className="text-[10px] text-amber-300 block">Nova Pasta (ex: handlers)</span>
                <input
                  type="text"
                  value={newFolderPath}
                  onChange={(e) => setNewFolderPath(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  placeholder="nome-da-pasta"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-white placeholder-neutral-500 text-xs focus:outline-none focus:border-amber-400"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setNewFolderInputOpen(false)}
                    className="px-2 py-0.5 rounded text-[10px] text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="px-2.5 py-0.5 rounded bg-amber-400 text-black font-semibold text-[10px]"
                  >
                    Criar Pasta
                  </button>
                </div>
              </div>
            )}

            {/* LISTA HIERÁRQUICA: Pastas Agrupadas */}
            <div className="space-y-1 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
              {Object.entries(fileTree.folders).map(([folderName, folderFiles]) => {
                const isCollapsed = collapsedFolders[folderName];

                return (
                  <div key={folderName} className="space-y-0.5">
                    {/* Botão da Pasta */}
                    <button
                      type="button"
                      onClick={() => toggleFolder(folderName)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-white/5 text-neutral-300 hover:text-white transition-colors group"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {isCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-300 shrink-0" />
                        )}
                        {isCollapsed ? (
                          <Folder className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : (
                          <FolderOpen className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        )}
                        <span className="truncate font-semibold text-xs">{folderName}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {folderFiles.length}
                      </span>
                    </button>

                    {/* Arquivos Dentro da Pasta */}
                    {!isCollapsed && (
                      <div className="pl-4 space-y-0.5 border-l border-white/10 ml-2">
                        {folderFiles.map((filePath) => {
                          const isActive = selectedFile === filePath;
                          const fileName = filePath.split('/').pop() || filePath;

                          return (
                            <button
                              key={filePath}
                              type="button"
                              onClick={() => setSelectedFile(filePath)}
                              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left transition-colors ${
                                isActive
                                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold'
                                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {getFileIcon(fileName)}
                                <span className="truncate">{fileName}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Arquivos na Raiz */}
              {fileTree.rootFiles.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-0.5">
                  <span className="text-[10px] font-semibold text-neutral-500 uppercase px-2 mb-1 block">
                    Raiz do Projeto
                  </span>
                  {fileTree.rootFiles.map((filePath) => {
                    const isActive = selectedFile === filePath;

                    return (
                      <button
                        key={filePath}
                        type="button"
                        onClick={() => setSelectedFile(filePath)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                          isActive
                            ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-semibold'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {getFileIcon(filePath)}
                          <span className="truncate">{filePath}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 text-[10px] text-neutral-400 flex items-center justify-between">
            <span>Total: {Object.keys(files).length} arquivos</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <FileCheck className="w-3 h-3" /> Sync Ativo
            </span>
          </div>
        </div>

        {/* ========================================================
            PAINEL DO EDITOR COM SYNTAX HIGHLIGHTING & NÚMEROS DE LINHA
           ======================================================== */}
        <div className="lg:col-span-9 bg-[#08090c] p-3 sm:p-5 flex flex-col justify-between">
          
          {/* Visualização: Lado a Lado ou Único */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-[380px]">
            
            {/* Coluna de Edição / Textarea */}
            {(viewMode === 'edit' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'md:col-span-6' : 'md:col-span-12'} flex flex-col`}>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="font-mono text-[11px] text-neutral-400 flex items-center gap-1.5">
                    <Code2 className="w-3 h-3 text-cyan-400" />
                    <span>Área de Escrita / Edição</span>
                  </span>
                  <span className="font-mono text-[10px] text-neutral-500">
                    Suporta indentação com Tab
                  </span>
                </div>

                <div className="relative flex-1 rounded-2xl bg-black/60 border border-white/10 overflow-hidden flex">
                  {/* Gutter com Números de Linha */}
                  <div className="py-4 px-2.5 bg-black/40 border-r border-white/5 text-neutral-600 font-mono text-xs select-none text-right">
                    {Array.from({ length: currentLinesCount }, (_, i) => (
                      <div key={i + 1} className="leading-relaxed">
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Textarea Interativo */}
                  <textarea
                    value={currentContent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFiles((prev) => ({ ...prev, [selectedFile]: val }));
                    }}
                    onKeyDown={(e) => {
                      // Suporte a indentação com tecla Tab (2 espaços)
                      if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = e.currentTarget.selectionStart;
                        const end = e.currentTarget.selectionEnd;
                        const val = currentContent;
                        const updated = val.substring(0, start) + '  ' + val.substring(end);
                        setFiles((prev) => ({ ...prev, [selectedFile]: updated }));
                        setTimeout(() => {
                          e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                        }, 0);
                      }
                    }}
                    spellCheck={false}
                    className="w-full h-full min-h-[360px] p-4 bg-transparent font-mono text-xs text-neutral-200 leading-relaxed focus:outline-none resize-none custom-scrollbar"
                    placeholder="// Digite ou cole seu código aqui..."
                  />
                </div>
              </div>
            )}

            {/* Coluna com Syntax Highlighting em Tempo Real */}
            {(viewMode === 'highlight' || viewMode === 'split') && (
              <div className={`${viewMode === 'split' ? 'md:col-span-6' : 'md:col-span-12'} flex flex-col`}>
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="font-mono text-[11px] text-neutral-400 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Realce de Sintaxe Colorido (One Dark)</span>
                  </span>
                  <span className="font-mono text-[10px] text-emerald-400 font-semibold">
                    Live Preview
                  </span>
                </div>

                <div className="relative flex-1 rounded-2xl bg-[#090b10] border border-white/10 overflow-hidden flex">
                  {/* Gutter com Números de Linha */}
                  <div className="py-4 px-2.5 bg-black/40 border-r border-white/5 text-neutral-600 font-mono text-xs select-none text-right">
                    {Array.from({ length: currentLinesCount }, (_, i) => (
                      <div key={i + 1} className="leading-relaxed">
                        {i + 1}
                      </div>
                    ))}
                  </div>

                  {/* Código Colorido com Cores de Sintaxe */}
                  <div className="w-full h-full min-h-[360px] p-4 font-mono text-xs text-neutral-200 leading-relaxed overflow-auto custom-scrollbar select-text whitespace-pre">
                    <code
                      dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Barra de Status Inferior do Editor */}
          <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400 font-mono">
            <div className="flex items-center gap-3">
              <span>Linhas: <strong className="text-white">{currentLinesCount}</strong></span>
              <span>&bull;</span>
              <span>Tamanho: <strong className="text-white">{currentSizeFormatted}</strong></span>
              <span>&bull;</span>
              <span>Encoding: <strong className="text-neutral-300">UTF-8</strong></span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Pronto para Deploy & Hot-Reload</span>
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
