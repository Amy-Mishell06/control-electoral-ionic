import { Injectable, inject } from '@angular/core';
import { ActasPort } from '../domain/ports/actas.port';
import { Dignidad, TotalesActa } from '../domain/models/acta.model';
import { OrganizacionCandidato, Ubicacion } from '../domain/models/registro-acta.model';
import { validarTotalesActa } from '../domain/rules/acta.rule';
import { esNitida } from '../domain/rules/nitidez.rule';

export interface DatosRegistro {
  juntaId: string;
  recintoId: string;
  dignidad: Dignidad;
  totales: TotalesActa;
  fotoDataUrl: string | null;
  nitidez: number | null;
  ubicacion: Ubicacion | null;
  uuidCliente: string;
}

/** Caso de uso: registrar un acta con foto y GPS (R6, R7, ADR-004). */
@Injectable({ providedIn: 'root' })
export class RegistrarActaUseCase {
  private readonly actas = inject(ActasPort);

  organizaciones(dignidad: Dignidad): Promise<OrganizacionCandidato[]> {
    return this.actas.organizaciones(dignidad);
  }

  async ejecutar(d: DatosRegistro): Promise<string> {
    const resultado = validarTotalesActa(d.totales);
    if (!resultado.cuadra) {
      throw new Error(resultado.errores.join(' '));
    }
    if (!d.fotoDataUrl || d.nitidez === null) {
      throw new Error('Falta la foto del acta.');
    }
    if (!esNitida(d.nitidez)) {
      throw new Error('La foto está borrosa. Tómala de nuevo.');
    }
    if (!d.ubicacion) {
      throw new Error('Falta la ubicación GPS.');
    }

    const extension = d.fotoDataUrl.startsWith('data:image/png') ? 'png' : 'jpg';
    const ruta = `${d.recintoId}/${d.juntaId}/${d.dignidad}-${Date.now()}.${extension}`;
    await this.actas.subirFoto(ruta, d.fotoDataUrl);

    try {
      return await this.actas.registrar({
        juntaId: d.juntaId,
        dignidad: d.dignidad,
        totales: d.totales,
        fotoRuta: ruta,
        nitidez: d.nitidez,
        ubicacion: d.ubicacion,
        uuidCliente: d.uuidCliente,
      });
    } catch (e) {
      // si el registro falla, no se deja una foto huérfana (ADR-003)
      await this.actas.borrarFoto(ruta).catch(() => undefined);
      throw e;
    }
  }
}