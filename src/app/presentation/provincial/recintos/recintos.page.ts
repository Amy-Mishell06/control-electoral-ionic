import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircle, business, logOut, person, personAdd, statsChart } from 'ionicons/icons';
import { RecintosService } from '../../../core/application/recintos.service';
import { SesionService } from '../../../core/application/sesion.service';
import { OsoComponent } from '../../shared/oso/oso.component';

@Component({
  selector: 'app-recintos',
  templateUrl: './recintos.page.html',
  imports: [
    RouterLink, OsoComponent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, IonSpinner,
  ],
  styles: [`
    .bienvenida { display: flex; align-items: center; gap: 14px; }
    .bienvenida app-oso { flex-shrink: 0; }
    .bienvenida h2 { margin: 0 0 4px; font-family: var(--app-font-titulos); font-size: 1.25rem; }
    .bienvenida p { margin: 0 0 10px; }
    .bienvenida ion-button { margin: 0; }
  `],
})
export class RecintosPage {
  readonly servicio = inject(RecintosService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  readonly nombre = computed(() => this.sesion.perfil()?.nombres ?? '');
  readonly sinCoordinador = computed(() => this.servicio.recintos().filter((r) => !r.coordinador).length);

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