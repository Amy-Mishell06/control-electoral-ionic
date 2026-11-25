import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personAdd } from 'ionicons/icons';
import { MesasService } from '../../../core/application/mesas.service';
import { OsoComponent } from '../../shared/oso/oso.component';

@Component({
  selector: 'app-veedores',
  imports: [
    RouterLink, OsoComponent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent,
    IonIcon, IonSpinner,
  ],
  template: `
    <ion-header>
      <ion-toolbar class="huellas">
        <ion-buttons slot="start"><ion-back-button defaultHref="/recinto"></ion-back-button></ion-buttons>
        <ion-title>Veedores</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="contenedor">
        <ion-button expand="block" routerLink="/recinto/veedores/nuevo">
          <ion-icon slot="start" name="person-add"></ion-icon>
          Nuevo veedor
        </ion-button>

        @if (servicio.cargando() && servicio.veedores().length === 0) {
          <div class="centrado"><ion-spinner name="crescent"></ion-spinner></div>
        } @else if (servicio.veedores().length === 0) {
          <div class="estado-vacio">
            <app-oso nombre="equipo" [tamano]="170" animacion="saludar" />
            <p>Todavía no hay veedores en tu recinto. Crea el primero para armar tu equipo.</p>
          </div>
        } @else {
          <p class="texto-secundario">{{ servicio.veedores().length }} veedores en tu equipo</p>
          @for (veedor of servicio.veedores(); track veedor.id) {
            <article class="tarjeta">
              <h3>{{ veedor.nombre }}</h3>
              <p>Cédula {{ veedor.cedula }} · {{ mesasDe(veedor.id) }}</p>
            </article>
          }
        }
      </div>
    </ion-content>
  `,
})
export class VeedoresPage {
  readonly servicio = inject(MesasService);

  constructor() {
    addIcons({ personAdd });
  }

  ionViewWillEnter(): void {
    this.servicio.cargar();
  }

  mesasDe(veedorId: string): string {
    const numeros = this.servicio.mesas().filter((m) => m.veedorId === veedorId).map((m) => m.numero);
    return numeros.length ? `Mesas: ${numeros.join(', ')}` : 'Sin mesas asignadas';
  }
}