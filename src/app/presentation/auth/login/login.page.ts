import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton, IonContent, IonInput, IonInputPasswordToggle, IonSpinner,
} from '@ionic/angular';
import { SesionService } from '../../../core/application/sesion.service';
import { cedulaValidator } from '../../shared/validators/cedula.validator';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    ReactiveFormsModule, RouterLink,
    IonContent, IonInput, IonInputPasswordToggle, IonButton, IonSpinner,
  ],
})
export class LoginPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    cedula: ['', [Validators.required, cedulaValidator]],
    clave: ['', Validators.required],
  });

  mensajeCedula(): string {
    const control = this.form.controls.cedula;
    if (control.hasError('required')) {
      return 'Ingresa tu cédula.';
    }
    return control.getError('cedula') ?? '';
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
    } finally {
      this.cargando.set(false);
    }
  }
}