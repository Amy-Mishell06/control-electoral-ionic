// Edge Function: crear usuarios de forma jerárquica (ADR-002, ADR-011)
// Provincial → coordinadores de recinto. Coordinador de recinto → veedores de su recinto.
// La clave service_role solo existe aquí. Envía el correo de bienvenida con la API de Brevo.
import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CLAVE_INICIAL = 'Ecuador2026';

function responder(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

/** Misma regla que core/domain/rules/cedula.rule.ts, pero en el servidor. */
function cedulaValida(cedula: string): boolean {
  if (!/^\d{10}$/.test(cedula)) return false;
  const provincia = Number(cedula.substring(0, 2));
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;
  if (Number(cedula[2]) >= 6) return false;
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;
  for (let i = 0; i < 9; i++) {
    let producto = Number(cedula[i]) * coeficientes[i];
    if (producto > 9) producto -= 9;
    suma += producto;
  }
  return (10 - (suma % 10)) % 10 === Number(cedula[9]);
}

function escaparHtml(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }

  try {
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    );

    // 1. ¿Quién llama? (se valida el token de su sesión)
    const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) {
      return responder({ error: 'Tu sesión terminó. Vuelve a iniciar sesión.' }, 401);
    }

    const { data: creador } = await admin
      .from('perfiles')
      .select('id, rol, recinto_id, debe_cambiar_clave')
      .eq('id', user.id)
      .maybeSingle();
    if (!creador || creador.debe_cambiar_clave) {
      return responder({ error: 'No tienes permiso para crear usuarios.' }, 403);
    }

    // 2. Datos recibidos
    const cuerpo = await req.json();
    const cedula = String(cuerpo.cedula ?? '').trim();
    const nombres = String(cuerpo.nombres ?? '').trim();
    const apellidos = String(cuerpo.apellidos ?? '').trim();
    const telefono = String(cuerpo.telefono ?? '').trim();
    const correo = String(cuerpo.correo ?? '').trim().toLowerCase();
    const rol = String(cuerpo.rol ?? '');

    // 3. ¿Su rol puede crear este tipo de usuario? ¿En qué recinto?
    let recintoId: string;
    if (creador.rol === 'provincial' && rol === 'coordinador_recinto') {
      if (!cuerpo.recinto_id) {
        return responder({ error: 'Elige el recinto del coordinador.' }, 400);
      }
      recintoId = String(cuerpo.recinto_id);
    } else if (creador.rol === 'coordinador_recinto' && rol === 'veedor') {
      recintoId = creador.recinto_id; // siempre su propio recinto
    } else {
      return responder({ error: 'Tu rol no puede crear este tipo de usuario.' }, 403);
    }

    // 4. Validaciones en el servidor
    if (!cedulaValida(cedula)) {
      return responder({ error: 'La cédula no es válida.' }, 400);
    }
    if (!nombres || !apellidos) {
      return responder({ error: 'Completa los nombres y apellidos.' }, 400);
    }
    if (!/^\d{10}$/.test(telefono)) {
      return responder({ error: 'El teléfono debe tener 10 dígitos.' }, 400);
    }
    if (!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(correo)) {
      return responder({ error: 'El correo no es válido.' }, 400);
    }

    const { data: recinto } = await admin
      .from('recintos').select('id, nombre').eq('id', recintoId).maybeSingle();
    if (!recinto) {
      return responder({ error: 'El recinto no existe.' }, 400);
    }

    const { data: mismaCedula } = await admin
      .from('perfiles').select('id').eq('cedula', cedula).maybeSingle();
    if (mismaCedula) {
      return responder({ error: 'Ya existe un usuario con esa cédula.' }, 409);
    }
    const { data: mismoCorreo } = await admin
      .from('perfiles').select('id').eq('correo', correo).maybeSingle();
    if (mismoCorreo) {
      return responder({ error: 'Ya existe un usuario con ese correo.' }, 409);
    }
    if (rol === 'coordinador_recinto') {
      const { data: yaTiene } = await admin
        .from('perfiles').select('id')
        .eq('recinto_id', recintoId).eq('rol', 'coordinador_recinto').maybeSingle();
      if (yaTiene) {
        return responder({ error: 'Este recinto ya tiene un coordinador.' }, 409);
      }
    }

    // 5. Crear la cuenta y su perfil
    const { data: creado, error: errorCuenta } = await admin.auth.admin.createUser({
      email: correo,
      password: CLAVE_INICIAL,
      email_confirm: true, // la confirmación real es el OTP del primer acceso (ADR-011)
    });
    if (errorCuenta || !creado.user) {
      return responder({ error: 'No se pudo crear la cuenta. Revisa que el correo no esté registrado.' }, 409);
    }

    const { error: errorPerfil } = await admin.from('perfiles').insert({
      id: creado.user.id,
      cedula,
      nombres,
      apellidos,
      telefono,
      correo,
      rol,
      recinto_id: recintoId,
    });
    if (errorPerfil) {
      await admin.auth.admin.deleteUser(creado.user.id); // no dejar cuentas sin perfil
      return responder({ error: 'No se pudo guardar el usuario. Revisa los datos.' }, 409);
    }

    // 6. Correo de bienvenida (si falla, el usuario igual queda creado)
    const enviado = await enviarBienvenida({ correo, nombres, cedula, rol, recinto: recinto.nombre });
    if (enviado) {
      await admin.from('perfiles')
        .update({ bienvenida_enviada_at: new Date().toISOString() })
        .eq('id', creado.user.id);
    }

    return responder({ id: creado.user.id, bienvenidaEnviada: enviado }, 201);
  } catch {
    return responder({ error: 'No se pudo crear el usuario. Inténtalo de nuevo.' }, 500);
  }
});

async function enviarBienvenida(d: {
  correo: string; nombres: string; cedula: string; rol: string; recinto: string;
}): Promise<boolean> {
  const apiKey = Deno.env.get('BREVO_API_KEY');
  const remitente = Deno.env.get('BREVO_REMITENTE');
  if (!apiKey || !remitente) return false;

  const rolTexto = d.rol === 'veedor' ? 'Veedor de mesa' : 'Coordinador de recinto';
  const html = `
    <h2>¡Bienvenido a Yupana, ${escaparHtml(d.nombres)}!</h2>
    <p>Se creó tu cuenta como <strong>${rolTexto}</strong> en el recinto <strong>${escaparHtml(d.recinto)}</strong>.</p>
    <p><strong>Usuario:</strong> ${d.cedula}<br><strong>Contraseña inicial:</strong> ${CLAVE_INICIAL}</p>
    <p>En tu primer acceso recibirás un código en este correo para activar tu cuenta y crear tu propia contraseña.</p>
  `;

  try {
    const respuesta = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Yupana', email: remitente },
        to: [{ email: d.correo, name: d.nombres }],
        subject: 'Bienvenido a Yupana',
        htmlContent: html,
      }),
    });
    return respuesta.ok;
  } catch {
    return false;
  }
}