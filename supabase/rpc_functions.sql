-- =====================================================================
-- [AETHELKOV CORE RPC FUNCTIONS - SUPABASE POSTGRESQL]
-- Projeto: Aethelkov (Autonomous Hybrid Grid Runtime)
-- Executar no Supabase SQL Editor: https://supabase.com/dashboard/project/rrxrcxutdzedkqaesdkm/sql
-- =====================================================================

-- ---------------------------------------------------------------------
-- FUNÇÃO 1: register_or_update_bot
-- Descrição: Registra uma nova instância de bot ou atualiza existente
-- Parâmetros:
--   p_user_id (TEXT): Identificador do usuário
--   p_bot_name (TEXT): Nome de exibição do bot
--   p_platform (TEXT): 'DISCORD' ou 'TELEGRAM'
--   p_token_encrypted (TEXT): Token do bot (Discord ou Telegram)
--   p_ram_limit_mb (INT): Limite de memória (máximo 100 MB)
--   p_main_file (TEXT): Arquivo de entrada (ex: index.js ou bot.py)
--   p_config_type (TEXT): 'aethel' ou 'discloud'
--   p_assigned_node (TEXT): Nó do Farol responsável (ex: 'farol-alpha')
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_or_update_bot(
    p_user_id TEXT,
    p_bot_name TEXT,
    p_platform TEXT,
    p_token_encrypted TEXT,
    p_ram_limit_mb INT DEFAULT 100,
    p_main_file TEXT DEFAULT 'index.js',
    p_config_type TEXT DEFAULT 'aethel',
    p_assigned_node TEXT DEFAULT 'farol-alpha'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_bot_id UUID;
    v_validated_ram INT;
BEGIN
    -- Validação de cota estrita de RAM (não pode exceder 100 MB)
    IF p_ram_limit_mb > 100 THEN
        v_validated_ram := 100;
    ELSE
        v_validated_ram := GREATEST(p_ram_limit_mb, 25);
    END IF;

    -- Validação de plataforma
    IF p_platform NOT IN ('DISCORD', 'TELEGRAM') THEN
        RAISE EXCEPTION 'Plataforma inválida. Use DISCORD ou TELEGRAM.';
    END IF;

    -- Upsert na tabela aethel_bots
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
        NOW()
    )
    RETURNING id INTO v_bot_id;

    -- Registra o log inicial de bootstrap
    INSERT INTO public.aethel_logs (bot_id, log_level, message)
    VALUES (
        v_bot_id, 
        'INFO', 
        format('[Aethel-Core] Instância "%s" criada e provisionada no nó "%s" (RAM: %s MB).', p_bot_name, p_assigned_node, v_validated_ram)
    );

    RETURN jsonb_build_object(
        'success', true,
        'bot_id', v_bot_id,
        'bot_name', p_bot_name,
        'platform', p_platform,
        'status', 'ONLINE',
        'node', p_assigned_node
    );
END;
$$;


-- ---------------------------------------------------------------------
-- FUNÇÃO 2: log_aethel_event
-- Descrição: Insere logs de execução/telemetria e remove excedentes (>500 logs)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_aethel_event(
    p_bot_id UUID,
    p_log_level TEXT,
    p_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id BIGINT;
BEGIN
    INSERT INTO public.aethel_logs (bot_id, log_level, message)
    VALUES (p_bot_id, COALESCE(p_log_level, 'INFO'), p_message)
    RETURNING id INTO v_log_id;

    -- Limpeza automática de histórico antigo para economizar espaço
    DELETE FROM public.aethel_logs
    WHERE bot_id = p_bot_id 
      AND id NOT IN (
          SELECT id FROM public.aethel_logs 
          WHERE bot_id = p_bot_id 
          ORDER BY created_at DESC 
          LIMIT 500
      );

    RETURN jsonb_build_object('success', true, 'log_id', v_log_id);
END;
$$;


-- ---------------------------------------------------------------------
-- FUNÇÃO 3: get_active_bots_for_node
-- Descrição: Chamada pelos nós Aethel-Farol para obter os bots do seu shard
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_active_bots_for_node(
    p_node_id TEXT,
    p_shard_offset INT DEFAULT 0,
    p_shard_limit INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    bot_name VARCHAR(64),
    platform VARCHAR(16),
    token_encrypted TEXT,
    status VARCHAR(16),
    assigned_node VARCHAR(32),
    ram_limit_mb INT,
    main_file VARCHAR(64),
    config_type VARCHAR(16)
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        b.id,
        b.bot_name,
        b.platform,
        b.token_encrypted,
        b.status,
        b.assigned_node,
        b.ram_limit_mb,
        b.main_file,
        b.config_type
    FROM public.aethel_bots b
    WHERE b.platform = 'DISCORD'
      AND b.status = 'ONLINE'
      AND (b.assigned_node = p_node_id OR b.assigned_node IS NULL)
    ORDER BY b.created_at ASC
    OFFSET p_shard_offset
    LIMIT p_shard_limit;
$$;


-- ---------------------------------------------------------------------
-- FUNÇÃO 4: set_bot_status
-- Descrição: Altera o estado do bot (ONLINE, STOPPED, CRASHED, BOOTING)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_bot_status(
    p_bot_id UUID,
    p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.aethel_bots
    SET status = p_status,
        updated_at = NOW()
    WHERE id = p_bot_id;

    INSERT INTO public.aethel_logs (bot_id, log_level, message)
    VALUES (p_bot_id, 'GATEWAY', format('[Aethel-State] Status alterado para: %s', p_status));

    RETURN jsonb_build_object('success', true, 'bot_id', p_bot_id, 'status', p_status);
END;
$$;


-- ---------------------------------------------------------------------
-- FUNÇÃO 5: get_cluster_stats
-- Descrição: Retorna estatísticas em tempo real para o HUD do Dashboard
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_cluster_stats()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_bots INT;
    v_online_bots INT;
    v_discord_bots INT;
    v_telegram_bots INT;
    v_est_ram_mb NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_total_bots FROM public.aethel_bots;
    SELECT COUNT(*) INTO v_online_bots FROM public.aethel_bots WHERE status = 'ONLINE';
    SELECT COUNT(*) INTO v_discord_bots FROM public.aethel_bots WHERE platform = 'DISCORD' AND status = 'ONLINE';
    SELECT COUNT(*) INTO v_telegram_bots FROM public.aethel_bots WHERE platform = 'TELEGRAM' AND status = 'ONLINE';
    
    -- No Farol sem discord.js, cada bot Discord gasta ~1.0 MB de RAM.
    -- Bots Telegram rodam 100% serverless na Vercel (0 MB residentes).
    v_est_ram_mb := (v_discord_bots * 1.05);

    RETURN jsonb_build_object(
        'total_bots', v_total_bots,
        'online_bots', v_online_bots,
        'discord_bots', v_discord_bots,
        'telegram_bots', v_telegram_bots,
        'estimated_ram_mb', ROUND(v_est_ram_mb, 2),
        'discloud_quota_mb', 100,
        'monthly_cost_brl', 0.00
    );
END;
$$;

