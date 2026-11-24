-- =========================================================
-- Yupana · Migración 3: funciones de actas, historial y vistas (ADR-002)
-- =========================================================

-- ---------- Mesas automáticas al crear un recinto (R4) ----------
create or replace function crear_juntas_del_recinto()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into juntas (recinto_id, numero)
  select new.id, n from generate_series(1, new.cantidad_jrv) as n;
  return new;
end;
$$;

create trigger trg_crear_juntas
  after insert on recintos
  for each row execute function crear_juntas_del_recinto();

-- ---------- Validación de votos en el servidor (R6) ----------
-- La misma regla que acta.rule.ts, pero aquí nadie se la puede saltar.
create or replace function validar_votos(
  p_votos jsonb, p_nulos int, p_blancos int, p_total int
)
returns void
language plpgsql set search_path = public
as $$
declare
  v_organizaciones int;
  v_validas        int;
  v_suma           bigint;
  v_negativos      boolean;
begin
  if p_votos is null or jsonb_typeof(p_votos) <> 'array' then
    raise exception 'Faltan los votos de las organizaciones.';
  end if;

  select count(*) into v_organizaciones from organizaciones;

  select count(distinct o.id),
         coalesce(sum((e ->> 'votos')::int), 0),
         coalesce(bool_or((e ->> 'votos') is null or (e ->> 'votos')::int < 0), false)
    into v_validas, v_suma, v_negativos
    from jsonb_array_elements(p_votos) as e
    join organizaciones o on o.id = (e ->> 'organizacion_id')::uuid;

  if jsonb_array_length(p_votos) <> v_organizaciones or v_validas <> v_organizaciones then
    raise exception 'El acta debe tener los votos de las % organizaciones.', v_organizaciones;
  end if;

  if v_negativos
     or p_nulos is null or p_blancos is null or p_total is null
     or p_nulos < 0 or p_blancos < 0 or p_total < 0 then
    raise exception 'No se aceptan valores vacíos ni negativos.';
  end if;

  if v_suma + p_nulos + p_blancos <> p_total then
    raise exception 'Los votos suman % y el total de sufragantes es %.',
      v_suma + p_nulos + p_blancos, p_total;
  end if;
end;
$$;

-- ---------- Registrar acta (veedor) ----------
create or replace function registrar_acta(
  p_junta        uuid,
  p_dignidad     dignidad,
  p_votos        jsonb,          -- [{"organizacion_id": "...", "votos": 82}, ...]
  p_nulos        int,
  p_blancos      int,
  p_total        int,
  p_foto_ruta    text,
  p_nitidez      numeric,
  p_latitud      double precision,
  p_longitud     double precision,
  p_precision    double precision,
  p_capturada_at timestamptz,
  p_uuid_cliente uuid default null
)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if mi_rol() is distinct from 'veedor' or not veedor_asignado(p_junta) then
    raise exception 'No tienes asignada esta mesa.';
  end if;

  -- Si el acta ya llegó antes (reintento sin conexión, ADR-014), no se duplica
  if p_uuid_cliente is not null then
    select id into v_id from actas where uuid_cliente = p_uuid_cliente;
    if found then
      return v_id;
    end if;
  end if;

  perform validar_votos(p_votos, p_nulos, p_blancos, p_total);

  insert into actas (
    junta_id, dignidad, nulos, blancos, total_sufragantes, foto_ruta, nitidez,
    latitud, longitud, precision_m, capturada_at, uuid_cliente, registrada_por
  ) values (
    p_junta, p_dignidad, p_nulos, p_blancos, p_total, p_foto_ruta, p_nitidez,
    p_latitud, p_longitud, p_precision, p_capturada_at, p_uuid_cliente, auth.uid()
  )
  returning id into v_id;

  insert into votos_acta (acta_id, organizacion_id, votos)
  select v_id, (e ->> 'organizacion_id')::uuid, (e ->> 'votos')::int
  from jsonb_array_elements(p_votos) as e;

  return v_id;
exception
  when unique_violation then
    raise exception 'Esta mesa ya tiene registrada el acta de %.', p_dignidad;
end;
$$;

-- ---------- Historial de correcciones (auditoría) ----------
-- Antes de cambiar un acta, guarda cómo estaba (con sus votos).
create or replace function guardar_historial_acta()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into actas_historial (acta_id, version, datos_anteriores, foto_anterior, corregida_por)
  values (
    old.id,
    old.version,
    jsonb_build_object(
      'nulos', old.nulos,
      'blancos', old.blancos,
      'total_sufragantes', old.total_sufragantes,
      'estado', old.estado,
      'votos', (
        select coalesce(jsonb_agg(jsonb_build_object(
                 'organizacion_id', organizacion_id, 'votos', votos)), '[]'::jsonb)
        from votos_acta where acta_id = old.id
      )
    ),
    old.foto_ruta,
    auth.uid()
  );
  return new;
end;
$$;

create trigger trg_historial_acta
  before update on actas
  for each row execute function guardar_historial_acta();

-- ---------- Corregir acta (veedor asignado o coordinador del recinto) ----------
create or replace function corregir_acta(
  p_acta              uuid,
  p_votos             jsonb,
  p_nulos             int,
  p_blancos           int,
  p_total             int,
  p_foto_ruta         text default null,  -- solo el coordinador puede cambiar la foto
  p_version_esperada  int  default null   -- para detectar conflictos (ADR-014)
)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  v_acta actas%rowtype;
  v_rol  rol_usuario := mi_rol();
