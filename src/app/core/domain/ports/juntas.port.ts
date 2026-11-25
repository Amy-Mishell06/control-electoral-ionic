import { EstadoJunta, Veedor } from '../models/junta.model';

export abstract class JuntasPort {
  abstract listarEstado(): Promise<EstadoJunta[]>;
  abstract listarVeedores(): Promise<Veedor[]>;
  abstract asignarVeedor(juntaId: string, veedorId: string): Promise<void>;
}