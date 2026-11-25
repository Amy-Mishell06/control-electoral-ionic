import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CrearUsuarioUseCase } from './crear-usuario.use-case';
import { UsuariosPort } from '../domain/ports/usuarios.port';

describe('CrearUsuarioUseCase', () => {
  const repositorioFalso = { crear: vi.fn() };

  beforeEach(() => {
    repositorioFalso.crear.mockReset();
    repositorioFalso.crear.mockResolvedValue({ id: 'nuevo', bienvenidaEnviada: true });
    TestBed.configureTestingModule({
      providers: [{ provide: UsuariosPort, useValue: repositorioFalso }],
    });
  });

  const datos = {
    cedula: '1700000043',
    nombres: 'Luis',
    apellidos: 'Quinatoa',
    telefono: '0990000004',
    correo: ' Luis@Ejemplo.com ',
    rol: 'veedor' as const,
    recintoId: null,
  };

  it('no llama al repositorio si la cédula es inválida', async () => {
    const casoDeUso = TestBed.inject(CrearUsuarioUseCase);
    await expect(casoDeUso.ejecutar({ ...datos, cedula: '1700000044' })).rejects.toThrow();
    expect(repositorioFalso.crear).not.toHaveBeenCalled();
  });

  it('normaliza el correo y llama al repositorio con datos válidos', async () => {
    const casoDeUso = TestBed.inject(CrearUsuarioUseCase);
    await casoDeUso.ejecutar(datos);
    expect(repositorioFalso.crear).toHaveBeenCalledWith(
      expect.objectContaining({ correo: 'luis@ejemplo.com' }),
    );
  });
});