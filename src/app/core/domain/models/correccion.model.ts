import { Dignidad, EstadoActa, TotalesActa } from './acta.model';

/** Votos guardados de una organización, con los datos para mostrarla. */
export interface VotoGuardado {
  organizacionId: string;
  siglas: string;
  organizacion: string;
  candidato: string;
  orden: number;
  votos: number;
}

/** Acta ya registrada, tal como está en la base, lista para corregir. */
export interface ActaGuardada {
  actaId: string;
  juntaId: string;
  recintoId: string;
  mesa: number;
  dignidad: Dignidad;
  estado: EstadoActa;
  version: number;
  nulos: number;
  blancos: number;
  totalSufragantes: number;
  fotoRuta: string | null;
  votos: VotoGuardado[];
}

/** Datos que se envían a corregir_acta. */
export interface DatosCorreccion {
  acta: ActaGuardada;
  totales: TotalesActa;
  fotoDataUrl: string | null;
  nitidez: number | null;
}
