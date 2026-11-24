/**
 * Valida una cédula ecuatoriana (R2, ADR-006).
 * Reglas: 10 dígitos, provincia 01–24 o 30, tercer dígito menor que 6
 * y dígito verificador con el algoritmo módulo 10.
 * Devuelve null si es válida, o el motivo si no lo es.
 */
export function validarCedula(cedula: string): string | null {
  const limpia = cedula.trim();

  if (!/^\d{10}$/.test(limpia)) {
    return 'La cédula debe tener al menos 10 números.';
  }

  const provincia = Number(limpia.substring(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) {
    return 'Los dos primeros números no corresponden a una provincia, VERIFICA..!!';
  }

  if (Number(limpia[2]) >= 6) {
    return 'El tercer número de una cédula debe ser menor que 6.';
  }

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let producto = Number(limpia[i]) * coeficientes[i];
    if (producto > 9) {
      producto -= 9;
    }
    suma += producto;
  }
  const verificador = (10 - (suma % 10)) % 10;

  if (verificador !== Number(limpia[9])) {
    return 'La cédula no es válida. Verifica los números.';
  }

  return null;
}