import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonInputPasswordToggle,
  IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';
import { RecuperarClaveUseCase } from '../../../core/application/recuperar-clave.use-case';
import { AvisosService } from '../../shared/avisos.service';
import { OsoComponent } from '../../shared/oso/oso.component';
import { enmascararCorreo } from '../../shared/utils/enmascarar-correo';

type Paso = 'correo' | 'codigo' | 'clave';
const ESPERA_REENVIO = 60;

@Component({
  selector: 'app-recuperar',
  imports: [
    ReactiveFormsModule, OsoComponent,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonButton, IonInput,
    IonInputPasswordToggle, IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar class="huellas">
        <ion-buttons slot="start"><ion-back-button defaultHref="/login"></ion-back-button></ion-buttons>
        <ion-title>Recuperar contraseña</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="contenedor angosto">
        @switch (paso()) {
          @case ('correo') {
            <app-oso nombre="mariposa" [tamano]="120" class="oso-paso" />
            <p>Escribe el correo con el que te registraron. Te enviaremos un código de 6 dígitos.</p>
            <ion-input type="email" inputmode="email" fill="outline" labelPlacement="stacked"
              label="Correo" [formControl]="correo" autocomplete="email"></ion-input>
            <ion-button expand="block" (click)="enviar()" [disabled]="cargando()">
              @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { Enviar código }
            </ion-button>
          }

          @case ('codigo') {
            <app-oso nombre="registrando" [tamano]="130" class="oso-paso" />
            <p>Si <strong>{{ correoOculto() }}</strong> está registrado, te llegó un código.
              Revisa también la carpeta de spam.</p>
            <ion-input type="text" inputmode="numeric" maxlength="6" fill="outline" labelPlacement="stacked"
              label="Código de 6 dígitos" [formControl]="codigo" autocomplete="one-time-code"></ion-input>
            <ion-button expand="block" (click)="verificar()" [disabled]="cargando()">
              @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { Verificar }
            </ion-button>
            <ion-button fill="clear" expand="block" (click)="enviar()" [disabled]="cargando() || segundos() > 0">
              {{ segundos() > 0 ? 'Reenviar en ' + segundos() + ' s' : 'Reenviar código' }}
            </ion-button>
          }

          @case ('clave') {
            <app-oso nombre="sello" [tamano]="120" animacion="saludar" class="oso-paso" />
            <p>Escribe tu nueva contraseña.</p>
            <ion-input type="password" fill="outline" labelPlacement="stacked" label="Nueva contraseña"
              [formControl]="clave" autocomplete="new-password">
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
            <ion-input type="password" fill="outline" labelPlacement="stacked" label="Repite la contraseña"
              [formControl]="confirmacion" autocomplete="new-password">
              <ion-input-password-toggle slot="end"></ion-input-password-toggle>
            </ion-input>
            <ion-button expand="block" (click)="guardar()" [disabled]="cargando()">
              @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { Guardar contraseña }
            </ion-button>
          }
        }

        @if (error()) {
          <p class="mensaje-error" role="alert">{{ error() }}</p>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .angosto { max-width: 480px; margin: 0 auto; }
    .oso-paso { margin: 12px auto 4px; }
    p { text-align: center; }
    ion-input { margin-bottom: 14px; }
  `],
})
export class RecuperarPage implements OnDestroy {
  private readonly recuperar = inject(RecuperarClaveUseCase);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);

  readonly paso = signal<Paso>('correo');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly segundos = signal(0);
  readonly correoOculto = signal('');
  private temporizador: ReturnType<typeof setInterval> | null = null;

  readonly correo = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] });
  readonly codigo = new FormControl('', { nonNullable: true });
  readonly clave = new FormControl('', { nonNullable: true });
  readonly confirmacion = new FormControl('', { nonNullable: true });

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
      await this.avisos.exito('Contraseña actualizada. Ingresa con tu cédula y la nueva contraseña.');
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    });
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