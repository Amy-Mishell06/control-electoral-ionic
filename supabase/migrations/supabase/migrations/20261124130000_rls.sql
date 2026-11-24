-- =========================================================
-- Yupana · Migración 2: reglas de seguridad por rol (ADR-002)
-- =========================================================

-- ---------- Funciones auxiliares ----------
-- Son "security definer": se ejecutan con permisos del dueño de la base,
-- así pueden leer perfiles sin que las propias políticas se llamen en bucle
-- (recursión de RLS).

create or replace function mi_rol()
returns rol_usuario
language sql stable security definer set search_path = public
as $$
  select rol from perfiles where id = auth.uid();
$$;

create or replace function mi_recinto()
returns uuid
language sql stable security definer set search_path = public
as $$
  select recinto_id from perfiles where id = auth.uid();
$$;

-- ¿La junta está asignada (activa) al usuario que consulta?
create or replace function veedor_asignado(p_junta uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from asignaciones
    where junta_id = p_junta and veedor_id = auth.uid() and activa
  );
$$;

-- ¿La junta pertenece al recinto del usuario que consulta?
create or replace function junta_de_mi_recinto(p_junta uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from juntas
    where id = p_junta and recinto_id = mi_recinto()
  );
$$;

-- ---------- recintos ----------
create policy "recintos: leer segun rol" on recintos
  for select to authenticated
  using (mi_rol() = 'provincial' or id = mi_recinto());

create policy "recintos: el provincial crea" on recintos
  for insert to authenticated
  with check (mi_rol() = 'provincial');

-- ---------- perfiles ----------
-- Solo lectura. No hay políticas de update: nadie puede cambiarse
-- el rol ni el recinto desde la app o la consola.
create policy "perfiles: leer segun rol" on perfiles
  for select to authenticated
  using (
    id = auth.uid()
    or mi_rol() = 'provincial'
    or (mi_rol() = 'coordinador_recinto' and recinto_id = mi_recinto())
  );

-- ---------- juntas ----------
create policy "juntas: leer segun rol" on juntas
  for select to authenticated
  using (
    mi_rol() = 'provincial'
    or (mi_rol() = 'coordinador_recinto' and recinto_id = mi_recinto())
    or (mi_rol() = 'veedor' and veedor_asignado(id))
  );

-- ---------- asignaciones ----------
create policy "asignaciones: leer segun rol" on asignaciones
  for select to authenticated
  using (
    mi_rol() = 'provincial'
    or (mi_rol() = 'coordinador_recinto' and junta_de_mi_recinto(junta_id))
    or (veedor_id = auth.uid() and activa)
  );

-- ---------- organizaciones y candidatos ----------
create policy "organizaciones: leer con sesion" on organizaciones
  for select to authenticated using (true);

create policy "candidatos: leer con sesion" on candidatos
  for select to authenticated using (true);

-- ---------- actas ----------
-- Solo lectura. Registrar y corregir actas se hace con las funciones
-- registrar_acta y corregir_acta (migración 3).
create policy "actas: leer segun rol" on actas
  for select to authenticated
  using (
    mi_rol() = 'provincial'
    or (mi_rol() = 'coordinador_recinto' and junta_de_mi_recinto(junta_id))
    or (mi_rol() = 'veedor' and veedor_asignado(junta_id))
  );

-- ---------- votos_acta ----------
-- Se ven los votos de un acta solo si se puede ver esa acta
-- (la consulta interna también pasa por la RLS de actas).
create policy "votos: leer si se ve el acta" on votos_acta
  for select to authenticated
  using (exists (select 1 from actas a where a.id = acta_id));

-- ---------- actas_historial ----------
create policy "historial: provincial y coordinador" on actas_historial
  for select to authenticated
  using (
    mi_rol() = 'provincial'
    or (
      mi_rol() = 'coordinador_recinto'
      and exists (
        select 1 from actas a
        where a.id = acta_id and junta_de_mi_recinto(a.junta_id)
      )
    )
  );

-- ---------- intentos_login ----------
-- Sin políticas a propósito: solo la Edge Function login-cedula
-- (con la clave del servidor) puede leerla y escribirla.