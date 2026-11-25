import {
  ActaResumen, Coordenada, ResultadoConPorcentaje, ResultadoOrganizacion, TotalesDignidad,
} from '../models/resultados.model';

/** Distancia desde la que un acta se marca como "lejos del recinto". */
export const DISTANCIA_MAXIMA_M = 300;

/** Porcentaje de cada organización sobre los votos válidos, de mayor a menor. */
export function calcularPorcentajes(filas: ResultadoOrganizacion[]): ResultadoConPorcentaje[] {
  const validos = filas.reduce((suma, f) => suma + f.votos, 0);
  return filas
    .map((f) => ({ ...f, porcentaje: validos === 0 ? 0 : Math.round((f.votos * 10000) / validos) / 100 }))
    .sort((a, b) => b.votos - a.votos);
}

/** Suma nulos, blancos y sufragantes de las actas, agrupando por dignidad. */
export function sumarActas(actas: ActaResumen[]): TotalesDignidad[] {
  const grupos = new Map<string, TotalesDignidad>();
  for (const a of actas) {
    const g = grupos.get(a.dignidad) ?? { dignidad: a.dignidad, actas: 0, nulos: 0, blancos: 0, sufragantes: 0 };
    g.actas += 1;
    g.nulos += a.nulos;
    g.blancos += a.blancos;
    g.sufragantes += a.totalSufragantes;
    grupos.set(a.dignidad, g);
  }
  return [...grupos.values()];
}

/** Porcentaje entero de avance, sin pasar de 100. */
export function porcentajeAvance(recibidas: number, esperadas: number): number {
  if (esperadas <= 0) {
    return 0;
  }
  return Math.min(100, Math.round((recibidas * 100) / esperadas));
}

/** Distancia en metros entre dos puntos (fórmula de Haversine). */
export function distanciaMetros(a: Coordenada, b: Coordenada): number {
  const R = 6371000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.latitud - a.latitud);
  const dLon = rad(b.longitud - a.longitud);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitud)) * Math.cos(rad(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}
