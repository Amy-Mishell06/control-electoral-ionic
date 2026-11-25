import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActaGuardada } from '../domain/models/correccion.model';
import { CorreccionPort } from '../domain/ports/correccion.port';
import { UMBRAL_NITIDEZ } from '../domain/rules/nitidez.rule';
import { CorregirActaUseCase } from './corregir-acta.use-case';

const acta: ActaGuardada = {
  actaId: 'a1', juntaId: 'j1', recintoId: 'r1', mesa: 2, dignidad: 'alcalde', estado: 'registrada',
  version: 1, nulos: 2, blancos: 1, totalSufragantes: 13, fotoRuta: 'r1/j1/alcalde.jpg', votos: [],
};
const totalesOk = { votos: [{ organizacionId: 'o1', votos: 10 }], nulos: 2, blancos: 1, totalSufragantes: 13 };

describe('CorregirActaUseCase', () => {
  let puerto: { [K in keyof CorreccionPort]: ReturnType<typeof vi.fn> };
  let casoDeUso: CorregirActaUseCase;

  beforeEach(() => {
    puerto = {
      actaDe: vi.fn(),
      corregir: vi.fn().mockResolvedValue(2),
      subirFoto: vi.fn().mockResolvedValue(undefined),
      borrarFoto: vi.fn().mockResolvedValue(undefined),
      urlFoto: vi.fn(),
    };
    TestBed.configureTestingModule({ providers: [{ provide: CorreccionPort, useValue: puerto }] });
    casoDeUso = TestBed.inject(CorregirActaUseCase);
  });

  it('envía la versión esperada y devuelve la nueva', async () => {
    const version = await casoDeUso.ejecutar({ acta, totales: totalesOk, fotoDataUrl: null, nitidez: null });
    expect(version).toBe(2);
    expect(puerto.corregir).toHaveBeenCalledWith('a1', totalesOk, null, 1);
  });

  it('no llama a la base si los totales no cuadran', async () => {
    const malos = { ...totalesOk, totalSufragantes: 99 };
    await expect(casoDeUso.ejecutar({ acta, totales: malos, fotoDataUrl: null, nitidez: null })).rejects.toThrow();
    expect(puerto.corregir).not.toHaveBeenCalled();
  });

  it('borra la foto nueva si la corrección falla (por ejemplo, otra versión)', async () => {
    puerto.corregir.mockRejectedValue(new Error('El acta cambió mientras la editabas.'));
    await expect(
      casoDeUso.ejecutar({ acta, totales: totalesOk, fotoDataUrl: 'data:image/jpeg;base64,x', nitidez: UMBRAL_NITIDEZ + 500 }),
    ).rejects.toThrow('El acta cambió');
    expect(puerto.subirFoto).toHaveBeenCalled();
    expect(puerto.borrarFoto).toHaveBeenCalledWith(puerto.subirFoto.mock.calls[0][0]);
  });
});
