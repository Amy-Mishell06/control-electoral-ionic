import { EstadoActa } from './acta.model';

/** Una mesa con su veedor y el estado de sus dos actas (vista v_estado_juntas). */
export interface EstadoJunta {
  juntaId: string;
  recintoId: string;
  recinto: string;
  numero: number;
  veedorId: string | null;
  veedor: string | null;
  estadoAlcalde: EstadoActa;
  estadoPrefecto: EstadoActa;
}

export interface Veedor {
  id: string;
  nombre: string;
  cedula: string;
}