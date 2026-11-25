import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';

export async function mensajeDeFuncion(error: unknown, porDefecto: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const cuerpo = await error.context.json();
      if (cuerpo?.error) {
        return cuerpo.error;
      }
    } catch {
      // sin cuerpo legible
    }
  }
  if (error instanceof FunctionsFetchError) {
    return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.';
  }
  return porDefecto;
}