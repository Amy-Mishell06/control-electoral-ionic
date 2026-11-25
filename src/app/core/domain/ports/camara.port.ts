export abstract class CamaraPort {
  /** Devuelve la foto como dataUrl, o null si el usuario canceló. */
  abstract tomarFoto(): Promise<string | null>;
}