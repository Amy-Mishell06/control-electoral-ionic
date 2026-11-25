import { Injectable, inject } from '@angular/core';
import { DashboardPort } from '../../domain/ports/dashboard.port';
import {
  ActaResumen, ActaUbicada, AvanceRecinto, ResultadoOrganizacion,
} from '../../domain/models/resultados.model';
import { SUPABASE } from './supabase.client';

/** Supabase devuelve las relaciones como objeto o como lista según el caso. */
const uno = <T>(valor: T | T[] | null | undefined): T | null =>
  Array.isArray(valor) ? (valor[0] ?? null) : (valor ?? null);

@Injectable()
export class SupabaseDashboardRepository implements DashboardPort {
  private readonly supabase = inject(SUPABASE);

  async resultados(): Promise<ResultadoOrganizacion[]> {
    const { data, error } = await this.supabase
      .from('v_resultados_consolidados')
      .select('dignidad, organizacion_id, siglas, organizacion, candidato, votos');
    if (error) {
      throw new Error('No se pudieron cargar los resultados.');
    }
    return (data ?? []).map((f) => ({
      dignidad: f.dignidad,
      organizacionId: f.organizacion_id,
      siglas: f.siglas,
      organizacion: f.organizacion,
      candidato: f.candidato,
      votos: f.votos ?? 0,
    }));
  }

  async actasResumen(): Promise<ActaResumen[]> {
    const { data, error } = await this.supabase
      .from('actas')
      .select('dignidad, nulos, blancos, total_sufragantes')
      .in('estado', ['registrada', 'corregida']);
    if (error) {
      throw new Error('No se pudieron cargar los totales de las actas.');
    }
    return (data ?? []).map((f) => ({
      dignidad: f.dignidad,
      nulos: f.nulos ?? 0,
      blancos: f.blancos ?? 0,
      totalSufragantes: f.total_sufragantes ?? 0,
    }));
  }

  async avance(): Promise<AvanceRecinto[]> {
    const { data, error } = await this.supabase
      .from('v_avance_recintos')
      .select('recinto_id, nombre, parroquia, actas_esperadas, actas_recibidas')
      .order('nombre');
    if (error) {
      throw new Error('No se pudo cargar el avance por recinto.');
    }
    return (data ?? []).map((f) => ({
      recintoId: f.recinto_id,
      nombre: f.nombre,
      parroquia: f.parroquia,
      esperadas: f.actas_esperadas ?? 0,
      recibidas: Number(f.actas_recibidas ?? 0), // bigint llega como texto o número
    }));
  }

  async actasUbicadas(): Promise<ActaUbicada[]> {
    const { data, error } = await this.supabase
      .from('actas')
      .select(
        'id, dignidad, estado, latitud, longitud, precision_m, capturada_at, foto_ruta, nitidez, ' +
          'juntas(numero, recintos(nombre, latitud, longitud))',
      )
      .not('latitud', 'is', null)
      .order('capturada_at', { ascending: false });
    if (error) {
      throw new Error('No se pudieron cargar las ubicaciones de las actas.');
    }
    return (data ?? []).map((f: any) => {
      const junta = uno<any>(f.juntas);
      const recinto = uno<any>(junta?.recintos);
      return {
        actaId: f.id,
        dignidad: f.dignidad,
        estado: f.estado,
        mesa: junta?.numero ?? 0,
        recinto: recinto?.nombre ?? 'Recinto desconocido',
        ubicacion: { latitud: f.latitud, longitud: f.longitud },
        ubicacionRecinto:
          recinto?.latitud != null && recinto?.longitud != null
            ? { latitud: recinto.latitud, longitud: recinto.longitud }
            : null,
        precisionM: f.precision_m,
        capturadaAt: f.capturada_at,
        fotoRuta: f.foto_ruta,
        nitidez: f.nitidez == null ? null : Number(f.nitidez),
      };
    });
  }

  /** Enlace temporal (5 min) porque el bucket de fotos es privado (ADR-009). */
  async urlFoto(ruta: string): Promise<string> {
    const { data, error } = await this.supabase.storage.from('actas').createSignedUrl(ruta, 300);
    if (error || !data) {
      throw new Error('No se pudo abrir la foto del acta.');
    }
    return data.signedUrl;
  }
}
