import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  IonBackButton, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonLabel, IonProgressBar,
  IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton, IonSpinner, IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { image, location, refresh, statsChart, warning } from 'ionicons/icons';
import { DashboardService } from '../../../core/application/dashboard.service';
import { Dignidad } from '../../../core/domain/models/acta.model';
import { ActaUbicada } from '../../../core/domain/models/resultados.model';
import {
  DISTANCIA_MAXIMA_M, distanciaMetros, porcentajeAvance,
} from '../../../core/domain/rules/resultados.rule';

type Seccion = 'resultados' | 'avance' | 'ubicaciones';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    DatePipe, DecimalPipe,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonButton, IonContent, IonIcon,
    IonLabel, IonProgressBar, IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton, IonSpinner,
  ],
})
export class DashboardPage implements OnInit {
  readonly servicio = inject(DashboardService);

  readonly distanciaMaxima = DISTANCIA_MAXIMA_M;
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly seccion = signal<Seccion>('resultados');

  /** Dignidad elegida; si no se ha elegido, la primera que haya en los datos. */
  readonly seleccion = signal<Dignidad | null>(null);
  readonly dignidad = computed(() => this.seleccion() ?? this.servicio.dignidades()[0] ?? null);

  readonly filas = computed(() => {
    const d = this.dignidad();
    return d ? this.servicio.resultadosDe(d) : [];
  });
  readonly totales = computed(() => {
    const d = this.dignidad();
    return d ? this.servicio.totalesDe(d) : null;
  });
  readonly votosValidos = computed(() => this.filas().reduce((s, f) => s + f.votos, 0));
  readonly maximo = computed(() => Math.max(1, ...this.filas().map((f) => f.votos)));

  constructor() {
    addIcons({ image, location, refresh, statsChart, warning });
  }

  async ngOnInit(): Promise<void> {
    await this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      await this.servicio.cargar();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo cargar el dashboard.');
    } finally {
      this.cargando.set(false);
    }
  }

  async refrescar(evento: CustomEvent): Promise<void> {
    await this.cargar();
    (evento.target as HTMLIonRefresherElement).complete();
  }

  cambiarSeccion(valor: unknown): void {
    this.seccion.set(valor as Seccion);
  }

  cambiarDignidad(valor: unknown): void {
    this.seleccion.set(valor as Dignidad);
  }

  textoDignidad(d: Dignidad): string {
    return d === 'alcalde' ? 'Alcaldía' : 'Prefectura';
  }

  porcentaje(recibidas: number, esperadas: number): number {
    return porcentajeAvance(recibidas, esperadas);
  }

  /** Metros entre el lugar donde se tomó el acta y el recinto, si se conoce. */
  distancia(acta: ActaUbicada): number | null {
    return acta.ubicacionRecinto ? distanciaMetros(acta.ubicacion, acta.ubicacionRecinto) : null;
  }

  enlaceMapa(acta: ActaUbicada): string {
    return `https://www.google.com/maps?q=${acta.ubicacion.latitud},${acta.ubicacion.longitud}`;
  }

  async verFoto(ruta: string): Promise<void> {
    try {
      window.open(await this.servicio.urlFoto(ruta), '_blank');
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'No se pudo abrir la foto.');
    }
  }
}
