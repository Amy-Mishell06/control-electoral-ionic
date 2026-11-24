import { InjectionToken } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';

/**
 * Cliente único de Supabase para toda la app (ADR-009).
 * Solo la capa de infraestructura lo usa; las pantallas nunca lo importan (ADR-004).
 */
export const SUPABASE = new InjectionToken<SupabaseClient>('SUPABASE', {
  providedIn: 'root',
  factory: () => createClient(environment.supabaseUrl, environment.supabaseKey),
});