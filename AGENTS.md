# AGENTS.md — App de control electoral (Grupo 4)

Instrucciones para cualquier agente de IA (Claude Code, Codex, Cursor, Copilot…) que trabaje en este repositorio. Léelas completas antes de tocar código.

## 1. Qué es este proyecto

App móvil en **Ionic Angular (standalone) + Capacitor + Supabase** para que una organización política registre y supervise actas de escrutinio. Tres roles:

| Rol | Qué hace |
|---|---|
| Coordinador provincial | Crea recintos, crea y asigna un coordinador por recinto, ve avance, GPS y dashboard de votos. |
| Coordinador de recinto | Ve las mesas de su recinto, crea veedores, los asigna o reasigna a JRV y corrige actas y fotos. |
| Veedor | Ve solo sus mesas y registra las actas de alcalde y prefecto, con foto, GPS y totales que cuadran. |

Este repositorio es **individual**: cada integrante tiene el suyo, con su propia identidad visual, pero **todas respetamos los mismos ADR**.

## 2. Los ADR son la ley

Las decisiones de arquitectura están en `docs/adr/`. Antes de proponer o escribir código, abre el ADR que corresponda:

| Tema | ADR |
|---|---|
| Framework | ADR-001 |
| Supabase, RLS, modelo de datos, funciones SQL | ADR-002 |
| Cámara y GPS | ADR-003 |
| Capas y carpetas | ADR-004 |
| Estado con Signals | ADR-005 |
| Formularios y validaciones | ADR-006 |
| Rutas y guards | ADR-007 |
| Mensajes, errores, loading | ADR-008 |
| SDK de Supabase y Edge Functions | ADR-009 |
| Pruebas | ADR-010 |
| Correos, OTP, Brevo | ADR-011 |
| Nitidez de la foto | ADR-012 |
| Animaciones y Lottie | ADR-013 |
| Modo sin conexión (extra) | ADR-014 |

Reglas:

- **No contradigas un ADR.** Si una tarea lo exige (nueva librería, otro patrón, otra tabla), detente, explica el conflicto y propone un **ADR de reemplazo** en `docs/adr/ADR-0XX-titulo-corto.md`. Nunca reescribas un ADR aceptado en silencio.
- **Toda dependencia nueva necesita justificación en un ADR.** Pregunta antes de ejecutar `npm install`.
- Cita el ADR en tus explicaciones y en los mensajes de commit (`feat(veedor): registrar acta [ADR-002, ADR-006]`).

## 3. Estructura obligatoria (ADR-004)

```
src/app/
├─ core/
│  ├─ domain/          → modelos, puertos (clases abstractas), reglas puras
│  ├─ application/     → casos de uso: registrar-acta, corregir-acta, crear-usuario, asignar-veedor
│  └─ infrastructure/  → Supabase, Capacitor (cámara, GPS, red), mappers, ErrorMapper
└─ presentation/
   ├─ shared/          → componentes comunes, validadores de formulario, <app-lottie>
   ├─ auth/            → login, activar cuenta (OTP), recuperar contraseña
   ├─ provincial/
   ├─ recinto/
   └─ veedor/
```

- `core/domain/` no importa nada de Angular, Ionic, Capacitor ni Supabase. Solo TypeScript puro.
- `presentation/` nunca importa `@supabase/supabase-js` ni `@capacitor/*`. Pide lo que necesite a un servicio o caso de uso.
- Los puertos son **clases abstractas** y se enlazan en `app.config.ts` con `{ provide: Puerto, useClass: Implementacion }`.
- Componentes **standalone** siempre; nunca crees `*.module.ts`.

## 4. Seguridad (no negociable)

- **Nunca** pongas la `service_role` ni la API key de Brevo en la app, en `environment.ts` ni en el repositorio. Viven solo como secretos de las Edge Functions.
- `environment.ts` está en `.gitignore`; el ejemplo es `environment.example.ts`.
- La app **no inserta directamente** en `actas` ni en `votos_acta`: usa `rpc('registrar_acta')` y `rpc('corregir_acta')`.
- Toda tabla nueva lleva políticas RLS y su prueba en `supabase/tests/rls.sql`.
- Los cambios de base de datos se hacen con una migración nueva en `supabase/migrations/`, nunca a mano en el panel sin dejar el SQL en el repositorio.
- Ocultar un botón **no** es seguridad: la regla real va en RLS o en la función SQL.

