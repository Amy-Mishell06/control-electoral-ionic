import { describe, it, expect } from 'vitest';
import { validarTotalesActa } from './acta.rule';

const votos = [82, 64, 51, 23, 12].map((v, i) => ({ organizacionId: `org${i}`, votos: v }));

describe('validarTotalesActa', () => {
  it('cuadra cuando la suma es igual al total', () => {
    const r = validarTotalesActa({ votos, nulos: 9, blancos: 9, totalSufragantes: 250 });
    expect(r.cuadra).toBe(true);
  });

  it('indica cuántos votos faltan', () => {
    const r = validarTotalesActa({ votos, nulos: 9, blancos: 7, totalSufragantes: 250 });
    expect(r.cuadra).toBe(false);
    expect(r.diferencia).toBe(2);
  });

  it('rechaza valores negativos', () => {
    const r = validarTotalesActa({ votos, nulos: -1, blancos: 11, totalSufragantes: 250 });
    expect(r.cuadra).toBe(false);
  });
});