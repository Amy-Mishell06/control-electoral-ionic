---
name: diseno-ui-electoral
description: Diseña pantallas, estilos, íconos y animaciones Lottie de la app electoral Ionic con la identidad visual del repositorio. Úsala antes de crear o cambiar cualquier UI.
---

# Diseño UI/UX — App de control electoral

Esta skill hace que cada pantalla se vea como parte de **una sola identidad visual** (la de este repositorio) y que cualquier usuario la entienda sin explicación. Cada integrante del grupo tiene una identidad distinta; la arquitectura y los ADR son los mismos.

## Paso 0: cargar la identidad

1. Abre `docs/design/identidad.md`.
2. Si no existe, **no diseñes todavía**: ayuda a la persona a crearla con la plantilla `references/identidad-plantilla.md` (haz las preguntas de la plantilla; no la inventes tú solo).
3. Comprueba que `src/theme/variables.scss` tenga los tokens de la identidad. Si no, créalos primero.

Todo color, fuente, radio, sombra y mascota sale de esos tokens. Si un componente necesita un color que no existe, se agrega como token, nunca como valor suelto.

## Paso 1: pensar en el usuario de esa pantalla

| Usuario | Situación real | Implicación de diseño |
|---|---|---|
| Veedor | De pie en el recinto, con prisa, luz fuerte, internet malo, a veces poca experiencia con apps | Botones grandes, una acción principal por pantalla, flujo por pasos, mensajes cortos, contraste alto, nunca perder lo que escribió |
| Coordinador de recinto | Supervisa varias mesas, reasigna personas y corrige | Lista con estado visible de cada mesa, filtros simples, acciones con confirmación |
| Coordinador provincial | Mira el panorama en el celular | Dashboard con 3 o 4 cifras clave arriba, luego el detalle; nada de tablas anchas |

Antes de diseñar, escribe en una línea: **quién usa la pantalla, qué tiene que lograr y cuál es la acción principal**.

## Paso 2: reglas de UX (todas las pantallas)

1. **Una acción principal** por pantalla, con el color primario, abajo y al alcance del pulgar (`ion-footer` con el botón). Las acciones secundarias van como botones `fill="outline"` o `fill="clear"`.
2. **Áreas táctiles de al menos 48 × 48 px.** Espacio entre elementos tocables.
3. **Texto base de 16 px como mínimo**; las cifras del acta de 20 a 24 px.
4. **Contraste mínimo 4.5:1** para texto (la app se usa al sol). Comprueba cada combinación de la identidad.
5. **Estado siempre con tres señales**: ícono + texto + color. Nunca solo color.
6. **Lenguaje del usuario**: "Mesa 12", "Acta de alcalde", "Falta la foto". Nunca "JRV_ID", "null", "error 42501".
7. **Los cinco estados** (`idle`, `loading`, `success`, `empty`, `error`) diseñados en cada pantalla (ADR-005 y ADR-008).
8. **Nada se pierde**: si falla el guardado, los datos siguen en el formulario.
9. **Confirmar lo irreversible** con `ion-alert` (reasignar veedor, enviar acta, corregir acta).
10. Teclado correcto: `inputmode="numeric"` para cédula, votos y teléfono; `type="email"` para correos.

## Paso 3: patrones por pantalla

**Login.** Mascota Lottie arriba (ver `references/lottie.md`), título corto con el nombre de la app, campo cédula, campo contraseña con botón para mostrarla, botón "Ingresar" y enlace "¿Olvidaste tu contraseña?". Nada más.

**Activar cuenta (primer acceso).** Paso 1: "Te enviamos un código a a\*\*\*@gmail.com", campo de 6 dígitos grande y "Reenviar código (60 s)". Paso 2: nueva contraseña con requisitos que se marcan en verde a medida que se cumplen.

**Mis mesas (veedor).** Tarjetas grandes, una por mesa: "Mesa 12", recinto, y dos chips de estado (Alcalde y Prefecto: Pendiente, Registrada, Corregida o En conflicto). Al tocar una tarjeta se abre el registro de esa mesa.

**Registrar acta (veedor).** Flujo en 4 pasos con indicador arriba ("Paso 2 de 4"):

1. **Votos**: lista de las 5 organizaciones (siglas + nombre), nulos, blancos y total de sufragantes. Una **barra fija abajo** muestra la suma en vivo: "Suma 248 de 250 · faltan 2" en ámbar, y "✓ Los totales cuadran" en verde.
2. **Foto**: botón grande "Tomar foto del acta", vista previa y resultado de nitidez ("Foto nítida" o "Foto borrosa, tómala de nuevo").
3. **Ubicación**: botón "Obtener ubicación", coordenadas, precisión ("± 12 m") y aviso si está lejos del recinto.
4. **Revisar y enviar**: resumen de todo, en solo lectura, con "Editar" en cada bloque y el botón "Enviar acta".

**Mesas del recinto (coordinador).** Resumen arriba ("8 de 12 mesas completas"), filtro por estado con `ion-segment`, lista con el veedor asignado y la acción "Reasignar".

**Dashboard (provincial).** Arriba 3 o 4 tarjetas de cifras (actas recibidas, % de avance, mesas con conflicto). Debajo, barras horizontales por candidato (más legibles en el celular que un pastel) con selector "Consolidado / por recinto". Un mapa o lista de recintos con su avance y GPS.

## Paso 4: íconos y animaciones

- **Íconos estáticos**: Ionicons (`ion-icon`), siempre del mismo estilo (`-outline` o rellenos, no mezclados).
- **Lottie**: solo en momentos que comunican un estado. Lee `references/lottie.md` para el componente `<app-lottie>`, el mapa de dónde usarlo y dónde no.
- Microinteracciones (cambio de color de la suma, sacudida de error, entradas de lista) con CSS o `createAnimation` de Ionic (ADR-013), de 150 a 300 ms.
- Siempre respetar `prefers-reduced-motion`.

## Paso 5: revisar antes de entregar

- [ ] Solo usa tokens de `variables.scss`; ningún color o fuente suelta.
- [ ] Una acción principal clara; botones de al menos 48 px.
- [ ] Los cinco estados están diseñados y se pueden provocar para probarlos.
- [ ] Contraste revisado; ningún estado se comunica solo con color.
- [ ] Funciona en modo oscuro si la identidad lo define, y en un celular de 360 px de ancho.
- [ ] Las animaciones Lottie pesan menos de 100 KB, tienen `aria-label` y respetan reducir movimiento.
- [ ] Textos en español, cortos y en lenguaje del usuario.
- [ ] Explica a la persona qué decidiste y por qué (modo tutor de `AGENTS.md`).
