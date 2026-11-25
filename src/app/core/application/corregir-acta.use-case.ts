import { Injectable, inject } from '@angular/core';
import { DatosCorreccion } from '../domain/models/correccion.model';
import { CorreccionPort } from '../domain/ports/correccion.port';
import { validarTotalesActa } from '../domain/rules/acta.rule';
import { esNitida } from '../domain/rules/nitidez.rule';

/**
 * Corrige un acta registrada.
 * Valida en el cliente, sube la foto nueva si hay, y la base vuelve a validar
 * permisos, versión y totales en corregir_acta (ADR-002, ADR-014).
 */
@Injectable({ providedIn: 'root' })
export class CorregirActaUseCase {
  private readonly correccion = inject(CorreccionPort);

  async ejecutar(datos: DatosCorreccion): Promise<number> {
    const resultado = validarTotalesActa(datos.totales);
    if (!resultado.cuadra) {
      throw new Error(resultado.errores.join(' '));
    }

    let rutaNueva: string | null = null;
    if (datos.fotoDataUrl) {
      if (datos.nitidez === null || !esNitida(datos.nitidez)) {
        throw new Error('La nueva foto está borrosa. Tómala otra vez.');
      }
      const { acta } = datos;
      rutaNueva = `${acta.recintoId}/${acta.juntaId}/${acta.dignidad}-v${acta.version + 1}-${Date.now()}.jpg`;
      await this.correccion.subirFoto(rutaNueva, datos.fotoDataUrl);
    }

    try {
      return await this.correccion.corregir(datos.acta.actaId, datos.totales, rutaNueva, datos.acta.version);
    } catch (e) {
      if (rutaNueva) {
        await this.correccion.borrarFoto(rutaNueva); // no dejar fotos huérfanas
      }
      throw e;
    }
  }
}
