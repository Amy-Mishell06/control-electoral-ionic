# Plantilla de identidad visual

Copia este archivo a `docs/design/identidad.md` y complétalo **con la persona dueña del repositorio**. Hazle las preguntas; no decidas por ella. Cada integrante del grupo debe terminar con una identidad distinta.

## Preguntas para definirla

1. ¿Qué nombre tendrá tu app? (Ideas: Vigía, ActaClara, Escruta, MesaFiel, Custodia.)
2. ¿Qué sensación debe transmitir? Elige dos: confiable, cercana, rápida, seria, moderna, amable.
3. ¿Qué mascota acompaña al usuario? (Ideas: un búho vigilante, una hoja de acta con ojos, una urna con lentes, un colibrí.)
4. ¿Esquinas redondeadas (amable) o rectas (seria)?
5. ¿Modo oscuro sí o no?

## Reglas para todas las identidades

- No usar el logo, el escudo ni la combinación de colores oficial del CNE; la app no debe parecer del Estado.
- Verde reservado para "correcto / cuadra", ámbar para "falta algo / advertencia", rojo para "error". El color primario no puede ser ninguno de esos tres.
- Contraste de texto de 4.5:1 como mínimo.
- Máximo dos familias tipográficas, de Google Fonts, cargadas localmente (la app debe funcionar sin internet).

## Ficha (completar)

| Elemento | Valor |
|---|---|
| Nombre de la app | |
| Personalidad (2 palabras) | |
| Mascota | |
| Color primario | `#______` |
| Color secundario | `#______` |
| Fondo / superficie | `#______` / `#______` |
| Éxito / advertencia / error | `#______` / `#______` / `#______` |
| Tipografía títulos | |
| Tipografía texto | |
| Radio de esquinas | ___ px |
| Estilo de íconos | Ionicons outline / filled |
| Modo oscuro | sí / no |
| Archivos Lottie y licencia | |

## Ejemplos de dos identidades distintas

| | Identidad A · "Vigía" | Identidad B · "ActaClara" |
|---|---|---|
| Personalidad | Confiable y cercana | Moderna y rápida |
| Mascota | Búho que vigila | Hoja de acta con ojos |
| Primario | Azul profundo `#1E3A8A` | Índigo `#4338CA` |
| Secundario | Celeste `#38BDF8` | Turquesa `#0D9488` |
| Fondo | Blanco cálido `#FAFAF7` | Gris muy claro `#F4F6FB` |
| Tipografía | Nunito (títulos) + Inter (texto) | Poppins (títulos) + Roboto (texto) |
| Esquinas | 16 px, tarjetas suaves | 8 px, geometría limpia |
| Íconos | Ionicons outline | Ionicons filled |

## Tokens en `src/theme/variables.scss`

```scss
:root {
  /* Marca */
  --ion-color-primary: #1E3A8A;
  --ion-color-primary-rgb: 30, 58, 138;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #1a337a;
  --ion-color-primary-tint: #354e96;

  --ion-color-secondary: #38BDF8;

  /* Estados (iguales en todas las identidades) */
  --ion-color-success: #15803D;
  --ion-color-warning: #B45309;
  --ion-color-danger:  #B91C1C;

  /* Superficies */
  --ion-background-color: #FAFAF7;
  --ion-text-color: #1F2937;

  /* Propios de la app */
  --app-font-titulos: 'Nunito', sans-serif;
  --app-font-texto: 'Inter', sans-serif;
  --app-radio: 16px;
  --app-espacio: 16px;
  --app-boton-alto: 52px;
  --app-sombra-tarjeta: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

Genera las variantes `-shade` y `-tint` con el generador de colores de la documentación de Ionic, no a mano.
