import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import {
  AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonInput, IonInputPasswordToggle,
  IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';
import { SesionService } from '../../../core/application/sesion.service';
import { validarClaveNueva } from '../../../core/domain/rules/clave.rule';
import { OsoComponent } from '../../shared/oso/oso.component';
import { enmascararCorreo } from '../../shared/utils/enmascarar-correo';

type Paso = 'enviar' | 'codigo' | 'clave';

function claveNuevaValidator(control: AbstractControl): ValidationErrors | null {
  const motivo = validarClaveNueva(control.value ?? '');
  return motivo ? { claveNueva: motivo } : null;
}

function clavesIgualesValidator(grupo: AbstractControl): ValidationErrors | null {
  const clave = grupo.get('clave')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return clave && confirmar && clave !== confirmar ? { distintas: true } : null;
}

@Component({
  selector: 'app-activar-cuenta',
  templateUrl: './activar-cuenta.page.html',
  styleUrls: ['./activar-cuenta.page.scss'],
  imports: [
    ReactiveFormsModule, OsoComponent,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
    IonInput, IonInputPasswordToggle, IonSpinner,
  ],
})
export class ActivarCuentaPage implements OnDestroy {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private temporizador?: ReturnType<typeof setInterval>;

  readonly paso = signal<Paso>('enviar');
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly segundos = signal(0);
  readonly correo = computed(() => enmascararCorreo(this.sesion.perfil()?.correo ?? ''));
  readonly nombre = computed(() => this.sesion.perfil()?.nombres ?? '');

  readonly formCodigo = this.fb.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  readonly formClave = this.fb.group(
    {
      clave: ['', [Validators.required, claveNuevaValidator]],
      confirmar: ['', Validators.required],
    },
    { validators: clavesIgualesValidator },
  );

  mensajeClave(): string {
    const control = this.formClave.controls.clave;
    return control.hasError('required') ? 'Escribe tu nueva contraseña.' : control.getError('claveNueva') ?? '';
  }

  async enviarCodigo(): Promise<void> {
    await this.ejecutar(async () => {
      await this.sesion.enviarCodigoActivacion();
      this.paso.set('codigo');
      this.iniciarEspera();
    });
  }

  async verificarCodigo(): Promise<void> {
    if (this.formCodigo.invalid) {
      this.formCodigo.markAllAsTouched();
      return;
    }
    await this.ejecutar(async () => {
      await this.sesion.verificarCodigoActivacion(this.formCodigo.getRawValue().codigo);
      this.paso.set('clave');
    });
  }

  async guardarClave(): Promise<void> {
    if (this.formClave.invalid) {
      this.formClave.markAllAsTouched();
      return;
    }
    await this.ejecutar(async () => {
      await this.sesion.completarActivacion(this.formClave.getRawValue().clave);
      await this.router.navigateByUrl(this.sesion.rutaInicio(), { replaceUrl: true });
    });
  }

  async salir(): Promise<void> {
    await this.sesion.cerrarSesion();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  ngOnDestroy(): void {
    clearInterval(this.temporizador);
  }

  /** Muestra la carga y el error de cada paso (ADR-008). */
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

  /** "Reenviar código" se habilita tras 60 segundos (ADR-011). */
  private iniciarEspera(): void {
    clearInterval(this.temporizador);
    this.segundos.set(60);
    this.temporizador = setInterval(() => {
      this.segundos.update((s) => s - 1);
      if (this.segundos() <= 0) {
        clearInterval(this.temporizador);
      }
    }, 1000);
  }
}