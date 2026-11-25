import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RegistrarActaUseCase, DatosRegistro } from './registrar-acta.use-case';
import { ActasPort } from '../domain/ports/actas.port';
import { UMBRAL_NITIDEZ } from '../domain/rules/nitidez.rule';

describe('RegistrarActaUseCase', () => {
  const repo = {
    organizaciones: vi.fn(),
    subirFoto: vi.fn(),
    borrarFoto: vi.fn(),
    registrar: vi.fn(),
  };

  const datos: DatosRegistro = {
    juntaId: 'j1',
    recintoId: 'r1',
    dignidad: 'alcalde',
    totales: {
      votos: [{ organizacionId: 'o1', votos: 90 }, { organizacionId: 'o2', votos: 50 }],
      nulos: 5,
      blancos: 5,
      totalSufragantes: 150,
    },
    fotoDataUrl: 'data:image/jpeg;base64,AAA',
    nitidez: UMBRAL_NITIDEZ + 500,
    ubicacion: { latitud: -0.1, longitud: -78.4, precision: 8, capturadaAt: '2026-11-25T10:00:00Z' },
    uuidCliente: 'u1',
  };

  beforeEach(() => {
    Object.values(repo).forEach((f) => f.mockReset());
    repo.subirFoto.mockResolvedValue(undefined);
    repo.borrarFoto.mockResolvedValue(undefined);
    TestBed.configureTestingModule({ providers: [{ provide: ActasPort, useValue: repo }] });
  });

  it('no sube la foto ni registra si la suma no cuadra', async () => {
    const casoDeUso = TestBed.inject(RegistrarActaUseCase);
    const malos = { ...datos, totales: { ...datos.totales, totalSufragantes: 999 } };
    await expect(casoDeUso.ejecutar(malos)).rejects.toThrow();
    expect(repo.subirFoto).not.toHaveBeenCalled();
    expect(repo.registrar).not.toHaveBeenCalled();
  });

  it('borra la foto si el registro falla', async () => {
    repo.registrar.mockRejectedValue(new Error('Esta mesa ya tiene registrada el acta.'));
    const casoDeUso = TestBed.inject(RegistrarActaUseCase);
    await expect(casoDeUso.ejecutar(datos)).rejects.toThrow();
    expect(repo.borrarFoto).toHaveBeenCalled();
  });
});