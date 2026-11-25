import { NuevoRecinto, Recinto } from '../models/recinto.model';

export abstract class RecintosPort {
  abstract listar(): Promise<Recinto[]>;
  abstract crear(recinto: NuevoRecinto): Promise<void>;
}