import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RecuperacionPort } from '../domain/ports/recuperacion.port';
import { RecuperarClaveUseCase } from './recuperar-clave.use-case';

describe('RecuperarClaveUseCase', () => {
  let puerto: { [K in keyof RecuperacionPort]: ReturnType<typeof vi.fn> };
  let casoDeUso: RecuperarClaveUseCase;

  beforeEach(() => {
    puerto = {
      enviarCodigo: vi.fn().mockResolvedValue(undefined),
      verificarCodigo: vi.fn().mockResolvedValue(undefined),
      cambiarClave: vi.fn().mockResolvedValue(undefined),
      cerrarSesion: vi.fn().mockResolvedValue(undefined),
    };
    TestBed.configureTestingModule({ providers: [{ provide: RecuperacionPort, useValue: puerto }] });
    casoDeUso = TestBed.inject(RecuperarClaveUseCase);
  });

  it('limpia el correo antes de enviar el código y rechaza correos inválidos', async () => {
    await casoDeUso.enviarCodigo('  Veedor@Correo.COM ');
    expect(puerto.enviarCodigo).toHaveBeenCalledWith('veedor@correo.com');
    await expect(casoDeUso.enviarCodigo('sin-arroba')).rejects.toThrow('correo válido');
  });

  it('no consulta a Supabase si el código no tiene 6 dígitos', async () => {
    await expect(casoDeUso.verificarCodigo('a@b.ec', '12a')).rejects.toThrow('6 dígitos');
    expect(puerto.verificarCodigo).not.toHaveBeenCalled();
  });

  it('no cambia la clave si la confirmación no coincide', async () => {
    await expect(casoDeUso.cambiarClave('Montaña2026x', 'Otra2026xx')).rejects.toThrow();
    expect(puerto.cambiarClave).not.toHaveBeenCalled();
  });
});
