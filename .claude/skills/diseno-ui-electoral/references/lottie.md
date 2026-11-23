# Lottie en la app

## Librería

Una sola dependencia: `@lottiefiles/dotlottie-web` (ADR-013). Reproduce archivos `.lottie` (comprimidos, más livianos que `.json`) y también `.json`, sobre un `<canvas>`.

```bash
npm install @lottiefiles/dotlottie-web
```

Archivos en `src/assets/lottie/`, con nombres en español: `mascota-login.lottie`, `check-exito.lottie`, `gps-buscando.lottie`…

## Componente reutilizable `<app-lottie>`

Vive en `presentation/shared/components/lottie/`. Todas las pantallas lo usan; nadie crea `DotLottie` directamente.

```ts
import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, input, output } from '@angular/core';
import { DotLottie } from '@lottiefiles/dotlottie-web';

@Component({
  selector: 'app-lottie',
  standalone: true,
  template: `<canvas #lienzo role="img" [attr.aria-label]="etiqueta()"
               [style.width.px]="tamano()" [style.height.px]="tamano()"></canvas>`,
})
export class LottieComponent implements AfterViewInit, OnDestroy {
  @ViewChild('lienzo') lienzo!: ElementRef<HTMLCanvasElement>;

  src = input.required<string>();
  etiqueta = input.required<string>();   // texto para lectores de pantalla
  tamano = input(120);
  loop = input(false);
  autoplay = input(true);
  marcador = input<string | undefined>(undefined);

  termino = output<void>();

  private animacion?: DotLottie;
  private reducirMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;

  ngAfterViewInit(): void {
    this.animacion = new DotLottie({
      canvas: this.lienzo.nativeElement,
      src: this.src(),
      loop: this.loop() && !this.reducirMovimiento,
      autoplay: this.autoplay() && !this.reducirMovimiento,
      marker: this.marcador(),
    });
    this.animacion.addEventListener('complete', () => this.termino.emit());
    if (this.reducirMovimiento) {
      // Sin movimiento: mostrar un cuadro fijo en vez de animar.
      this.animacion.addEventListener('load', () => this.animacion?.setFrame(this.animacion.totalFrames - 1));
    }
  }

  /** Reproduce un estado con nombre (marcador definido en el archivo Lottie). */
  reproducir(marcador?: string): void {
    if (!this.animacion || this.reducirMovimiento) return;
    if (marcador) this.animacion.setMarker(marcador);
    this.animacion.play();
  }

  ngOnDestroy(): void {
    this.animacion?.destroy();
  }
}
```

Comprueba los nombres exactos de los métodos en la documentación de la versión instalada de `dotlottie-web`; si cambian, ajusta solo este componente.

## Mascota del login con estados

Una sola animación con **marcadores** (segmentos con nombre). Se crean en LottieFiles Creator o se piden así al buscar o encargar la animación.

| Marcador | Cuándo | Qué hace la mascota |
|---|---|---|
| `reposo` | Al abrir (en bucle suave) | Respira y parpadea |
| `mirando` | Foco en el campo cédula | Mira hacia el campo |
| `tapandose` | Foco en el campo contraseña | Se tapa los ojos |
| `espiando` | Al tocar "mostrar contraseña" | Abre un ojo entre los dedos |
| `feliz` | Login correcto | Salta o sonríe, luego se navega |
| `triste` | Credenciales incorrectas | Baja la cabeza o niega |

```html
<app-lottie #mascota src="assets/lottie/mascota-login.lottie"
            etiqueta="Mascota de la app" [tamano]="160" marcador="reposo" [loop]="true" />

<ion-input label="Cédula" inputmode="numeric" (ionFocus)="mascota.reproducir('mirando')" ... />
<ion-input label="Contraseña" type="password" (ionFocus)="mascota.reproducir('tapandose')" ... />
```

En el `.ts`, después del intento de login: `this.mascota.reproducir(ok ? 'feliz' : 'triste')`. La navegación espera a `(termino)` del estado `feliz`, con un máximo de 1 segundo.

Si la animación no tiene marcadores, usa segmentos por número de cuadro (`setSegment(inicio, fin)`) y documenta los números en `docs/design/identidad.md`.

## Mapa: dónde poner Lottie

| Lugar | Animación | Comportamiento |
|---|---|---|
| Login | Mascota con estados | La de arriba |
| Activar cuenta, esperando el código | Sobre o carta llegando | Una vez al enviar el código |
| Cuenta activada | Candado que se abre o check | Una vez, luego navega |
| Mis mesas vacía | Mascota esperando | Bucle suave + texto "Aún no tienes mesas asignadas" |
| Obtener ubicación | Pin que late | En bucle solo mientras busca |
| Comprobando nitidez | Lupa o escaneo sobre la foto | Mientras calcula (menos de 1 s) |
| Foto borrosa | Cámara con gesto de "otra vez" | Una vez |
| Totales que cuadran | Check pequeño junto a la suma | Una vez cada vez que pasa a cuadrar |
| Acta enviada | Check grande o urna recibiendo el sobre | Una vez, luego vuelve a Mis mesas |
| Sin conexión | Nube tachada | Una vez en el aviso |
| Sincronizando pendientes (ADR-014) | Flechas en círculo | En bucle mientras sincroniza |
| Íconos de la barra de pestañas | Ícono propio de cada pestaña | Se reproduce una vez al seleccionarla |

## Dónde NO poner Lottie

- En cada elemento de una lista o en botones que se repiten.
- Como fondo o decoración permanente.
- En reemplazo de `ion-skeleton-text` al cargar listas.
- En bucle infinito en pantallas de trabajo (distrae y gasta batería).
- En errores graves que el usuario debe leer: ahí manda el texto.

## Íconos animados

Para la barra de pestañas y los estados de la tabla, usa una familia de íconos Lottie **del mismo estilo y grosor de línea**. Colorea los íconos con los colores de la identidad (en LottieFiles Creator o con los temas del `.lottie`) para que cada integrante tenga los suyos. Los íconos de navegación y botones comunes siguen siendo Ionicons estáticos.

## Buscar y elegir animaciones

- En LottieFiles busca en inglés: `login character`, `owl blink`, `success check`, `location pin pulse`, `camera scan`, `no internet`, `sync`, `empty state`, `mail sent`, `unlock`.
- Prefiere animaciones planas, de pocos colores y menos de 100 KB.
- Revisa la licencia de cada una (las gratuitas de LottieFiles usan la Lottie Simple License) y anota autor y enlace en `docs/design/identidad.md` y en el README.
- Duración: 1 a 2 s para estados que se reproducen una vez.
