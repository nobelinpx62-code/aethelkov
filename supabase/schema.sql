-- =====================================================================
-- [AETHELKOV CORE DATABASE SCHEMA - SUPABASE POSTGRESQL]
-- Projeto: Aethelkov (Autonomous Hybrid Grid Runtime)
-- Executar no Supabase SQL Editor: https://supabase.com/dashboard/project/rrxrcxutdzedkqaesdkm/sql
-- =====================================================================

-- 1. Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela Mestre de Gerenciamento das Instâncias de Bots
CREATE TABLE IF NOT EXISTS public.aethel_bots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL DEFAULT 'anonymous-default-user',
    bot_name VARCHAR(64) NOT NULL,
    platform VARCHAR(16) NOT NULL CHECK (platform IN ('DISCORD', 'TELEGRAM')),
    token_encrypted TEXT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'ONLINE' CHECK (status IN ('ONLINE', 'STOPPED', 'CRASHED', 'BOOTING')),
    assigned_node VARCHAR(32) DEFAULT 'farol-alpha',
    ram_limit_mb INTEGER NOT NULL DEFAULT 100 CHECK (ram_limit_mb <= 100),
    main_file VARCHAR(64) NOT NULL DEFAULT 'index.js',
    config_type VARCHAR(16) NOT NULL DEFAULT 'aethel' CHECK (config_type IN ('aethel', 'discloud')),
    storage_size_bytes BIGINT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Telemetria e Logs Rápidos em Tempo Real
CREATE TABLE IF NOT EXISTS public.aethel_logs (
    id BIGSERIAL PRIMARY KEY,
    bot_id UUID REFERENCES public.aethel_bots(id) ON DELETE CASCADE,
    log_level VARCHAR(8) DEFAULT 'INFO' CHECK (log_level IN ('INFO', 'WARN', 'ERROR', 'GATEWAY', 'DISPATCH')),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Índices de Performance Crítica para o Farol e Dashboard
CREATE INDEX IF NOT EXISTS idx_aethel_bots_node_status ON public.aethel_bots(assigned_node, status);
CREATE INDEX IF NOT EXISTS idx_aethel_bots_platform ON public.aethel_bots(platform);
CREATE INDEX IF NOT EXISTS idx_aethel_logs_bot_id_created ON public.aethel_logs(bot_id, created_at DESC);

-- 5. Configuração de Row Level Security (RLS) permissivo para chave Publishable/Anon
ALTER TABLE public.aethel_bots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aethel_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para aethel_bots
DROP POLICY IF EXISTS "Public access to aethel_bots" ON public.aethel_bots;
CREATE POLICY "Public access to aethel_bots" 
ON public.aethel_bots
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Políticas para aethel_logs
DROP POLICY IF EXISTS "Public access to aethel_logs" ON public.aethel_logs;
CREATE POLICY "Public access to aethel_logs" 
ON public.aethel_logs
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 6. Habilita Realtime no Supabase para as tabelas essenciais
-- Isso permite streaming de logs e dispatch instantâneo de SPAWN_BOT / KILL_BOT
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.aethel_bots;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.aethel_logs;
    EXCEPTION WHEN duplicate_object THEN
        NULL;
    END;
END $$;

-- 7. Configuração do Bucket de Storage Seguro (Cota Estrita de 100 MB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'aethel-deployments', 
    'aethel-deployments', 
    true, 
    104857600, -- 100 MB exatos em bytes (100 * 1024 * 1024)
    ARRAY['application/zip', 'application/x-zip-compressed', 'multipart/x-zip']
)
ON CONFLICT (id) DO UPDATE 
SET file_size_limit = 104857600,
    public = true;

-- Políticas de Storage para uploads de deployments
DROP POLICY IF EXISTS "Permitir upload de deployments" ON storage.objects;
CREATE POLICY "Permitir upload de deployments"
ON storage.objects FOR ALL
TO anon, authenticated
USING (bucket_id = 'aethel-deployments')
WITH CHECK (bucket_id = 'aethel-deployments');

