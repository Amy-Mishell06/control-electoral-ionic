import { TotalesActa } from '../models/acta.model';

export interface ResultadoTotales {
  cuadra: boolean;
  suma: number;
  /** Positivo si faltan votos; negativo si sobran. */
  diferencia: number;
  errores: string[];
}

/**
 * Comprueba que votos de organizaciones + nulos + blancos
 * sea igual al total de sufragantes (R6, ADR-006).
 */
export function validarTotalesActa(acta: TotalesActa): ResultadoTotales {
  const errores: string[] = [];
  const numeros = [
    ...acta.votos.map((v) => v.votos),
    acta.nulos,
    acta.blancos,
    acta.totalSufragantes,
  ];

  if (numeros.some((n) => !Number.isInteger(n) || n < 0)) {
    errores.push('Todos los valores deben ser números enteros, sin negativos.');
  }

  const suma =
    acta.votos.reduce((total, v) => total + v.votos, 0) + acta.nulos + acta.blancos;
  const diferencia = acta.totalSufragantes - suma;

  if (diferencia > 0) {
    errores.push(`Faltan ${diferencia} votos para llegar al total.`);
  } else if (diferencia < 0) {
    errores.push(`Sobran ${-diferencia} votos respecto al total.`);
  }

  return { cuadra: errores.length === 0, suma, diferencia, errores };
}