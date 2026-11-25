import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { camera, create, logOut } from 'ionicons/icons';
import { MesasService } from '../../../core/application/mesas.service';
import { SesionService } from '../../../core/application/sesion.service';
import { Dignidad, EstadoActa } from '../../../core/domain/models/acta.model';
import { OsoComponent } from '../../shared/oso/oso.component';
import { COLOR_ESTADO, TEXTO_ESTADO } from '../../shared/utils/estado-acta';

@Component({
  selector: 'app-mis-mesas',
  imports: [
    RouterLink, OsoComponent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon, IonSpinner, IonBadge,
  ],
  template: `
    <ion-header>
      <ion-toolbar class="huellas">
        <ion-title>Mis mesas</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="salir()" aria-label="Cerrar sesión">
            <ion-icon slot="icon-only" name="log-out"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="contenedor">
        <section class="saludo">
          <app-oso nombre="votando" [tamano]="88" animacion="saludar" />
          <div>
            <h2>Hola, {{ nombre() }}</h2>
            <p class="texto-secundario">Registra las actas de tus mesas cuando termine el conteo.</p>
          </div>
        </section>

        @if (servicio.cargando() && servicio.mesas().length === 0) {
          <div class="centrado"><ion-spinner name="crescent"></ion-spinner></div>
        } @else if (servicio.error()) {
          <p class="mensaje-error" role="alert">{{ servicio.error() }}</p>
          <ion-button fill="outline" (click)="servicio.cargar()">Reintentar</ion-button>
        } @else if (servicio.mesas().length === 0) {
          <div class="estado-vacio">
            <app-oso nombre="mariposa" [tamano]="130" />
            <p>Todavía no tienes mesas asignadas. Consulta con tu coordinador de recinto.</p>
          </div>
        } @else {
          @for (mesa of servicio.mesas(); track mesa.juntaId) {
            <article class="tarjeta">
              <h3>Mesa {{ mesa.numero }}</h3>
              <p>{{ mesa.recinto }}</p>
              @for (d of dignidades; track d.valor) {
                <div class="fila-acta">
                  <span>{{ d.texto }}</span>
                  <ion-badge [color]="colorEstado[estado(mesa.estadoAlcalde, mesa.estadoPrefecto, d.valor)]">
                    {{ textoEstado[estado(mesa.estadoAlcalde, mesa.estadoPrefecto, d.valor)] }}
                  </ion-badge>
                  @if (estado(mesa.estadoAlcalde, mesa.estadoPrefecto, d.valor) === 'pendiente') {
                    <ion-button size="small" [routerLink]="['/veedor/acta', mesa.juntaId, d.valor]">
                      <ion-icon slot="start" name="camera"></ion-icon>
                      Registrar
                    </ion-button>
                  } @else {
                    <ion-button size="small" fill="outline" [routerLink]="['/veedor/acta', mesa.juntaId, d.valor, 'corregir']">
                      <ion-icon slot="start" name="create"></ion-icon>
                      Corregir
                    </ion-button>
                  }
                </div>
              }
            </article>
          }
        }
      </div>
    </ion-content>
  `,
  styles: [`
    .fila-acta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 6px; }
    .fila-acta span { font-weight: 600; min-width: 90px; }
    .saludo { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; }
    .saludo h2 { margin: 0 0 4px; font-family: var(--app-font-titulos); font-size: 1.3rem; }
    .saludo p { margin: 0; }
    .saludo app-oso { flex-shrink: 0; }
  `],
})
export class MisMesasPage {
  readonly servicio = inject(MesasService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  readonly textoEstado = TEXTO_ESTADO;
  readonly colorEstado = COLOR_ESTADO;
  readonly nombre = computed(() => this.sesion.perfil()?.nombres ?? '');
  readonly dignidades: { valor: Dignidad; texto: string }[] = [
    { valor: 'alcalde', texto: 'Alcaldía' },
    { valor: 'prefecto', texto: 'Prefectura' },
  ];

  constructor() {
    addIcons({ camera, create, logOut });
  }

  ionViewWillEnter(): void {
    this.servicio.cargar();
  }

  estado(alcalde: EstadoActa, prefecto: EstadoActa, dignidad: Dignidad): EstadoActa {
    return dignidad === 'alcalde' ? alcalde : prefecto;
  }

  async salir(): Promise<void> {
    await this.sesion.cerrarSesion();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}