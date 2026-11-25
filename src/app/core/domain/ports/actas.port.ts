import { Dignidad } from '../models/acta.model';
import { NuevaActa, OrganizacionCandidato } from '../models/registro-acta.model';

export abstract class ActasPort {
  abstract organizaciones(dignidad: Dignidad): Promise<OrganizacionCandidato[]>;
  abstract subirFoto(ruta: string, dataUrl: string): Promise<void>;
  abstract borrarFoto(ruta: string): Promise<void>;
  abstract registrar(acta: NuevaActa): Promise<string>;
}