-- ============================================================================
-- ando · Gemelo Digital — RLS, permisos y trigger de perfil.
--
-- NO crea tablas: asume el esquema real del proyecto (ando_schema), donde la
-- columna del titular es `usuario_id` y en `perfiles` es la PK (FK a auth.users).
--
-- Qué hace y por qué:
--   1) Trigger que crea la fila en `perfiles` al registrarse un usuario. Es
--      IMPRESCINDIBLE: todas las tablas hijas (consentimientos, eventos, ...)
--      referencian perfiles.usuario_id, así que sin perfil no se puede insertar.
--   2) Activa RLS + concede permisos (GRANT) + crea una política por titular en
--      todas las tablas con `usuario_id`. Sin el GRANT, PostgREST devuelve 42501
--      (fue justo el error detectado). El rol anónimo NO recibe permisos.
--
-- Idempotente: puedes ejecutarlo varias veces sin problema.
-- ============================================================================

-- 1) Perfil automático al registrarse -----------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfiles (usuario_id, alias)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'alias'), ''), 'Usuario')
  )
  on conflict (usuario_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Tablas adicionales de la app (calibración y gamificación) -----------------
create table if not exists public.correcciones_actividad (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  actividad_original text not null,
  actividad_corregida text not null,
  confirmada boolean not null default true,
  motivo text,
  created_at timestamptz not null default now()
);

create table if not exists public.logros_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users (id) on delete cascade,
  logro_id text not null,
  desbloqueado_en timestamptz not null default now(),
  unique (usuario_id, logro_id)
);

-- 3) RLS + permisos + política por titular ------------------------------------
-- Todas estas tablas tienen `usuario_id`, así que aplican la misma regla.
do $$
declare t text;
begin
  foreach t in array array[
    'perfiles', 'consentimientos', 'dispositivos', 'fuentes_datos', 'eventos_crudos',
    'caracteristicas_actividad', 'predicciones', 'lineas_base', 'variaciones_rutina',
    'correcciones_actividad', 'solicitudes_derechos', 'logros_usuario'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('drop policy if exists "titular_rw" on public.%I', t);
    execute format(
      'create policy "titular_rw" on public.%I for all to authenticated '
      || 'using (usuario_id = auth.uid()) with check (usuario_id = auth.uid())',
      t
    );
  end loop;
end;
$$;

-- 3) Catálogo de modelos (global, sin usuario_id): solo lectura autenticada.
--    `predicciones.modelo_id` lo referencia, por eso conviene poder leerlo.
alter table public.versiones_modelo enable row level security;
grant select on public.versiones_modelo to authenticated;
drop policy if exists "modelos_lectura" on public.versiones_modelo;
create policy "modelos_lectura" on public.versiones_modelo
  for select to authenticated using (true);

-- Nota: `registros_auditoria` se deja solo para el backend (service_role); no se
-- conceden permisos al rol autenticado a propósito.

-- 4) Índices de alto rendimiento para consultas móviles -----------------------
-- Consultas de historial y eventos crudos (7/14/30 días)
create index if not exists idx_eventos_crudos_usuario_inicio
  on public.eventos_crudos (usuario_id, inicio_en desc);

-- Ventanas de actividad para predicción Random Forest
create index if not exists idx_caract_actividad_usuario_inicio
  on public.caracteristicas_actividad (usuario_id, ventana_inicio desc);

-- Consultas rápidas de consentimientos vigentes por categoría
create index if not exists idx_consentimientos_usuario_categoria
  on public.consentimientos (usuario_id, categoria, concedido_en desc);

