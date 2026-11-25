/** Mide la nitidez de una foto (ADR-012). */
export abstract class NitidezPort {
  abstract medir(dataUrl: string): Promise<number>;
}