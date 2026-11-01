-- ==============================================================================
-- AETHEL KOV INFRASTRUCTURE - SUPABASE AUTH & PROFILES SETUP
-- Execute este script no SQL Editor do seu Dashboard Supabase
-- Link: https://supabase.com/dashboard/project/rrxrcxutdzedkqaesdkm/sql
-- ==============================================================================

-- 1. Criação da Tabela de Perfis de Usuário (Pública)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  discord_id text,
  quota_limit_mb integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilita RLS na tabela de perfis
alter table public.profiles enable row level security;

-- Políticas de RLS para perfis
drop policy if exists "Perfis são visíveis publicamente" on public.profiles;
create policy "Perfis são visíveis publicamente" 
  on public.profiles for select 
  using (true);

drop policy if exists "Usuários podem atualizar seu próprio perfil" on public.profiles;
create policy "Usuários podem atualizar seu próprio perfil" 
  on public.profiles for update 
  using (auth.uid() = id);

-- 2. Trigger Automático para criar perfil ao registrar via Discord ou E-mail
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_display_name text;
  v_avatar_url text;
  v_discord_id text;
begin
  -- Extração inteligente de metadados do Discord ou cadastro por E-mail
  v_display_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'custom_claims'->>'global_name',
    split_part(new.email, '@', 1)
  );

  v_avatar_url := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  v_discord_id := coalesce(
    new.raw_user_meta_data->>'provider_id',
    new.raw_user_meta_data->>'sub'
  );

  insert into public.profiles (id, email, display_name, avatar_url, discord_id, quota_limit_mb)
  values (
    new.id,
    new.email,
    v_display_name,
    v_avatar_url,
    v_discord_id,
    100
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    discord_id = coalesce(excluded.discord_id, public.profiles.discord_id),
    updated_at = now();

  return new;
end;
$$ language plpgsql security definer;

-- Registra o Trigger na tabela nativa auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- 3. Atualização da tabela aethel_bots para isolamento multi-tenant
alter table public.aethel_bots 
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Ativa RLS na tabela de bots
alter table public.aethel_bots enable row level security;

-- Políticas de RLS para aethel_bots:
-- Permite que usuários vejam seus próprios bots ou bots livres do demo
drop policy if exists "Usuários podem ver seus próprios bots" on public.aethel_bots;
create policy "Usuários podem ver seus próprios bots" 
  on public.aethel_bots for select 
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Usuários podem cadastrar seus próprios bots" on public.aethel_bots;
create policy "Usuários podem cadastrar seus próprios bots" 
  on public.aethel_bots for insert 
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Usuários podem atualizar seus próprios bots" on public.aethel_bots;
create policy "Usuários podem atualizar seus próprios bots" 
  on public.aethel_bots for update 
  using (auth.uid() = user_id or user_id is null);

drop policy if exists "Usuários podem apagar seus próprios bots" on public.aethel_bots;
create policy "Usuários podem apagar seus próprios bots" 
  on public.aethel_bots for delete 
  using (auth.uid() = user_id or user_id is null);

-- 4. Função RPC aprimorada para registrar bots vinculados ao usuário autenticado
create or replace function public.register_or_update_bot(
  p_user_id text,
  p_bot_name text,
  p_platform text,
  p_token_encrypted text,
  p_ram_limit_mb integer default 100,
  p_main_file text default 'index.js',
  p_config_type text default 'aethel',
  p_assigned_node text default 'farol-alpha'
)
returns json as $$
declare
  v_bot_id uuid;
  v_auth_uid uuid;
begin
  -- Tenta pegar o auth.uid() da sessão ativa
  v_auth_uid := auth.uid();

  insert into public.aethel_bots (
    user_id,
    bot_name,
    platform,
    token_encrypted,
    ram_limit_mb,
    main_file,
    config_type,
    assigned_node,
    status
  )
  values (
    v_auth_uid,
    p_bot_name,
    p_platform,
    p_token_encrypted,
    least(p_ram_limit_mb, 100),
    p_main_file,
    p_config_type,
    p_assigned_node,
    'ONLINE'
  )
  returning id into v_bot_id;

  return json_build_object(
    'status', 'success',
    'bot_id', v_bot_id,
    'message', 'Instância registrada e online na malha Aethel Kov!'
  );
end;
$$ language plpgsql security definer;
