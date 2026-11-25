import { Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton, IonContent, IonIcon, IonInput, IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { eye, eyeOff } from 'ionicons/icons';
import { SesionService } from '../../../core/application/sesion.service';
import { cedulaValidator } from '../../shared/validators/cedula.validator';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    ReactiveFormsModule, RouterLink,
    IonContent, IonInput, IonIcon, IonButton, IonSpinner,
  ],
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  // Estado de la mascota (ADR-005, ADR-013)
  readonly claveEnfocada = signal(false);
  readonly verClave = signal(false);
  readonly sacudir = signal(false);
  /** El oso se tapa los ojos mientras escribes la contraseña oculta, y mira si la muestras. */
  readonly tapaOjos = computed(() => this.claveEnfocada() && !this.verClave());

  readonly form = this.fb.group({
    cedula: ['', [Validators.required, cedulaValidator]],
    clave: ['', Validators.required],
  });

  constructor() {
    addIcons({ eye, eyeOff });
  }

  mensajeCedula(): string {
    const control = this.form.controls.cedula;
    if (control.hasError('required')) {
      return 'Ingresa tu cédula.';
    }
    return control.getError('cedula') ?? '';
  }

  alternarClave(): void {
    this.verClave.update((v) => !v);
  }

  async ingresar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      const { cedula, clave } = this.form.getRawValue();
      const perfil = await this.sesion.iniciarSesion(cedula.trim(), clave);
      await this.router.navigateByUrl(this.sesion.rutaInicio(perfil), { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo iniciar sesión.');
      this.animarError();
    } finally {
      this.cargando.set(false);
    }
  }

  /** El oso niega con la cabeza cuando el ingreso falla. */
  private animarError(): void {
    this.sacudir.set(false);
    requestAnimationFrame(() => this.sacudir.set(true));
    setTimeout(() => this.sacudir.set(false), 700);
  }
}