begin
  select * into v_acta from actas where id = p_acta for update;
  if not found then
    raise exception 'El acta no existe.';
  end if;

  if not (
       (v_rol = 'veedor' and veedor_asignado(v_acta.junta_id))
    or (v_rol = 'coordinador_recinto' and junta_de_mi_recinto(v_acta.junta_id))
  ) then
    raise exception 'No puedes corregir esta acta.';
  end if;

  if p_foto_ruta is not null and v_rol <> 'coordinador_recinto' then
    raise exception 'Solo el coordinador de recinto puede cambiar la foto.';
  end if;

  if p_version_esperada is not null and p_version_esperada <> v_acta.version then
    raise exception 'El acta cambió mientras la editabas. Revisa los datos actuales.';
  end if;

  perform validar_votos(p_votos, p_nulos, p_blancos, p_total);

  -- Primero se actualiza el acta (el trigger guarda la versión anterior con sus votos)
  update actas set
    nulos             = p_nulos,
    blancos           = p_blancos,
    total_sufragantes = p_total,
    foto_ruta         = coalesce(p_foto_ruta, foto_ruta),
    estado            = 'corregida',
    version           = version + 1,
    actualizada_at    = now()
  where id = p_acta;

  -- Luego se reemplazan los votos
  delete from votos_acta where acta_id = p_acta;
  insert into votos_acta (acta_id, organizacion_id, votos)
  select p_acta, (e ->> 'organizacion_id')::uuid, (e ->> 'votos')::int
  from jsonb_array_elements(p_votos) as e;

  return v_acta.version + 1;
end;
$$;

-- ---------- Asignar o reasignar veedor (coordinador de recinto, R5) ----------
create or replace function asignar_veedor(p_junta uuid, p_veedor uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if mi_rol() is distinct from 'coordinador_recinto' or not junta_de_mi_recinto(p_junta) then
    raise exception 'Solo el coordinador de este recinto puede asignar veedores a esta mesa.';
  end if;

  if not exists (
    select 1 from perfiles
    where id = p_veedor and rol = 'veedor' and recinto_id = mi_recinto()
  ) then
    raise exception 'El veedor debe pertenecer a tu recinto.';
  end if;

  update asignaciones set activa = false where junta_id = p_junta and activa;
  insert into asignaciones (junta_id, veedor_id, asignada_por)
  values (p_junta, p_veedor, auth.uid());
end;
$$;

-- ---------- Activar cuenta tras el código OTP (ADR-011) ----------
create or replace function activar_cuenta()
returns void
language sql security definer set search_path = public
as $$
  update perfiles
  set correo_verificado = true, debe_cambiar_clave = false
  where id = auth.uid();
$$;

-- ---------- Vistas para las pantallas y el dashboard (R4, R5) ----------
-- security_invoker = true: la vista respeta la RLS de quien consulta.

create view v_estado_juntas with (security_invoker = true) as
select
  j.id         as junta_id,
  j.recinto_id,
  r.nombre     as recinto,
  j.numero,
  a.veedor_id,
  p.nombres || ' ' || p.apellidos as veedor,
  coalesce(aa.estado, 'pendiente') as estado_alcalde,
  coalesce(ap.estado, 'pendiente') as estado_prefecto
from juntas j
join recintos r on r.id = j.recinto_id
left join asignaciones a on a.junta_id = j.id and a.activa
left join perfiles p     on p.id = a.veedor_id
left join actas aa       on aa.junta_id = j.id and aa.dignidad = 'alcalde'
left join actas ap       on ap.junta_id = j.id and ap.dignidad = 'prefecto';

create view v_resultados_recinto with (security_invoker = true) as
select
  a.dignidad,
  r.id      as recinto_id,
  r.nombre  as recinto,
  o.id      as organizacion_id,
  o.siglas,
  o.nombre  as organizacion,
  c.nombre  as candidato,
  sum(v.votos)::int as votos
from votos_acta v
join actas a          on a.id = v.acta_id
join juntas j         on j.id = a.junta_id
join recintos r       on r.id = j.recinto_id
join organizaciones o on o.id = v.organizacion_id
left join candidatos c on c.organizacion_id = o.id and c.dignidad = a.dignidad
group by a.dignidad, r.id, r.nombre, o.id, o.siglas, o.nombre, c.nombre;

create view v_resultados_consolidados with (security_invoker = true) as
select dignidad, organizacion_id, siglas, organizacion, candidato, sum(votos)::int as votos
from v_resultados_recinto
group by dignidad, organizacion_id, siglas, organizacion, candidato;

create view v_avance_recintos with (security_invoker = true) as
select
  r.id as recinto_id,
  r.nombre,
  r.parroquia,
  r.latitud,
  r.longitud,
  r.cantidad_jrv,
  r.cantidad_jrv * 2 as actas_esperadas,
  count(a.id) as actas_recibidas
from recintos r
left join juntas j on j.recinto_id = r.id
left join actas a  on a.junta_id = j.id
group by r.id;

-- ---------- Permisos ----------
-- Nadie sin sesión puede llamar funciones; validar_votos es solo interna.
revoke execute on all functions in schema public from public, anon;
revoke execute on function validar_votos(jsonb, int, int, int) from authenticated;
grant execute on function registrar_acta, corregir_acta, asignar_veedor, activar_cuenta
  to authenticated;