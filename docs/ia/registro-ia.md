# Anexo de uso de IA

Registro de cómo usé herramientas de IA durante el desarrollo, para la entrega individual (sección 7 del enunciado). Una entrada por tarea relevante.

| Fecha | Herramienta | Qué pedí | Qué sugirió la IA | Qué acepté, modifiqué o descarté | Cómo lo verifiqué |
|---|---|---|---|---|---|
| 2026-11-21 | Claude | Comparar alternativas para los ADR | Supabase, Signals, Reactive Forms, guards y Capacitor | Lo usé como base; el grupo decidió en la reunión | Revisé que cumpla R1–R10 |
| 2026-11-22 | Claude | Cómo iniciar sesión con cédula en Supabase | Edge Function que busca el correo en el servidor | Acepté; descarté usar correos falsos | Documentado en ADR-002 |
| 2026-11-22 | Claude | Recuperación de contraseña por correo | Código OTP y SMTP con Brevo | Acepté Brevo; Gmail como plan B | Documentado en ADR-011 |
| 2026-11-23 | Claude | Nombre, mascota y colores de la app | Cuatro identidades con bocetos | Elegí Yupana, oso de anteojos, azul petróleo y Outfit | Comparé los bocetos y el contraste |
| 2026-11-24 | Claude | Patrón de huellas de oso para los encabezados | SVG con huellas dispersas y clases CSS | Cambié la huella por mi referencia y pedí más dispersión | Probado con `ionic serve` |
| 2026-11-24 | Claude | Reglas de cédula y suma del acta | Funciones puras en core/domain/rules con pruebas | Acepté; ajusté los mensajes de error | 9 pruebas aprobadas con `ng test` |
| 2026-11-24 | Claude | Tablas, RLS, funciones y bucket en Supabase | Migraciones SQL con políticas por rol y funciones `security definer` | Acepté; usé recintos reales del CNE y organizaciones ficticias | Probé en el SQL Editor y con cada rol en la app |
| 2026-11-24 | Claude | Crear usuarios en jerarquía con correo de bienvenida | Edge Function `crear-usuario` con validación en el servidor y API de Brevo | Acepté; desactivé "Verify JWT" por las claves ES256 | Creé coordinador y veedor desde la app |
| 2026-11-25 | Claude | Registro del acta con foto, nitidez y GPS | Flujo de 4 pasos, varianza del Laplaciano y GPS con reintento | Acepté; calibré el umbral en 800 con mis fotos (3524 / 460) y pedí bloquear negativos | Pruebas de `registrar-acta` y fotos reales |
| 2026-11-25 | Claude | Generar la APK con Capacitor | Pasos de `cap add/sync`, permisos y build en Android Studio | Acepté; corregí un método que faltaba (`soloDigitos`) | Instalé la APK en mi celular |
| 2026-11-25 | Claude | Dashboard provincial | Vistas consolidadas, porcentajes en el dominio y alerta de distancia GPS | Acepté; la alerta de 300 m fue una mejora propia del diseño | 5 pruebas de `resultados.rule` |
| 2026-11-25 | Claude | Corrección de actas | Reutilizar `corregir_acta` con versión esperada; foto solo para el coordinador | Acepté; agregué los botones en las listas de mesas | 3 pruebas de `corregir-acta` y prueba con dos usuarios |
| 2026-11-25 | Claude | Recuperar contraseña | Flujo de correo, código y clave con la plantilla "Reset Password" | Acepté; pedí rediseñarlo con el estilo del login | 3 pruebas de `recuperar-clave` y prueba con mi correo |
| 2026-11-25 | Gemini + Claude | Mascota animada | Gemini: ilustraciones del oso; Claude: quitar fondos, separar en capas y animar con CSS | Rechacé la primera versión (patas sobrepuestas y mucho movimiento); pedí que cierre los ojos y que cada oso haga su acción | Revisé cada pantalla en `ionic serve` y en el celular |
| 2026-11-25 | Claude | Ícono de la app | Ícono original de oso de anteojos y `@capacitor/assets` | Descarté usar un logo de internet por derechos de autor | Revisé el ícono dentro de la APK |
| 2026-11-25 | Claude | README y campos pendientes de los ADR | README completo; minutos del video sacados del documento compartido en la reunión | Confirmé cédulas, pruebas y versiones antes de publicarlo | Revisé el repositorio en GitHub |