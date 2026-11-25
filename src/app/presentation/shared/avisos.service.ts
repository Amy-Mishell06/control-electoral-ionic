import { Injectable, inject } from '@angular/core';
import { ToastController } from '@ionic/angular';

/** Avisos de éxito, advertencia y error con ion-toast (ADR-008). */
@Injectable({ providedIn: 'root' })
export class AvisosService {
  private readonly toast = inject(ToastController);

  exito(mensaje: string): Promise<void> {
    return this.mostrar(mensaje, 'success');
  }

  advertencia(mensaje: string): Promise<void> {
    return this.mostrar(mensaje, 'warning');
  }

  error(mensaje: string): Promise<void> {
    return this.mostrar(mensaje, 'danger');
  }

  private async mostrar(mensaje: string, color: string): Promise<void> {
    const aviso = await this.toast.create({ message: mensaje, color, duration: 3500, position: 'bottom' });
    await aviso.present();
  }
}