import { Dignidad, EstadoActa } from './acta.model';

/** Votos consolidados de una organización (vista v_resultados_consolidados). */
export interface ResultadoOrganizacion {
  dignidad: Dignidad;
  organizacionId: string;
  siglas: string;
  organizacion: string;
  candidato: string;
  votos: number;
}

export interface ResultadoConPorcentaje extends ResultadoOrganizacion {
  porcentaje: number;
}

/** Datos mínimos de un acta para sumar nulos, blancos y sufragantes. */
export interface ActaResumen {
  dignidad: Dignidad;
  nulos: number;
  blancos: number;
  totalSufragantes: number;
}

export interface TotalesDignidad {
  dignidad: Dignidad;
  actas: number;
  nulos: number;
  blancos: number;
  sufragantes: number;
}

/** Avance de actas por recinto (vista v_avance_recintos). */
export interface AvanceRecinto {
  recintoId: string;
  nombre: string;
  parroquia: string;
  esperadas: number;
  recibidas: number;
}

export interface Coordenada {
  latitud: number;
  longitud: number;
}

/** Acta registrada con ubicación GPS, para revisar dónde se tomó. */
export interface ActaUbicada {
  actaId: string;
  dignidad: Dignidad;
  estado: EstadoActa;
  mesa: number;
  recinto: string;
  ubicacion: Coordenada;
  ubicacionRecinto: Coordenada | null;
  precisionM: number | null;
  capturadaAt: string | null;
  fotoRuta: string | null;
  nitidez: number | null;
}
