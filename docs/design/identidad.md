# Identidad visual · Yupana

**Yupana** era el tablero que usaban los incas para contar. La app cuenta los votos de cada mesa, y su mascota es un **oso de anteojos**, el oso andino que "revisa con atención" cada acta.

> Repositorio individual de Amy Mishell Díaz Rosero. La arquitectura sigue los ADR del Grupo 4; esta identidad es solo de esta app.

## Ficha

| Elemento | Valor |
|---|---|
| Nombre de la app | Yupana |
| Significado | Tablero inca para contar (kichwa) |
| Personalidad (2 palabras) | Moderna y confiable |
| Mascota | Oso de anteojos |
| Color primario | `#155E75` (azul petróleo) |
| Color secundario | `#7C4A2D` (café, el color del oso) |
| Fondo / superficie | `#F7F4F0` / `#FFFFFF` |
| Texto / texto secundario | `#1F2937` / `#5B6472` |
| Éxito / advertencia / error | `#15803D` / `#B45309` / `#B91C1C` |
| Tipografía títulos | Outfit (700–800) |
| Tipografía texto | Outfit (400–600) |
| Radio de esquinas | 16 px |
| Estilo de íconos | Ionicons filled |
| Modo oscuro | Sí (sigue la configuración del celular) |
| Archivos Lottie y licencia | No se usan archivos Lottie: las animaciones son CSS sobre ilustraciones propias separadas en capas (`src/assets/osos/`), generadas con Gemini por la autora. |

## Modo oscuro

| Elemento | Valor |
|---|---|
| Primario | `#5FB8CC` (texto encima: `#0B1F24`) |
| Secundario | `#D19A72` |
| Fondo / superficie | `#0E1A1D` / `#16262A` |
| Texto / texto secundario | `#E6EEF0` / `#A3B3B8` |
| Éxito / advertencia / error | `#4ADE80` / `#FBBF24` / `#F87171` |

En modo oscuro los colores son más claros para que se lean sobre el fondo oscuro.

## Reglas de uso

- **Primario (azul petróleo):** botón de la acción principal, barra superior, enlaces y elementos seleccionados.
- **Secundario (café):** detalles y acentos (subtítulos, íconos decorativos, la mascota). Nunca en botones grandes, para no confundirlo con los colores de estado.
- **Verde, ámbar y rojo:** solo para estados ("los totales cuadran", "falta algo", "error"), siempre con ícono y texto, nunca solo color.
- No usar el logo, el escudo ni los colores oficiales del CNE.

## Contraste comprobado (mínimo 4.5:1)

| Combinación | Claro | Oscuro |
|---|---|---|
| Texto sobre fondo | 13.4 | 15.1 |
| Texto secundario sobre fondo | 5.5 | 8.2 |
| Texto del botón sobre primario | 7.3 | 7.5 |
| Primario sobre fondo | 6.6 | 7.8 |
| Éxito / advertencia / error sobre superficie | 5.0 / 5.0 / 6.5 | 9.0 / 9.4 / 5.7 |

## Patrón de huellas de oso

Huellas de oso (cuatro deditos con garritas y almohadilla grande), de tamaño mediano y en blanco al 10 % sobre el azul petróleo. Son 11 huellas repartidas al azar, con giros y tamaños distintos, en un mosaico de 520 × 520 px que se repite sin que se note el corte. Archivo: `src/assets/patrones/huellas-oso.svg`.

- **Sí:** pantalla de bienvenida, encabezado del inicio de sesión y barras superiores (`ion-toolbar`).
- **No:** botones, tarjetas, campos de formulario ni detrás de textos largos, para no restar legibilidad.
- La mascota va en café `#7C4A2D` sobre un círculo crema `#F5E9DC` cuando aparece sobre el patrón.
- En modo oscuro el patrón se mantiene igual: es blanco translúcido, así que funciona sobre el fondo oscuro de la barra.

## Tipografía local

Outfit se carga desde `src/assets/fonts/` (no desde internet), para que la app funcione sin conexión. Licencia: SIL Open Font License (Google Fonts).
