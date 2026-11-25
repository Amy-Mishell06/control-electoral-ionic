import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton, IonContent, IonIcon, IonInput, IonInputPasswordToggle, IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBack, checkmarkCircle, keyOutline, mailOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { RecuperarClaveUseCase } from '../../../core/application/recuperar-clave.use-case';
import { NombreOso, OsoComponent } from '../../shared/oso/oso.component';
import { enmascararCorreo } from '../../shared/utils/enmascarar-correo';

type Paso = 'correo' | 'codigo' | 'clave' | 'listo';
const ESPERA_REENVIO = 60;

interface InfoPaso {
  oso: NombreOso;
  titulo: string;
  frase: string;
}

const PASOS: Record<Paso, InfoPaso> = {
  correo: { oso: 'mariposa', titulo: '¿Olvidaste tu clave?', frase: 'Tranquilo, te ayudamos a recuperarla' },
  codigo: { oso: 'registrando', titulo: 'Revisa tu correo', frase: 'Te enviamos un código de 6 dígitos' },
  clave: { oso: 'sello', titulo: 'Nueva contraseña', frase: 'Elige una que recuerdes fácil' },
  listo: { oso: 'sello', titulo: '¡Listo!', frase: 'Tu contraseña fue actualizada' },
};

@Component({
  selector: 'app-recuperar',
  imports: [
    ReactiveFormsModule, RouterLink, OsoComponent,
    IonContent, IonButton, IonIcon, IonInput, IonInputPasswordToggle, IonSpinner,
  ],
  template: `
    <ion-content [fullscreen]="true">
      <div class="pantalla">
        <header class="fondo-huellas encabezado">
          <ion-button class="volver" fill="clear" routerLink="/login" aria-label="Volver al inicio de sesión">
            <ion-icon slot="icon-only" name="arrow-back"></ion-icon>
          </ion-button>
          <h1>{{ info().titulo }}</h1>
          <p>{{ info().frase }}</p>
        </header>

        <section class="tarjeta">
          <!-- El osito cambia en cada paso y se apoya sobre la tarjeta -->
          <div class="oso-paso">
            @switch (paso()) {
              @case ('correo') { <app-oso nombre="mariposa" [tamano]="110" /> }
              @case ('codigo') { <app-oso nombre="registrando" [tamano]="130" /> }
              @default { <app-oso nombre="sello" [tamano]="120" /> }
            }
          </div>

          @if (paso() !== 'listo') {
            <ol class="progreso" aria-label="Progreso">
              @for (p of pasosVisibles; track p.id; let i = $index) {
                <li [class.hecho]="i < indice()" [class.actual]="i === indice()">
                  <span class="punto">
                    @if (i < indice()) { <ion-icon name="checkmark-circle"></ion-icon> } @else { {{ i + 1 }} }
                  </span>
                  <span class="etiqueta">{{ p.texto }}</span>
                </li>
              }
            </ol>
          }

          @switch (paso()) {
            @case ('correo') {
              <p class="ayuda">Escribe el correo con el que te registraron.</p>
              <ion-input type="email" inputmode="email" fill="outline" labelPlacement="stacked"
                label="Correo electrónico" [formControl]="correo" autocomplete="email">
                <ion-icon slot="start" name="mail-outline" aria-hidden="true"></ion-icon>
              </ion-input>
              <ion-button class="principal" expand="block" (click)="enviar()" [disabled]="cargando()">
                @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { Enviar código }
              </ion-button>
            }

            @case ('codigo') {
              <p class="ayuda">
                Si <strong>{{ correoOculto() }}</strong> está registrado, te llegó un código.
                Revisa también la carpeta de spam.
              </p>
              <ion-input class="codigo" type="text" inputmode="numeric" maxlength="6" fill="outline"
                labelPlacement="stacked" label="Código" placeholder="••••••"
                [formControl]="codigo" autocomplete="one-time-code">
                <ion-icon slot="start" name="shield-checkmark-outline" aria-hidden="true"></ion-icon>
              </ion-input>
              <ion-button class="principal" expand="block" (click)="verificar()" [disabled]="cargando()">
                @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { Verificar código }
              </ion-button>
              <ion-button fill="clear" expand="block" (click)="enviar()" [disabled]="cargando() || segundos() > 0">
                {{ segundos() > 0 ? 'Reenviar en ' + segundos() + ' s' : 'Reenviar código' }}
              </ion-button>
            }

            @case ('clave') {
              <p class="ayuda">Mínimo 8 caracteres, con letras y números.</p>
              <ion-input type="password" fill="outline" labelPlacement="stacked" label="Nueva contraseña"
                [formControl]="clave" autocomplete="new-password">
                <ion-icon slot="start" name="key-outline" aria-hidden="true"></ion-icon>
                <ion-input-password-toggle slot="end"></ion-input-password-toggle>
              </ion-input>
              <ion-input type="password" fill="outline" labelPlacement="stacked" label="Repite la contraseña"
                [formControl]="confirmacion" autocomplete="new-password">
                <ion-icon slot="start" name="key-outline" aria-hidden="true"></ion-icon>
                <ion-input-password-toggle slot="end"></ion-input-password-toggle>
              </ion-input>
              <ion-button class="principal" expand="block" (click)="guardar()" [disabled]="cargando()">
                @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { Guardar contraseña }
              </ion-button>
            }

            @case ('listo') {
              <p class="ayuda exito">
                <ion-icon name="checkmark-circle"></ion-icon>
                Ya puedes ingresar con tu cédula y tu nueva contraseña.
              </p>
              <ion-button class="principal" expand="block" (click)="irAlLogin()">Ir a iniciar sesión</ion-button>
            }
          }

          @if (error()) {
            <p class="error-general" role="alert">{{ error() }}</p>
          }
        </section>
      </div>
    </ion-content>
  `,
  styles: [`
    .pantalla { max-width: 480px; min-height: 100%; margin: 0 auto; display: flex; flex-direction: column; }

    .encabezado {
      position: relative;
      background-color: #155e75;
      color: #ffffff;
      text-align: center;
      padding: 52px 24px 250px;
      border-radius: 0 0 32px 32px;
    }
    .encabezado h1 { margin: 0; font-family: var(--app-font-titulos); font-size: 2rem; font-weight: 800; }
    .encabezado p { margin: 6px 0 0; font-size: 1rem; opacity: 0.9; }
    .volver { position: absolute; top: 8px; left: 4px; --color: #ffffff; }

    .tarjeta {
      position: relative;
      margin: -70px 16px 24px;
      padding: 30px 22px 22px;
      border-radius: 24px;
      background: var(--app-superficie, #ffffff);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18);
    }

    /* Osito apoyado sobre el borde superior de la tarjeta */
    .oso-paso {
      position: absolute;
      left: 50%;
      top: 0;
      translate: -50% calc(-100% + 22px);
      z-index: 2;
      animation: aparecer 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes aparecer {
      from { opacity: 0; transform: translateY(14px) scale(0.92); }
      to { opacity: 1; transform: none; }
    }

    /* Barra de pasos */
    .progreso {
      list-style: none;
      display: flex;
      justify-content: space-between;
      gap: 8px;
      margin: 8px 0 20px;
      padding: 0;
      position: relative;
    }
    .progreso::before {
      content: '';
      position: absolute;
      top: 15px;
      left: 16%;
      right: 16%;
      height: 3px;
      border-radius: 3px;
      background: rgba(127, 127, 127, 0.25);
    }
    .progreso li { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 1; }
    .punto {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-weight: 700;
      background: var(--app-superficie, #ffffff);
      border: 2px solid rgba(127, 127, 127, 0.4);
      color: var(--app-texto-secundario);
      transition: all 0.25s ease;
    }
    .punto ion-icon { font-size: 22px; }
    .etiqueta { font-size: 0.8rem; color: var(--app-texto-secundario); }
    .actual .punto { border-color: var(--ion-color-primary); color: var(--ion-color-primary); transform: scale(1.08); }
    .actual .etiqueta { color: var(--ion-color-primary); font-weight: 700; }
    .hecho .punto { border-color: var(--ion-color-success); color: var(--ion-color-success); }

    .ayuda { margin: 0 0 16px; text-align: center; color: var(--app-texto-secundario); line-height: 1.45; }
    .ayuda strong { color: var(--ion-text-color); }
    .exito { display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--ion-color-success); font-weight: 600; }
    .exito ion-icon { font-size: 22px; flex-shrink: 0; }

    ion-input { margin-bottom: 16px; }
    ion-input ion-icon[slot='start'] { margin-right: 8px; color: var(--ion-color-primary); }
    .codigo { font-size: 1.5rem; letter-spacing: 10px; font-weight: 700; }

    .principal { margin-top: 4px; --border-radius: 16px; min-height: 52px; font-weight: 700; }

    .error-general {
      margin: 12px 0 0;
      padding: 12px 16px;
      border-radius: 12px;
      background: rgba(235, 68, 90, 0.12);
      color: var(--ion-color-danger);
      font-weight: 600;
      text-align: center;
    }

    @media (prefers-reduced-motion: reduce) {
      .oso-paso { animation: none; }
    }
  `],
})
export class RecuperarPage implements OnDestroy {
  private readonly recuperar = inject(RecuperarClaveUseCase);
  private readonly router = inject(Router);

