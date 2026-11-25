import { describe, it, expect } from 'vitest';
import { validarClaveNueva } from './clave.rule';

describe('validarClaveNueva', () => {
  it('acepta una contraseña con letras y números', () => {
    expect(validarClaveNueva('osoAndino25')).toBeNull();
  });

  it('rechaza contraseñas cortas, sin números o iguales a la inicial', () => {
    expect(validarClaveNueva('abc12')).not.toBeNull();
    expect(validarClaveNueva('solamenteletras')).not.toBeNull();
    expect(validarClaveNueva('Ecuador2026')).not.toBeNull();
  });
});