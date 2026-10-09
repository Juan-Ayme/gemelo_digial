-- Revisar y aplicar en un entorno de prueba antes de producción.
-- No elimina registros existentes. Si hay UUID duplicados, UNIQUE falla y exige revisión.
begin;
create unique index if not exists eventos_crudos_evento_uuid_unique on public.eventos_crudos (evento_uuid);

-- Conserva las columnas, reglas UPDATE y diferibilidad de las FK simples del titular.
-- Limita el cambio a las tablas personales y referencias a auth.users/perfiles.
do $$
declare r record; definition text;
begin
  for r in
    select c.*, n.nspname as ns, t.relname as tabla, rn.nspname as ref_ns, rt.relname as ref_tabla,
           a.attname as columna, ra.attname as ref_columna
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid join pg_namespace n on n.oid = t.relnamespace
    join pg_class rt on rt.oid = c.confrelid join pg_namespace rn on rn.oid = rt.relnamespace
    join pg_attribute a on a.attrelid = t.oid and a.attnum = c.conkey[1]
    join pg_attribute ra on ra.attrelid = rt.oid and ra.attnum = c.confkey[1]
    where c.contype = 'f' and cardinality(c.conkey) = 1 and n.nspname = 'public' and a.attname = 'usuario_id'
      and t.relname in ('perfiles','consentimientos','dispositivos','fuentes_datos','eventos_crudos','caracteristicas_actividad','predicciones','lineas_base','variaciones_rutina','correcciones_actividad','solicitudes_derechos','logros_usuario')
      and ((rn.nspname = 'auth' and rt.relname = 'users') or (rn.nspname = 'public' and rt.relname = 'perfiles'))
  loop
    if r.confdeltype = 'c' then continue; end if;
    definition := format('foreign key (%I) references %I.%I (%I) match %s on update %s on delete cascade %s',
      r.columna, r.ref_ns, r.ref_tabla, r.ref_columna,
      case r.confmatchtype when 'f' then 'full' else 'simple' end,
      case r.confupdtype when 'a' then 'no action' when 'r' then 'restrict' when 'c' then 'cascade' when 'n' then 'set null' else 'set default' end,
      case when r.condeferrable then 'deferrable initially ' || case when r.condeferred then 'deferred' else 'immediate' end else 'not deferrable' end);
    execute format('alter table %I.%I drop constraint %I', r.ns, r.tabla, r.conname);
    execute format('alter table %I.%I add constraint %I %s', r.ns, r.tabla, r.conname, definition);
  end loop;
end $$;
commit;
