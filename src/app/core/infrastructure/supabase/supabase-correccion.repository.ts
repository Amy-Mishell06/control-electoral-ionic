import { Injectable, inject } from '@angular/core';
import { Dignidad, TotalesActa } from '../../domain/models/acta.model';
import { ActaGuardada } from '../../domain/models/correccion.model';
import { CorreccionPort } from '../../domain/ports/correccion.port';
import { SUPABASE } from './supabase.client';

const uno = <T>(valor: T | T[] | null | undefined): T | null =>
  Array.isArray(valor) ? (valor[0] ?? null) : (valor ?? null);

@Injectable()
export class SupabaseCorreccionRepository implements CorreccionPort {
  private readonly supabase = inject(SUPABASE);

  async actaDe(juntaId: string, dignidad: Dignidad): Promise<ActaGuardada | null> {
    const { data, error } = await this.supabase
      .from('actas')
      .select(
        'id, junta_id, dignidad, estado, version, nulos, blancos, total_sufragantes, foto_ruta, ' +
          'juntas(numero, recinto_id), ' +
          'votos_acta(organizacion_id, votos, organizaciones(siglas, nombre, orden, candidatos(nombre, dignidad)))',
      )
      .eq('junta_id', juntaId)
      .eq('dignidad', dignidad)
      .maybeSingle();
    if (error) {
      throw new Error('No se pudo cargar el acta.');
    }
    if (!data) {
      return null;
    }
    const f: any = data;
    const junta = uno<any>(f.juntas);
    const votos = (f.votos_acta ?? [])
      .map((v: any) => {
        const org = uno<any>(v.organizaciones);
        const candidato = (org?.candidatos ?? []).find((c: any) => c.dignidad === dignidad);
        return {
          organizacionId: v.organizacion_id,
          siglas: org?.siglas ?? '',
          organizacion: org?.nombre ?? '',
          candidato: candidato?.nombre ?? '',
          orden: org?.orden ?? 0,
          votos: v.votos ?? 0,
        };
      })
      .sort((a: { orden: number }, b: { orden: number }) => a.orden - b.orden);

    return {
      actaId: f.id,
      juntaId: f.junta_id,
      recintoId: junta?.recinto_id ?? '',
      mesa: junta?.numero ?? 0,
      dignidad: f.dignidad,
      estado: f.estado,
      version: f.version,
      nulos: f.nulos,
      blancos: f.blancos,
      totalSufragantes: f.total_sufragantes,
      fotoRuta: f.foto_ruta,
      votos,
    };
  }

  async corregir(
    actaId: string, totales: TotalesActa, fotoRuta: string | null, versionEsperada: number,
  ): Promise<number> {
    const { data, error } = await this.supabase.rpc('corregir_acta', {
      p_acta: actaId,
      p_votos: totales.votos.map((v) => ({ organizacion_id: v.organizacionId, votos: v.votos })),
      p_nulos: totales.nulos,
      p_blancos: totales.blancos,
      p_total: totales.totalSufragantes,
      p_foto_ruta: fotoRuta,
      p_version_esperada: versionEsperada,
    });
    if (error) {
      // Los mensajes de corregir_acta ya están en español (raise exception)
      throw new Error(error.message || 'No se pudo corregir el acta.');
    }
    return data as number;
  }

  async subirFoto(ruta: string, dataUrl: string): Promise<void> {
    const blob = await (await fetch(dataUrl)).blob();
    const { error } = await this.supabase.storage
      .from('actas')
      .upload(ruta, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) {
      throw new Error('No se pudo subir la nueva foto.');
    }
  }

  async borrarFoto(ruta: string): Promise<void> {
    await this.supabase.storage.from('actas').remove([ruta]);
  }

  async urlFoto(ruta: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from('actas').createSignedUrl(ruta, 300);
    if (error || !data) {
      throw new Error('No se pudo abrir la foto del acta.');
    }
    return data.signedUrl;
  }
}
