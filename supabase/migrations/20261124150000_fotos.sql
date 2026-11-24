-- =========================================================
-- Yupana · Migración 4: bucket privado de fotos de actas (ADR-002, ADR-003)
-- Ruta de cada foto: <recinto_id>/<junta_id>/<dignidad>-<fecha>.jpg
-- =========================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('actas', 'actas', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

-- Ver fotos: mismas reglas que las actas
create policy "fotos: leer segun rol" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'actas' and (
      mi_rol() = 'provincial'
      or (mi_rol() = 'coordinador_recinto'
          and (storage.foldername(name))[1] = mi_recinto()::text)
      or (mi_rol() = 'veedor'
          and veedor_asignado(((storage.foldername(name))[2])::uuid))
    )
  );

-- Subir fotos: el veedor a sus mesas, el coordinador a su recinto
create policy "fotos: subir segun rol" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'actas' and (
      (mi_rol() = 'veedor'
        and veedor_asignado(((storage.foldername(name))[2])::uuid)
        and exists (
          select 1 from public.juntas
          where id = ((storage.foldername(name))[2])::uuid
            and recinto_id::text = (storage.foldername(name))[1]
        ))
      or (mi_rol() = 'coordinador_recinto'
          and (storage.foldername(name))[1] = mi_recinto()::text)
    )
  );

-- Borrar: solo fotos propias que aún no son evidencia de un acta
create policy "fotos: borrar huerfanas propias" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'actas'
    and owner_id = auth.uid()::text
    and not exists (select 1 from public.actas where foto_ruta = name)
    and not exists (select 1 from public.actas_historial where foto_anterior = name)
  );