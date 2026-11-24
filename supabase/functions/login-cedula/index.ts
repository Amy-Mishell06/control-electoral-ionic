// Edge Function: login con cédula (ADR-002, ADR-009)
// Recibe cédula y contraseña, busca el correo en el servidor e inicia sesión.
// El correo nunca llega a la app. Bloquea la cédula 15 minutos tras 5 intentos fallidos.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;
const MENSAJE_GENERICO = 'Cédula o contraseña incorrecta.';

function responder(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const { cedula, clave } = await req.json();
    if (typeof cedula !== 'string' || !/^\d{10}$/.test(cedula) || typeof clave !== 'string' || !clave) {
      return responder({ error: MENSAJE_GENERICO }, 400);
    }

    const url = Deno.env.get('SUPABASE_URL')!;
    // Cliente con la clave del servidor: solo existe aquí, nunca en la app.
    const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false },
    });

    // 1. ¿La cédula está bloqueada?
    const { data: intento } = await admin
      .from('intentos_login')
      .select('fallidos, bloqueado_hasta')
      .eq('cedula', cedula)
      .maybeSingle();

    if (intento?.bloqueado_hasta && new Date(intento.bloqueado_hasta) > new Date()) {
      return responder({ error: `Demasiados intentos. Espera ${MINUTOS_BLOQUEO} minutos.` }, 429);
    }

    // 2. Buscar el correo de esa cédula
    const { data: perfil } = await admin
      .from('perfiles')
      .select('correo')
      .eq('cedula', cedula)
      .maybeSingle();

    // 3. Intentar iniciar sesión con el correo encontrado
    let sesion = null;
    if (perfil) {
      const publico = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
        auth: { persistSession: false },
      });
      const { data, error } = await publico.auth.signInWithPassword({
        email: perfil.correo,
        password: clave,
      });
      if (!error) {
        sesion = data.session;
      }
    }

    // 4. Si falló, contar el intento (mismo mensaje exista o no la cédula)
    if (!sesion) {
      const fallidos = (intento?.fallidos ?? 0) + 1;
      if (fallidos >= MAX_INTENTOS) {
        const hasta = new Date(Date.now() + MINUTOS_BLOQUEO * 60_000).toISOString();
        await admin.from('intentos_login').upsert({ cedula, fallidos: 0, bloqueado_hasta: hasta });
      } else {
        await admin.from('intentos_login').upsert({ cedula, fallidos, bloqueado_hasta: null });
      }
      return responder({ error: MENSAJE_GENERICO }, 401);
    }

    // 5. Éxito: limpiar los intentos y devolver solo los tokens
    await admin.from('intentos_login').delete().eq('cedula', cedula);
    return responder({
      access_token: sesion.access_token,
      refresh_token: sesion.refresh_token,
    });
  } catch {
    return responder({ error: 'No se pudo iniciar sesión. Inténtalo de nuevo.' }, 500);
  }
});