/** Recuperar la contraseña con un código enviado al correo (ADR-011). */
export abstract class RecuperacionPort {
  abstract enviarCodigo(correo: string): Promise<void>;
  abstract verificarCodigo(correo: string, codigo: string): Promise<void>;
  abstract cambiarClave(clave: string): Promise<void>;
  abstract cerrarSesion(): Promise<void>;
}
