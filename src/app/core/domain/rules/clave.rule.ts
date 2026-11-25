/** Contraseña inicial que reciben todas las cuentas (R3). */
export const CLAVE_INICIAL = 'Ecuador2026';


export function validarClaveNueva(clave: string): string | null {
  if (clave.length < 8) {
    return 'Usa al menos 8 caracteres.';
  }
  if (!/[A-Za-z]/.test(clave) || !/[0-9]/.test(clave)) {
    return 'Combina letras y números.';
  }
  if (clave === CLAVE_INICIAL) {
    return 'Elige una contraseña distinta de la inicial.';
  }
  return null;
}