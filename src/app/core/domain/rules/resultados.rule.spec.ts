import { describe, expect, it } from 'vitest';
import { ResultadoOrganizacion } from '../models/resultados.model';
import { calcularPorcentajes, distanciaMetros, porcentajeAvance, sumarActas } from './resultados.rule';

const fila = (siglas: string, votos: number): ResultadoOrganizacion => ({
  dignidad: 'alcalde', organizacionId: siglas, siglas, organizacion: siglas, candidato: 'X', votos,
});

describe('reglas del dashboard', () => {
  it('calcula porcentajes sobre votos válidos y ordena de mayor a menor', () => {
    const r = calcularPorcentajes([fila('MCH', 30), fila('FIL', 90), fila('APA', 0)]);
    expect(r.map((f) => f.siglas)).toEqual(['FIL', 'MCH', 'APA']);
    expect(r[0].porcentaje).toBe(75);
    expect(r[1].porcentaje).toBe(25);
  });

  it('no divide para cero cuando aún no hay votos', () => {
    expect(calcularPorcentajes([fila('MCH', 0)])[0].porcentaje).toBe(0);
  });

  it('suma nulos, blancos y sufragantes por dignidad', () => {
    const t = sumarActas([
      { dignidad: 'alcalde', nulos: 2, blancos: 1, totalSufragantes: 100 },
      { dignidad: 'alcalde', nulos: 3, blancos: 0, totalSufragantes: 80 },
    ]);
    expect(t).toEqual([{ dignidad: 'alcalde', actas: 2, nulos: 5, blancos: 1, sufragantes: 180 }]);
  });

  it('el avance no pasa de 100 ni falla sin actas esperadas', () => {
    expect(porcentajeAvance(36, 72)).toBe(50);
    expect(porcentajeAvance(5, 0)).toBe(0);
    expect(porcentajeAvance(80, 72)).toBe(100);
  });

  it('mide distancias cortas en metros', () => {
    const recinto = { latitud: -0.104291, longitud: -78.48755 };
    expect(distanciaMetros(recinto, recinto)).toBe(0);
    const d = distanciaMetros(recinto, { latitud: -0.103391, longitud: -78.48755 });
    expect(d).toBeGreaterThan(95);
    expect(d).toBeLessThan(105);
  });
});
