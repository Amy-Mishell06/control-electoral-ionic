export interface Recinto {
  id: string;
  parroquia: string;
  nombre: string;
  cantidadJrv: number;
  latitud: number | null;
  longitud: number | null;
  coordinador: string | null; // nombre del coordinador, si ya tiene
}

export interface NuevoRecinto {
  parroquia: string;
  nombre: string;
  cantidadJrv: number;
  latitud: number | null;
  longitud: number | null;
}