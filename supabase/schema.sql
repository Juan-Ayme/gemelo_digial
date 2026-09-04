-- ============================================================================
-- ando · Gemelo Digital — Esquema mínimo que la app espera en Supabase.
--
-- Ejecuta este archivo en el SQL Editor de tu proyecto Supabase.
-- Cubre las 3 tablas que la app lee/escribe hoy: perfiles, consentimientos y
-- eventos_crudos, todas con Row Level Security (cada titular solo ve lo suyo).
--
-- La columna de titularidad es `titular_id` (FK a auth.users). Si tu esquema
-- original usa otro nombre, ajústalo aquí Y en src/services/schema.ts (OWNER_COL).
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- perfiles
-- ----------------------------------------------------------------------------
create table if not exists public.perfiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  alias      text not null default 'Estudiante',
  email      text,
  creado_en  timestamptz not null default now()
);

alter table public.perfiles enable row level security;

drop policy if exists "perfiles: el titular ve su perfil" on public.perfiles;
create policy "perfiles: el titular ve su perfil"
  on public.perfiles for select using (auth.uid() = id);

drop policy if exists "perfiles: el titular gestiona su perfil" on public.perfiles;
create policy "perfiles: el titular gestiona su perfil"
  on public.perfiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- Crea el perfil automáticamente al registrarse un usuario.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (id, alias, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'alias', 'Estudiante'),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- consentimientos (granulares, revocables — Ley N.º 29733)
-- ----------------------------------------------------------------------------
create table if not exists public.consentimientos (
  id                uuid primary key default gen_random_uuid(),
  titular_id        uuid not null references auth.users (id) on delete cascade,
  categoria         text not null,
  otorgado          boolean not null default false,
  finalidad         text,
  version_documento text not null default 'v1.0',
  actualizado_en    timestamptz not null default now(),
  unique (titular_id, categoria)
);

alter table public.consentimientos enable row level security;

drop policy if exists "consentimientos: solo el titular" on public.consentimientos;
create policy "consentimientos: solo el titular"
  on public.consentimientos for all
  using (auth.uid() = titular_id)
  with check (auth.uid() = titular_id);

-- ----------------------------------------------------------------------------
-- eventos_crudos (idempotentes por evento_uuid; alineado con eventoCrudoSchema)
-- ----------------------------------------------------------------------------
create table if not exists public.eventos_crudos (
  id                     uuid primary key default gen_random_uuid(),
  titular_id             uuid not null references auth.users (id) on delete cascade,
  evento_uuid            uuid not null,
  procedencia            text not null,
  tipo_evento            text not null,
  inicio_en              timestamptz not null,
  fin_en                 timestamptz,
  valor_numerico         double precision,
  valor_texto            text,
  unidad                 text,
  confianza              numeric,
  precision_m            numeric,
  zona_general           text,
  medido_directamente    boolean not null default true,
  disponibilidad         boolean not null default true,
  calidad                numeric,
  version_consentimiento text not null default 'v1.0',
  datos_minimos          jsonb not null default '{}'::jsonb,
  creado_en              timestamptz not null default now(),
  unique (titular_id, evento_uuid)
);

alter table public.eventos_crudos enable row level security;

drop policy if exists "eventos: solo el titular" on public.eventos_crudos;
create policy "eventos: solo el titular"
  on public.eventos_crudos for all
  using (auth.uid() = titular_id)
  with check (auth.uid() = titular_id);

create index if not exists idx_eventos_titular_inicio
  on public.eventos_crudos (titular_id, inicio_en desc);

-- ----------------------------------------------------------------------------
-- Permisos de tabla para el rol autenticado.
--
-- RLS decide QUÉ FILAS ve cada quien, pero Postgres exige además un GRANT para
-- que el rol pueda tocar la tabla. Sin esto, PostgREST responde 42501
-- (permission denied). El rol anónimo (sesión cerrada) NO recibe permisos a
-- propósito: los datos del titular solo se ven tras iniciar sesión.
-- ----------------------------------------------------------------------------
grant select, insert, update, delete on public.perfiles to authenticated;
grant select, insert, update, delete on public.consentimientos to authenticated;
grant select, insert, update, delete on public.eventos_crudos to authenticated;
