import { Injectable, inject } from '@angular/core';
import { JuntasPort } from '../../domain/ports/juntas.port';
import { EstadoJunta, Veedor } from '../../domain/models/junta.model';
import { SUPABASE } from './supabase.client';

/** Mesas y veedores. La RLS limita los datos al recinto de quien consulta (ADR-002). */
@Injectable()
export class SupabaseJuntasRepository implements JuntasPort {
  private readonly supabase = inject(SUPABASE);

  async listarEstado(): Promise<EstadoJunta[]> {
    const { data, error } = await this.supabase
      .from('v_estado_juntas')
      .select('*')
      .order('numero');
    if (error) {
      throw new Error('No se pudieron cargar las mesas.');
    }
    return (data ?? []).map((j) => ({
      juntaId: j.junta_id,
      recintoId: j.recinto_id,
      recinto: j.recinto,
      numero: j.numero,
      veedorId: j.veedor_id,
      veedor: j.veedor,
      estadoAlcalde: j.estado_alcalde,
      estadoPrefecto: j.estado_prefecto,
    }));
  }

  async listarVeedores(): Promise<Veedor[]> {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('id, nombres, apellidos, cedula')
      .eq('rol', 'veedor')
      .order('apellidos');
    if (error) {
      throw new Error('No se pudieron cargar los veedores.');
    }
    return (data ?? []).map((v) => ({
      id: v.id,
      nombre: `${v.nombres} ${v.apellidos}`,
      cedula: v.cedula,
    }));
  }

  async asignarVeedor(juntaId: string, veedorId: string): Promise<void> {
    const { error } = await this.supabase.rpc('asignar_veedor', {
      p_junta: juntaId,
      p_veedor: veedorId,
    });
    if (error) {
      throw new Error(error.message || 'No se pudo asignar el veedor.');
    }
  }
}