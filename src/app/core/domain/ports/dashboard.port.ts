import {
  ActaResumen, ActaUbicada, AvanceRecinto, ResultadoOrganizacion,
} from '../models/resultados.model';

/** Lo que el dashboard provincial necesita leer, sin saber de Supabase (ADR-004). */
export abstract class DashboardPort {
  abstract resultados(): Promise<ResultadoOrganizacion[]>;
  abstract actasResumen(): Promise<ActaResumen[]>;
  abstract avance(): Promise<AvanceRecinto[]>;
  abstract actasUbicadas(): Promise<ActaUbicada[]>;
  abstract urlFoto(ruta: string): Promise<string>;
}
