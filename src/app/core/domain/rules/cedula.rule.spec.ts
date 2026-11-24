import { describe, it, expect } from 'vitest';
import { validarCedula } from './cedula.rule';

describe('validarCedula', () => {
  it('acepta cédulas válidas', () => {
    expect(validarCedula('1712345675')).toBeNull();
    expect(validarCedula('0901234567')).toBeNull();
  });

  it('rechaza un dígito verificador incorrecto', () => {
    expect(validarCedula('1712345678')).not.toBeNull();
  });

  it('rechaza letras, largo incorrecto y provincia inexistente', () => {
    expect(validarCedula('17123A5675')).not.toBeNull();
    expect(validarCedula('171234')).not.toBeNull();
    expect(validarCedula('2512345678')).not.toBeNull();
  });

  it('rechaza un tercer dígito de 6 o más', () => {
    expect(validarCedula('1792345675')).not.toBeNull();
  });
});