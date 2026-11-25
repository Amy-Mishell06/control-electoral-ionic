import { describe, it, expect } from 'vitest';
import { esNitida, varianzaLaplaciano } from './nitidez.rule';

const ANCHO = 20;
const ALTO = 20;

/** bordes muy marcados */
function tablero(): number[] {
  const gris: number[] = [];
  for (let y = 0; y < ALTO; y++) {
    for (let x = 0; x < ANCHO; x++) {
      gris.push((Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0 ? 0 : 255);
    }
  }
  return gris;
}

/** Desenfoque simple */
function desenfocar(gris: number[]): number[] {
  return gris.map((_, i) => {
    const x = i % ANCHO;
    const y = Math.floor(i / ANCHO);
    let suma = 0;
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < ANCHO && ny >= 0 && ny < ALTO) {
          suma += gris[ny * ANCHO + nx];
          n++;
        }
      }
    }
    return suma / n;
  });
}

describe('varianzaLaplaciano', () => {
  it('una imagen nítida tiene más varianza que su versión desenfocada', () => {
    const nitida = varianzaLaplaciano(tablero(), ANCHO, ALTO);
    const borrosa = varianzaLaplaciano(desenfocar(tablero()), ANCHO, ALTO);
    expect(nitida).toBeGreaterThan(borrosa);
  });

  it('una imagen lisa (sin bordes) no es nítida', () => {
    const lisa = new Array(ANCHO * ALTO).fill(128);
    expect(esNitida(varianzaLaplaciano(lisa, ANCHO, ALTO))).toBe(false);
  });
});