  readonly paso = signal<Paso>('correo');
  readonly info = computed(() => PASOS[this.paso()]);
  readonly pasosVisibles = [
    { id: 'correo', texto: 'Correo' },
    { id: 'codigo', texto: 'Código' },
    { id: 'clave', texto: 'Clave' },
  ];
  readonly indice = computed(() => ['correo', 'codigo', 'clave', 'listo'].indexOf(this.paso()));

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly segundos = signal(0);
  readonly correoOculto = signal('');
  private temporizador: ReturnType<typeof setInterval> | null = null;

  readonly correo = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly codigo = new FormControl('', { nonNullable: true });
  readonly clave = new FormControl('', { nonNullable: true });
  readonly confirmacion = new FormControl('', { nonNullable: true });

  constructor() {
    addIcons({ arrowBack, checkmarkCircle, keyOutline, mailOutline, shieldCheckmarkOutline });
  }

  async enviar(): Promise<void> {
    await this.ejecutar(async () => {
      await this.recuperar.enviarCodigo(this.correo.value);
      this.correoOculto.set(enmascararCorreo(this.correo.value.trim().toLowerCase()));
      this.paso.set('codigo');
      this.iniciarEspera();
    });
  }

  async verificar(): Promise<void> {
    await this.ejecutar(async () => {
      await this.recuperar.verificarCodigo(this.correo.value, this.codigo.value);
      this.paso.set('clave');
    });
  }

  async guardar(): Promise<void> {
    await this.ejecutar(async () => {
      await this.recuperar.cambiarClave(this.clave.value, this.confirmacion.value);
      this.detenerEspera();
      this.paso.set('listo');
    });
  }

  async irAlLogin(): Promise<void> {
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  /** Evita pedir muchos códigos seguidos (Supabase limita los envíos). */
  private iniciarEspera(): void {
    this.detenerEspera();
    this.segundos.set(ESPERA_REENVIO);
    this.temporizador = setInterval(() => {
      this.segundos.update((s) => s - 1);
      if (this.segundos() <= 0) {
        this.detenerEspera();
      }
    }, 1000);
  }

  private detenerEspera(): void {
    if (this.temporizador) {
      clearInterval(this.temporizador);
      this.temporizador = null;
    }
  }

  private async ejecutar(accion: () => Promise<void>): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      await accion();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Ocurrió un error. Inténtalo de nuevo.');
    } finally {
      this.cargando.set(false);
    }
  }

  ngOnDestroy(): void {
    this.detenerEspera();
  }
}