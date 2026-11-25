import { Perfil } from '../models/perfil.model';

/**
 * Lo que la app necesita para autenticarse, sin decir cómo se hace (ADR-004).
 * La infraestructura lo implementa con Supabase.
 */
export abstract class AuthPort {
  abstract iniciarSesion(cedula: string, clave: string): Promise<Perfil>;
  abstract perfilActual(): Promise<Perfil | null>;
  abstract cerrarSesion(): Promise<void>;
}