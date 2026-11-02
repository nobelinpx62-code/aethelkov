-- =====================================================================
-- [AETHELKOV UPGRADE v3.0 - UNIVERSAL SHIM & AUDIO CLUSTER DDL]
-- Executar no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rrxrcxutdzedkqaesdkm/sql
-- =====================================================================

-- 1. Habilita extensões UUID caso ainda não estejam ativas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Nós Lavalink Compartilhados (Audio Cluster)
CREATE TABLE IF NOT EXISTS public.aethel_lavalink_nodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(64) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL DEFAULT 2333,
    password VARCHAR(255) NOT NULL,
    secure BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    load_metric INTEGER DEFAULT 0, -- quantidade de bots de áudio conectados
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS para tabela de nós Lavalink
ALTER TABLE public.aethel_lavalink_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to aethel_lavalink_nodes" ON public.aethel_lavalink_nodes;
CREATE POLICY "Public access to aethel_lavalink_nodes" 
ON public.aethel_lavalink_nodes
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. Insere nós Lavalink padrão da comunidade para uso imediato
INSERT INTO public.aethel_lavalink_nodes (name, host, port, password, secure)
VALUES 
    ('Lavalink-US-01', 'lava-v3.ajieblogs.eu.org', 443, 'https://dsc.gg/ajidevserver', true),
    ('Lavalink-EU-01', 'lavalink.serenetia.com', 443, 'youshallnotpass', true)
ON CONFLICT DO NOTHING;

-- 4. Atualização na tabela aethel_bots para suporte ao Universal Shim e Lavalink
ALTER TABLE public.aethel_bots
ADD COLUMN IF NOT EXISTS runtime_mode VARCHAR(32) DEFAULT 'UNIVERSAL_SHIM_v3',
ADD COLUMN IF NOT EXISTS assigned_lavalink_id UUID REFERENCES public.aethel_lavalink_nodes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS detected_entrypoint VARCHAR(64) DEFAULT 'index.js',
ADD COLUMN IF NOT EXISTS cron_interval_sec INTEGER DEFAULT 0;

-- 5. Atualiza a função register_or_update_bot para incluir os novos campos caso seja chamada
CREATE OR REPLACE FUNCTION public.register_or_update_bot_v3(
    p_user_id TEXT,
    p_bot_name TEXT,
    p_platform TEXT,
    p_token_encrypted TEXT,
    p_ram_limit_mb INT DEFAULT 100,
    p_main_file TEXT DEFAULT 'index.js',
    p_config_type TEXT DEFAULT 'aethel',
    p_assigned_node TEXT DEFAULT 'farol-alpha',
    p_runtime_mode TEXT DEFAULT 'UNIVERSAL_SHIM_v3',
    p_cron_interval_sec INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bot_id UUID;
    v_lavalink_id UUID;
    v_validated_ram INT;
BEGIN
    v_validated_ram := LEAST(GREATEST(p_ram_limit_mb, 100), 100);

    -- Seleciona nó lavalink ativo com menor carga
    SELECT id INTO v_lavalink_id FROM public.aethel_lavalink_nodes
    WHERE is_active = true
    ORDER BY load_metric ASC
    LIMIT 1;

    INSERT INTO public.aethel_bots (
        user_id,
        bot_name,
        platform,
        token_encrypted,
        status,
        assigned_node,
        ram_limit_mb,
        main_file,
        config_type,
        runtime_mode,
        assigned_lavalink_id,
        detected_entrypoint,
        cron_interval_sec,
        updated_at
    ) VALUES (
        COALESCE(p_user_id, 'anonymous-default-user'),
        p_bot_name,
        p_platform,
        p_token_encrypted,
        'ONLINE',
        COALESCE(p_assigned_node, 'farol-alpha'),
        v_validated_ram,
        COALESCE(p_main_file, 'index.js'),
        COALESCE(p_config_type, 'aethel'),
        COALESCE(p_runtime_mode, 'UNIVERSAL_SHIM_v3'),
        v_lavalink_id,
        COALESCE(p_main_file, 'index.js'),
        COALESCE(p_cron_interval_sec, 0),
        NOW()
    )
    RETURNING id INTO v_bot_id;

    RETURN jsonb_build_object(
        'success', true,
        'bot_id', v_bot_id,
        'bot_name', p_bot_name,
        'platform', p_platform,
        'status', 'ONLINE',
        'lavalink_id', v_lavalink_id
    );
END;
$$;

