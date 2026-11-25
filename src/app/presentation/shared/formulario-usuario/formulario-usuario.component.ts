import { Component, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonInput, IonSpinner } from '@ionic/angular';
import { DatosPersona } from '../../../core/domain/models/nuevo-usuario.model';
import { cedulaValidator } from '../validators/cedula.validator';

/** Formulario reutilizable para crear coordinadores y veedores (R2, ADR-006). */
@Component({
  selector: 'app-formulario-usuario',
  imports: [ReactiveFormsModule, IonInput, IonButton, IonSpinner],
  template: `
    <form class="formulario" [formGroup]="form" (ngSubmit)="enviar()" novalidate>
      <ion-input formControlName="cedula" label="Cédula" labelPlacement="stacked" fill="outline"
        inputmode="numeric" maxlength="10" [errorText]="mensajeCedula()"></ion-input>
      <ion-input formControlName="nombres" label="Nombres" labelPlacement="stacked" fill="outline"
        errorText="Escribe los nombres."></ion-input>
      <ion-input formControlName="apellidos" label="Apellidos" labelPlacement="stacked" fill="outline"
        errorText="Escribe los apellidos."></ion-input>
      <ion-input formControlName="telefono" label="Teléfono" labelPlacement="stacked" fill="outline"
        inputmode="tel" maxlength="10" errorText="El teléfono debe tener 10 dígitos."></ion-input>
      <ion-input formControlName="correo" type="email" label="Correo electrónico" labelPlacement="stacked"
        fill="outline" inputmode="email" helperText="Aquí llegará el correo de bienvenida."
        errorText="Escribe un correo válido."></ion-input>
      <ion-button type="submit" expand="block" [disabled]="cargando()">
        @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { {{ textoBoton() }} }
      </ion-button>
    </form>
  `,
})
export class FormularioUsuarioComponent {
  private readonly fb = inject(NonNullableFormBuilder);

  readonly cargando = input(false);
  readonly textoBoton = input('Crear usuario');
  readonly guardar = output<DatosPersona>();

  readonly form = this.fb.group({
    cedula: ['', [Validators.required, cedulaValidator]],
    nombres: ['', Validators.required],
    apellidos: ['', Validators.required],
    telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    correo: ['', [Validators.required, Validators.email]],
  });

  mensajeCedula(): string {
    const control = this.form.controls.cedula;
    return control.hasError('required') ? 'Escribe la cédula.' : control.getError('cedula') ?? '';
  }

  enviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.guardar.emit(this.form.getRawValue());
  }
}