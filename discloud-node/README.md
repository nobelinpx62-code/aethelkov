# 🚀 Aethel-Farol (Daemon de Presença para Discloud)

Este é o nó do **Farol da Aethelkov**, desenvolvido para rodar no plano gratuito da Discloud com consumo microscópico de RAM (~1 MB por bot Discord) e zero custo.

## 📦 Como Subir na Discloud

1. Execute o script na raiz do projeto:
   ```powershell
   .\zip_para_discloud.ps1
   ```
2. O script vai gerar o arquivo `discloud.zip` na raiz.
3. Acesse o painel da Discloud (https://discloud.app) ou use o bot da Discloud no Discord (`.upload`).
4. Arraste e solte o arquivo `discloud.zip`.
5. Pronto! O nó inicializará como `aethel-farol-alpha` e conectará automaticamente todas as instâncias cadastradas no Supabase.

## ⚙️ Variáveis de Ambiente na Discloud
Você pode definir as variáveis no painel da Discloud ou usar o arquivo `.env`:
* `AETHEL_SUPABASE_URL`: URL do Supabase (`https://rrxrcxutdzedkqaesdkm.supabase.co`)
* `AETHEL_SUPABASE_KEY`: Chave publishable do Supabase
* `AETHEL_DISPATCH_URL`: URL da sua API na Vercel (`https://seu-app.vercel.app/api/dispatch`)
* `AETHEL_INTERNAL_SECRET`: Chave secreta de autenticação interna
* `AETHEL_NODE_ID`: Nome do nó (ex: `farol-alpha`)
* `AETHEL_SHARD_OFFSET`: Offset da fatia de bots (ex: `0` para o primeiro nó, `50` para o segundo)
* `AETHEL_SHARD_LIMIT`: Quantidade de bots que este nó gerencia (ex: `50`)

