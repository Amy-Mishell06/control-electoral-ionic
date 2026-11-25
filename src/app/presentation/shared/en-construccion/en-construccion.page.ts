import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar,
} from '@ionic/angular';
import { SesionService } from '../../../core/application/sesion.service';

/** Pantalla provisional: se reemplaza por las pantallas reales de cada rol. */
@Component({
  selector: 'app-en-construccion',
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent],
  template: `
    <ion-header>
      <ion-toolbar class="huellas">
        <ion-title>{{ titulo }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="salir()">Salir</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h2>Hola, {{ sesion.perfil()?.nombres }}</h2>
      <p>Rol: {{ sesion.perfil()?.rol }}</p>
      <p>Esta pantalla está en construcción.</p>
    </ion-content>
  `,
})
export class EnConstruccionPage {
  readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  readonly titulo: string = inject(ActivatedRoute).snapshot.data['titulo'] ?? 'Yupana';

  async salir(): Promise<void> {
    await this.sesion.cerrarSesion();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}