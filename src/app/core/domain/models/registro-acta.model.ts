import { Dignidad, TotalesActa } from './acta.model';

export interface OrganizacionCandidato {
  organizacionId: string;
  siglas: string;
  organizacion: string;
  candidato: string;
}

export interface Ubicacion {
  latitud: number;
  longitud: number;
  precision: number;   
  capturadaAt: string; 
}

export interface FotoAnalizada {
  dataUrl: string;
  nitidez: number;
  nitida: boolean;
}

/** función registrar_acta */
export interface NuevaActa {
  juntaId: string;
  dignidad: Dignidad;
  totales: TotalesActa;
  fotoRuta: string;
  nitidez: number;
  ubicacion: Ubicacion;
  uuidCliente: string;
}