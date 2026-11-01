# ⚡ AETHELKOV (AUTONOMOUS HYBRID GRID RUNTIME)

> **Plataforma autônoma de hospedagem profissional de bots (Discord e Telegram) e workers com infraestrutura de custo zero absoluto (R$ 0,00).**

A Aethelkov emancipa o desenvolvedor da necessidade de VPSs pagas utilizando o **desacoplamento de Gateway (Persistent Heartbeat) e Execução Sob Demanda (Serverless)**.

---

## 🏛️ Topologia de 3 Camadas

```
                            [ USUÁRIO / DESENVOLVEDOR ]
                                         │
                      (Upload de .zip com aethel/discloud.config)
                                         ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      CAMADA 1: AETHELKOV CONTROL PLANE (Vercel)                        │
│ - Frontend Dashboard em Liquid Glass                                                  │
│ - APIs Serverless de alta performance (Next.js / Node.js / TypeScript)                │
│ - Parse e validação de aethel.config / discloud.config                                │
│ - Dispatcher sob demanda via Webhooks e REST                                          │
│ - Processamento nativo 100% serverless de Bots de Telegram (via Webhooks diretos)     │
└───────────────────┬────────────────────────────────────────────────┬───────────────────┘
                    │                                                │
         (Armazena arquivos .zip)                         (Notifica novos bots)
                    │                                                │
                    ▼                                                ▼
┌──────────────────────────────────────┐     ┌───────────────────────────────────────────┐
│     CAMADA 2: STATE VAULT            │     │    CAMADA 3: AETHEL-FAROL CLUSTER         │
│         (Supabase)                   │     │           (Discloud Nodes)                │
│ - Storage Buckets (Cota 100 MB)      │     │ - Processos invisíveis (TYPE=bot)         │
│ - PostgreSQL DB (Metadados/Tokens)   │     │ - Roda WebSocket Puro (Biblioteca ws)     │
│ - Realtime Pub/Sub (Coordenação)     │◄───►│ - Zero Cache de Memória (Sem discord.js)  │
│ - Terminal Log Streaming             │     │ - Heartbeats (Opcode 1) 24/7 (Status ON)  │
│                                      │     │ - Repassa MESSAGE_CREATE para a Vercel    │
└──────────────────────────────────────┘     └───────────────────────────────────────────┘
```

---

## 🚀 PASSO A PASSO DE IMPLANTAÇÃO COMPLETA

### 1️⃣ PASSO 1: Configurar o Supabase (Banco e RPCs)

1. Acesse o **SQL Editor** do seu projeto no Supabase:
   👉 [https://supabase.com/dashboard/project/rrxrcxutdzedkqaesdkm/sql](https://supabase.com/dashboard/project/rrxrcxutdzedkqaesdkm/sql)
2. Copie e cole todo o conteúdo do arquivo:
   `supabase/schema.sql` (cria tabelas, índices, storage de 100 MB e políticas RLS)
3. Em seguida, copie e execute o arquivo:
   `supabase/rpc_functions.sql` (registra as funções RPC: `register_or_update_bot`, `log_aethel_event`, `get_active_bots_for_node`, `set_bot_status`, `get_cluster_stats`)

---

### 2️⃣ PASSO 2: Subir o Farol na Discloud (Nó de Presença 24/7)

1. Na raiz do projeto, execute o script PowerShell para gerar o zip:
   ```powershell
   .\zip_para_discloud.ps1
   ```
2. O arquivo `discloud.zip` será gerado automaticamente contendo:
   - `discloud.config` (`NAME=aethel-farol-alpha`, `TYPE=bot`, `RAM=100`, `MAIN=farol.js`)
   - `farol.js` (Daemon ultraleve em WebSocket nativo)
   - `package.json`
   - `.env.example`
3. Acesse o painel da Discloud ([discloud.app](https://discloud.app)) ou envie pelo bot no Discord via `.upload`:
   - Envie o arquivo `discloud.zip`.
4. Pronto! O nó Farol estará conectado ao Supabase e pronto para manter seus bots online 24/7.

---

### 3️⃣ PASSO 3: Subir o Control Plane no GitHub e Vercel

1. Crie um repositório no seu GitHub (ex: `aethelkov`).
2. Suba todos os arquivos desta pasta para o seu repositório:
   ```bash
   git init
   git add .
   git commit -m "feat: Aethelkov Hybrid Grid Runtime"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/aethelkov.git
   git push -u origin main
   ```
3. Acesse a [Vercel](https://vercel.com) e clique em **Add New Project** -> importe o repositório.
4. Adicione as variáveis de ambiente na Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://rrxrcxutdzedkqaesdkm.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `sb_publishable_4Q59J9becXPLLqYWiOob0g_RnLJ2pvB`
   - `AETHEL_INTERNAL_SECRET`: `aethel-secret-grid-master-key`
5. Clique em **Deploy**!

---

## 📄 COMPATIBILIDADE DE CONFIGURAÇÃO

A Aethelkov é 100% retrocompatível com qualquer bot já feito para Discloud:

```properties
# Exemplo discloud.config ou aethel.config
NAME=meu-bot-vip
TYPE=bot
MAIN=index.js
RAM=100
AUTORESTART=true
```

Basta zipar seus arquivos e soltar no botão **"Novo Deploy"** do painel Aethelkov!

