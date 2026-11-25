import { Injectable, inject } from '@angular/core';
import { RecintosPort } from '../../domain/ports/recintos.port';
import { NuevoRecinto, Recinto } from '../../domain/models/recinto.model';
import { SUPABASE } from './supabase.client';

@Injectable()
export class SupabaseRecintosRepository implements RecintosPort {
  private readonly supabase = inject(SUPABASE);

  async listar(): Promise<Recinto[]> {
    const [recintos, coordinadores] = await Promise.all([
      this.supabase
        .from('recintos')
        .select('id, parroquia, nombre, cantidad_jrv, latitud, longitud')
        .order('nombre'),
      this.supabase
        .from('perfiles')
        .select('recinto_id, nombres, apellidos')
        .eq('rol', 'coordinador_recinto'),
    ]);
    if (recintos.error) {
      throw new Error('No se pudieron cargar los recintos.');
    }

    const nombrePorRecinto = new Map(
      (coordinadores.data ?? []).map((c) => [c.recinto_id, `${c.nombres} ${c.apellidos}`]),
    );

    return (recintos.data ?? []).map((r) => ({
      id: r.id,
      parroquia: r.parroquia,
      nombre: r.nombre,
      cantidadJrv: r.cantidad_jrv,
      latitud: r.latitud,
      longitud: r.longitud,
      coordinador: nombrePorRecinto.get(r.id) ?? null,
    }));
  }

  async crear(recinto: NuevoRecinto): Promise<void> {
    const { error } = await this.supabase.from('recintos').insert({
      parroquia: recinto.parroquia,
      nombre: recinto.nombre,
      cantidad_jrv: recinto.cantidadJrv,
      latitud: recinto.latitud,
      longitud: recinto.longitud,
    });
    if (error) {
      throw new Error(
        error.code === '23505'
          ? 'Ya existe un recinto con ese nombre en el cantón, ingresa otro nombre.'
          : 'No se pudo crear el recinto.',
      );
    }
  }
}