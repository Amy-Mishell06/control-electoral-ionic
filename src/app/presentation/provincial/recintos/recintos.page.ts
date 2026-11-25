import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar, 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, business, logOut, person, personAdd, statsChart } from 'ionicons/icons';
import { RecintosService } from '../../../core/application/recintos.service';
import { SesionService } from '../../../core/application/sesion.service';

@Component({
  selector: 'app-recintos',
  templateUrl: './recintos.page.html',
  imports: [
    RouterLink, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, IonSpinner,
  ],
})
export class RecintosPage {
  readonly servicio = inject(RecintosService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  readonly nombre = computed(() => this.sesion.perfil()?.nombres ?? '');

  constructor() {
    addIcons({ addCircle, business, logOut, person, personAdd, statsChart });
  }

  /** Se recarga cada vez que se vuelve a esta pantalla. */
  ionViewWillEnter(): void {
    this.servicio.cargar();
  }

  async salir(): Promise<void> {
    await this.sesion.cerrarSesion();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}