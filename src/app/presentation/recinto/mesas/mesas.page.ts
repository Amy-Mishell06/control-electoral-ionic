import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  AlertController, IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonSpinner,
  IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { logOut, people } from 'ionicons/icons';
import { MesasService } from '../../../core/application/mesas.service';
import { SesionService } from '../../../core/application/sesion.service';
import { EstadoJunta } from '../../../core/domain/models/junta.model';
import { AvisosService } from '../../shared/avisos.service';
import { OsoComponent } from '../../shared/oso/oso.component';
import { COLOR_ESTADO, TEXTO_ESTADO } from '../../shared/utils/estado-acta';

@Component({
  selector: 'app-mesas',
  templateUrl: './mesas.page.html',
  imports: [
    RouterLink, OsoComponent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonIcon,
    IonSpinner, IonBadge,
  ],
  styles: [`
    .bienvenida { display: flex; align-items: center; gap: 14px; }
    .bienvenida app-oso { flex-shrink: 0; }
    .bienvenida h2 { margin: 0 0 6px; font-family: var(--app-font-titulos); font-size: 1.25rem; }
    .cifras { display: flex; gap: 16px; flex-wrap: wrap; }
    .cifras div { display: flex; flex-direction: column; }
    .cifras strong { font-size: 1.3rem; color: var(--ion-color-primary); }
    .cifras span { font-size: 0.8rem; color: var(--app-texto-secundario); }
  `],
})
export class MesasPage {
  readonly servicio = inject(MesasService);
  private readonly sesion = inject(SesionService);
  private readonly router = inject(Router);
  private readonly alertas = inject(AlertController);
  private readonly avisos = inject(AvisosService);

  readonly textoEstado = TEXTO_ESTADO;
  readonly colorEstado = COLOR_ESTADO;
  readonly recinto = computed(() => this.servicio.mesas()[0]?.recinto ?? 'Mi recinto');
  readonly sinVeedor = computed(() => this.servicio.mesas().filter((m) => !m.veedorId).length);
  /** Actas que ya llegaron (alcalde + prefecto) de todas las mesas del recinto. */
  readonly actasRecibidas = computed(() =>
    this.servicio.mesas().reduce(
      (s, m) => s + (m.estadoAlcalde !== 'pendiente' ? 1 : 0) + (m.estadoPrefecto !== 'pendiente' ? 1 : 0),
      0,
    ),
  );

  constructor() {
    addIcons({ logOut, people });
  }

  ionViewWillEnter(): void {
    this.servicio.cargar();
  }

  /** Elige un veedor con ion-alert; si la mesa ya tenía uno, se reasigna (R5, ADR-008). */
  async elegirVeedor(mesa: EstadoJunta): Promise<void> {
    const veedores = this.servicio.veedores();
    if (veedores.length === 0) {
      await this.avisos.advertencia('Primero crea veedores en la sección Veedores.');
      return;
    }

    const alerta = await this.alertas.create({
      header: `Mesa ${mesa.numero}`,
      message: mesa.veedor
        ? `Veedor actual: ${mesa.veedor}. Si eliges otro, la mesa se reasigna.`
        : 'Elige el veedor de esta mesa.',
      inputs: veedores.map((v) => ({
        type: 'radio' as const,
        label: v.nombre,
        value: v.id,
        checked: v.id === mesa.veedorId,
      })),
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: mesa.veedor ? 'Reasignar' : 'Asignar', role: 'confirm' },
      ],
    });
    await alerta.present();

    const { role, data } = await alerta.onDidDismiss();
    const veedorId = data?.values as string | undefined;
    if (role !== 'confirm' || !veedorId || veedorId === mesa.veedorId) {
      return;
    }

    try {
      await this.servicio.asignar(mesa.juntaId, veedorId);
      await this.avisos.exito(`Mesa ${mesa.numero} asignada.`);
    } catch (e) {
      await this.avisos.error(e instanceof Error ? e.message : 'No se pudo asignar el veedor.');
    }
  }

  async salir(): Promise<void> {
    await this.sesion.cerrarSesion();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}