## 5. Estado, formularios y mensajes

- Estado con **Signals** dentro de servicios, con el tipo `Estado<T>` (`idle | loading | success | empty | error`). Expón los signals con `asReadonly()` y ofrece `reset()` para cerrar sesión (ADR-005).
- Formularios **Reactive Forms tipados**. Las reglas (cédula, suma del acta) son funciones puras en `core/domain/rules/`; los validadores de Angular solo las envuelven (ADR-006).
- Cada pantalla muestra sus cinco estados. Errores siempre a través del `ErrorMapper`, en español y sin texto técnico (ADR-008).
- Toda operación de guardado desactiva su botón mientras corre.

## 6. Diseño, UX y animaciones

Para cualquier pantalla, componente, estilo, ícono o animación, **usa la skill `diseno-ui-electoral`**. Está en `.agents/skills/diseno-ui-electoral/` (Codex) y en `.claude/skills/diseno-ui-electoral/` (Claude Code); las dos copias deben ser idénticas. Si no puedes cargar skills, lee directamente su `SKILL.md`. Resumen:

- La identidad visual de este repositorio está en `docs/design/identidad.md`. Usa **solo** sus tokens (colores, tipografía, radios, mascota). No inventes colores sueltos en los componentes.
- El veedor trabaja de pie, con prisa y a veces al sol: botones grandes, una acción principal por pantalla, texto claro, alto contraste.
- Lottie solo donde comunica un estado (ver la skill). Nunca como decoración en listas o botones repetidos.

## 7. Pruebas antes de dar algo por terminado

- `npm run lint` sin errores (incluye la regla de importaciones de capas).
- `ng test` en verde. Toda regla de dominio o caso de uso nuevo lleva su prueba.
- Si tocaste RLS o funciones SQL: corre `supabase/tests/rls.sql`.
- Si tocaste cámara, GPS o permisos: dilo explícitamente, porque hay que probarlo en un celular real.

## 8. Modo tutor: estamos aprendiendo

Las personas de este repositorio están aprendiendo y deberán **defender el código** frente al docente. Por eso:

1. **Antes de escribir código**, explica en 3 a 5 líneas qué vas a hacer, en qué capa y qué ADR lo respalda.
2. **Cambios pequeños**: una funcionalidad por vez, nunca reescribas archivos enteros que funcionan.
3. **Después de escribir código**, explica las partes no obvias con lenguaje sencillo y propone una pregunta que el docente podría hacer sobre ese código, con su respuesta.
4. Si la persona pide "hazlo todo", divide la tarea en pasos y avanza de uno en uno.
5. No uses patrones que no estén en los ADR solo porque sean "mejores".
6. Cuando algo falle, enseña a leer el error antes de corregirlo.

## 9. Registro de uso de IA (obligatorio para la entrega)

El examen exige un anexo de uso de IA. Después de cada tarea relevante, agrega una entrada en `docs/ia/registro-ia.md` con: fecha, herramienta, lo que se pidió, lo que sugeriste, qué se aceptó o descartó y cómo se verificó. Si la persona modificó tu propuesta, anótalo.

## 10. Comandos

| Acción | Comando |
|---|---|
| Servidor de desarrollo | `ionic serve` |
| Pruebas | `ng test` |
| Lint | `npm run lint` |
| Compilar y abrir Android | `ionic cap build android` |
| Sincronizar plugins | `npx cap sync android` |

## 11. Qué no hacer

- No usar `alert()`, `any` sin justificar, `console.log` con datos personales, ni `setTimeout` para "arreglar" tiempos de carga.
- No instalar librerías de UI externas (Material, Bootstrap, Tailwind) sin un ADR.
- No guardar la cédula ni el correo de otros usuarios en `localStorage`.
- No copiar el diseño, logos ni colores oficiales del CNE.
