import { Dignidad, TotalesActa } from '../models/acta.model';
import { ActaGuardada } from '../models/correccion.model';

/** Operaciones para corregir un acta ya registrada (ADR-004, ADR-014). */
export abstract class CorreccionPort {
  abstract actaDe(juntaId: string, dignidad: Dignidad): Promise<ActaGuardada | null>;
  /** Devuelve la nueva versión del acta. */
  abstract corregir(
    actaId: string, totales: TotalesActa, fotoRuta: string | null, versionEsperada: number,
  ): Promise<number>;
  abstract subirFoto(ruta: string, dataUrl: string): Promise<void>;
  abstract borrarFoto(ruta: string): Promise<void>;
  abstract urlFoto(ruta: string): Promise<string>;
}
