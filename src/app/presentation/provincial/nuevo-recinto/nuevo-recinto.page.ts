import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonInput, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';
import { RecintosService } from '../../../core/application/recintos.service';
import { AvisosService } from '../../shared/avisos.service';

@Component({
  selector: 'app-nuevo-recinto',
  imports: [
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonInput, IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar class="huellas">
        <ion-buttons slot="start"><ion-back-button defaultHref="/provincial"></ion-back-button></ion-buttons>
        <ion-title>Nuevo recinto</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="contenedor">
        <p class="texto-secundario">Pichincha · Quito. Las mesas se crean automáticamente.</p>
        <form class="formulario" [formGroup]="form" (ngSubmit)="guardar()" novalidate>
          <ion-input formControlName="nombre" label="Nombre del recinto" labelPlacement="stacked"
            fill="outline" errorText="Escribe el nombre."></ion-input>
          <ion-input formControlName="parroquia" label="Parroquia" labelPlacement="stacked"
            fill="outline" errorText="Escribe la parroquia."></ion-input>
          <ion-input formControlName="cantidadJrv" type="number" label="Cantidad de mesas (JRV)"
            labelPlacement="stacked" fill="outline" inputmode="numeric"
            errorText="Escribe un número entre 1 y 300."></ion-input>
          <ion-input formControlName="latitud" type="number" label="Latitud (opcional)"
            labelPlacement="stacked" fill="outline" helperText="Ejemplo: -0.085255"
            errorText="Debe estar entre -90 y 90."></ion-input>
          <ion-input formControlName="longitud" type="number" label="Longitud (opcional)"
            labelPlacement="stacked" fill="outline" helperText="Ejemplo: -78.509283"
            errorText="Debe estar entre -180 y 180."></ion-input>
          @if (error()) { <p class="mensaje-error" role="alert">{{ error() }}</p> }
          <ion-button type="submit" expand="block" [disabled]="cargando()">
            @if (cargando()) { <ion-spinner name="crescent"></ion-spinner> } @else { Crear recinto }
          </ion-button>
        </form>
      </div>
    </ion-content>
  `,
})
export class NuevoRecintoPage {
  private readonly fb = inject(FormBuilder);
  private readonly recintos = inject(RecintosService);
  private readonly avisos = inject(AvisosService);
  private readonly router = inject(Router);

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.group({
    nombre: ['', Validators.required],
    parroquia: ['', Validators.required],
    cantidadJrv: ['', [Validators.required, Validators.min(1), Validators.max(300), Validators.pattern(/^\d+$/)]],
    latitud: ['', [Validators.min(-90), Validators.max(90)]],
    longitud: ['', [Validators.min(-180), Validators.max(180)]],
  });

  async guardar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const aNumero = (x: string | null) => (x === null || x === '' ? null : Number(x));
    this.cargando.set(true);
    this.error.set(null);
    try {
      await this.recintos.crear({
        nombre: (v.nombre ?? '').trim(),
        parroquia: (v.parroquia ?? '').trim(),
        cantidadJrv: Number(v.cantidadJrv),
        latitud: aNumero(v.latitud),
        longitud: aNumero(v.longitud),
      });
      await this.avisos.exito(`Recinto creado con ${v.cantidadJrv} mesas.`);
      await this.router.navigateByUrl('/provincial', { replaceUrl: true });
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo crear el recinto.');
    } finally {
      this.cargando.set(false);
    }
  }
}