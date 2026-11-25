import { Ubicacion } from '../models/registro-acta.model';

export abstract class GpsPort {
  abstract obtenerUbicacion(): Promise<Ubicacion>;
}