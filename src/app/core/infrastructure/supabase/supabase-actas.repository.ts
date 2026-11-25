import { Injectable, inject } from '@angular/core';
import { ActasPort } from '../../domain/ports/actas.port';
import { Dignidad } from '../../domain/models/acta.model';
import { NuevaActa, OrganizacionCandidato } from '../../domain/models/registro-acta.model';
import { SUPABASE } from './supabase.client';

/** Actas: fotos en el bucket privado y registro con la función registrar_acta (ADR-002). */
@Injectable()
export class SupabaseActasRepository implements ActasPort {
  private readonly supabase = inject(SUPABASE);

  async organizaciones(dignidad: Dignidad): Promise<OrganizacionCandidato[]> {
    const { data, error } = await this.supabase
      .from('organizaciones')
      .select('id, nombre, siglas, orden, candidatos(nombre, dignidad)')
      .order('orden');
    if (error) {
      throw new Error('No se pudieron cargar las organizaciones.');
    }
    return (data ?? []).map((o) => ({
      organizacionId: o.id,
      siglas: o.siglas,
      organizacion: o.nombre,
      candidato:
        (o.candidatos as { nombre: string; dignidad: string }[]).find((c) => c.dignidad === dignidad)?.nombre ?? '',
    }));
  }

  async subirFoto(ruta: string, dataUrl: string): Promise<void> {
    const archivo = await (await fetch(dataUrl)).blob();
    const { error } = await this.supabase.storage
      .from('actas')
      .upload(ruta, archivo, { contentType: archivo.type || 'image/jpeg', upsert: false });
    if (error) {
      throw new Error('No se pudo subir la foto. Revisa tu conexión e inténtalo de nuevo.');
    }
  }

  async borrarFoto(ruta: string): Promise<void> {
    await this.supabase.storage.from('actas').remove([ruta]);
  }

  async registrar(acta: NuevaActa): Promise<string> {
    const { data, error } = await this.supabase.rpc('registrar_acta', {
      p_junta: acta.juntaId,
      p_dignidad: acta.dignidad,
      p_votos: acta.totales.votos.map((v) => ({ organizacion_id: v.organizacionId, votos: v.votos })),
      p_nulos: acta.totales.nulos,
      p_blancos: acta.totales.blancos,
      p_total: acta.totales.totalSufragantes,
      p_foto_ruta: acta.fotoRuta,
      p_nitidez: acta.nitidez,
      p_latitud: acta.ubicacion.latitud,
      p_longitud: acta.ubicacion.longitud,
      p_precision: acta.ubicacion.precision,
      p_capturada_at: acta.ubicacion.capturadaAt,
      p_uuid_cliente: acta.uuidCliente,
    });
    if (error) {
      throw new Error(error.message || 'No se pudo registrar el acta.');
    }
    return data as string;
  }
}