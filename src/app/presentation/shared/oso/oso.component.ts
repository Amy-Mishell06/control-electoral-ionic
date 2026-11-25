import { Component, computed, input } from '@angular/core';

export type NombreOso =
  | 'colgando' | 'contando' | 'equipo' | 'mariposa' | 'registrando' | 'sello' | 'sello-serio' | 'votando';

/** 'ninguna' deja al oso quieto; cualquier otro valor lo deja "vivo" haciendo su acción. */
export type AnimacionOso = 'vivo' | 'ninguna' | 'flotar' | 'contar' | 'saludar';

type Accion = 'escribir' | 'votar' | 'sellar' | 'cola' | 'saludo-manos' | 'aletear';

interface Parte {
  archivo: string;
  /** Posición y ancho en % de la ilustración completa */
  x: number;
  y: number;
  w: number;
  /** Punto de giro dentro de la parte (muñeca, hombro, base de la cola…) */
  origen: string;
  accion: Accion;
}

/**
 * Cada ilustración se separó en capas: el cuerpo y las partes que se mueven.
 * Así cada oso hace SU acción (escribir, votar, sellar…) en vez de moverse entero.
 */
const PARTES: Partial<Record<NombreOso, Parte[]>> = {
  contando: [
    { archivo: 'oso-contando-lapiz', x: 41.67, y: 44.03, w: 21.39, origen: '72.7% 77.6%', accion: 'escribir' },
  ],
  registrando: [
    { archivo: 'oso-registrando-pluma', x: 28.89, y: 36.4, w: 24.17, origen: '87.4% 91.7%', accion: 'escribir' },
  ],
  votando: [
    { archivo: 'oso-votando-brazo', x: 54.44, y: 48.98, w: 27.78, origen: '4.0% 35.9%', accion: 'votar' },
  ],
  sello: [
    { archivo: 'oso-sello-sello', x: 75.0, y: 29.14, w: 21.94, origen: '-5.1% 122.4%', accion: 'sellar' },
  ],
  equipo: [
    { archivo: 'oso-equipo-cola', x: 83.0, y: 45.85, w: 17.0, origen: '20.6% 99.2%', accion: 'cola' },
    { archivo: 'oso-equipo-manos', x: 51.5, y: 53.01, w: 12.25, origen: '46.9% 47.5%', accion: 'saludo-manos' },
  ],
  mariposa: [
    { archivo: 'oso-mariposa-mariposa', x: 84.33, y: 31.24, w: 15.67, origen: '19.1% 50.0%', accion: 'aletear' },
  ],
};

/**
 * Mascota de Yupana (oso de anteojos). Ilustraciones propias en src/assets/osos.
 * Uso: <app-oso nombre="registrando" [tamano]="120" />
 * Las animaciones se apagan si el sistema pide reducir movimiento (ADR-013).
 */
@Component({
  selector: 'app-oso',
  template: `
    <div class="oso" [class.vivo]="vivo()" [style.width.px]="tamano()" aria-hidden="true">
      <img class="cuerpo" [src]="'assets/osos/oso-' + nombre() + '.webp'" alt="" />
      @for (p of partes(); track p.archivo) {
        <img
          [class]="'parte ' + p.accion"
          [src]="'assets/osos/' + p.archivo + '.webp'"
          [style.left.%]="p.x"
          [style.top.%]="p.y"
          [style.width.%]="p.w"
          [style.transform-origin]="p.origen"
          alt=""
        />
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .oso { position: relative; margin: 0 auto; filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.18)); }
    .cuerpo { display: block; width: 100%; height: auto; transform-origin: 50% 100%; }
    .parte { position: absolute; height: auto; pointer-events: none; }

    /* Respiración: el cuerpo casi no se mueve */
    .vivo .cuerpo { animation: respirar 4s ease-in-out infinite; }

    /* Escribe con la pluma o el lápiz: trazos cortos y una pausa */
    .vivo .escribir { animation: escribir 2.6s ease-in-out infinite; }
    /* Mete el voto en la urna */
    .vivo .votar { animation: votar 3.4s ease-in-out infinite; }
    /* Levanta el sello y lo estampa */
    .vivo .sellar { animation: sellar 3s ease-in-out infinite; }
    /* La ardilla mueve la cola */
    .vivo .cola { animation: cola 2.2s ease-in-out infinite; }
    /* Apretón de manos */
    .vivo .saludo-manos { animation: apreton 3s ease-in-out infinite; }
    /* La mariposa revolotea: aleteo rápido + vuelo lento (propiedades separadas) */
    .vivo .aletear { animation: aleteo 0.28s ease-in-out infinite alternate, revolotear 6s ease-in-out infinite; }

    @keyframes respirar {
      0%, 100% { transform: scale(1, 1); }
      50% { transform: scale(1.006, 1.014); }
    }
    @keyframes escribir {
      0%, 70%, 100% { transform: translate(0, 0) rotate(0); }
      10% { transform: translate(1px, 0) rotate(-4deg); }
      20% { transform: translate(2px, 1px) rotate(2deg); }
      30% { transform: translate(3px, 0) rotate(-4deg); }
      40% { transform: translate(4px, 1px) rotate(2deg); }
      50% { transform: translate(5px, 0) rotate(-3deg); }
      60% { transform: translate(2px, 0) rotate(0); }
    }
    @keyframes votar {
      0%, 35%, 100% { transform: rotate(0); }
      55%, 65% { transform: rotate(7deg); }
      80% { transform: rotate(-1deg); }
    }
    @keyframes sellar {
      0%, 45%, 100% { transform: rotate(0) scale(1); }
      60% { transform: rotate(-9deg) scale(1); }
      70% { transform: rotate(5deg) scale(1.04, 0.94); }
      76% { transform: rotate(5deg) scale(1.04, 0.94); }
      88% { transform: rotate(0) scale(1); }
    }
    @keyframes cola {
      0%, 100% { transform: rotate(-5deg); }
      50% { transform: rotate(6deg); }
    }
    @keyframes apreton {
      0%, 55%, 100% { transform: translateY(0); }
      62% { transform: translateY(-3px); }
      69% { transform: translateY(2px); }
      76% { transform: translateY(-2px); }
      83% { transform: translateY(1px); }
    }
    @keyframes aleteo {
      from { scale: 1 1; }
      to { scale: 0.3 1; }
    }
    @keyframes revolotear {
      0%, 100% { translate: 0 0; }
      25% { translate: -8px -10px; }
      50% { translate: -3px -4px; }
      75% { translate: -10px 2px; }
    }

    @media (prefers-reduced-motion: reduce) {
      .cuerpo, .parte { animation: none !important; }
    }
  `],
})
export class OsoComponent {
  readonly nombre = input.required<NombreOso>();
  readonly tamano = input(120);
  readonly animacion = input<AnimacionOso>('vivo');

  readonly vivo = computed(() => this.animacion() !== 'ninguna');
  readonly partes = computed(() => PARTES[this.nombre()] ?? []);
}