/**
 * Umbral de nitidez (ADR-012). Se calibra con fotos reales del acta
 * en el celular de la defensa y el valor final se anota en el README.
 */
export const UMBRAL_NITIDEZ = 800;

/**
 * Varianza del Laplaciano sobre una imagen en escala de grises (ADR-012).
 * El filtro resalta los bordes: una foto nítida tiene bordes marcados (varianza alta);
 * una borrosa, bordes suaves (varianza baja).
 */
export function varianzaLaplaciano(gris: ArrayLike<number>, ancho: number, alto: number): number {
  let suma = 0;
  let sumaCuadrados = 0;
  let cantidad = 0;
  for (let y = 1; y < alto - 1; y++) {
    for (let x = 1; x < ancho - 1; x++) {
      const i = y * ancho + x;
      const laplaciano =
        gris[i - ancho] + gris[i + ancho] + gris[i - 1] + gris[i + 1] - 4 * gris[i];
      suma += laplaciano;
      sumaCuadrados += laplaciano * laplaciano;
      cantidad++;
    }
  }
  if (cantidad === 0) {
    return 0;
  }
  const media = suma / cantidad;
  return sumaCuadrados / cantidad - media * media;
}

export function esNitida(varianza: number, umbral = UMBRAL_NITIDEZ): boolean {
  return varianza >= umbral;
}