import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { CamaraPort } from '../../domain/ports/camara.port';

/** Cámara con Capacitor: solo cámara (sin galería) (ADR-003). */
@Injectable()
export class CapacitorCamaraAdapter implements CamaraPort {
  async tomarFoto(): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const permisos = await Camera.checkPermissions();
      if (permisos.camera !== 'granted') {
        const respuesta = await Camera.requestPermissions({ permissions: ['camera'] });
        if (respuesta.camera !== 'granted') {
          throw new Error('Necesitamos la cámara para fotografiar el acta. Activa el permiso en la configuración del celular.');
        }
      }
    }
    try {
      const foto = await Camera.getPhoto({
        source: CameraSource.Camera,
        resultType: CameraResultType.DataUrl,
        quality: 80,
        width: 1600,
        correctOrientation: true,
        webUseInput: true, // solo en el navegador (pruebas)
      });
      return foto.dataUrl ?? null;
    } catch (e) {
      const mensaje = e instanceof Error ? e.message.toLowerCase() : '';
      if (mensaje.includes('cancel')) {
        return null;
      }
      throw new Error('No se pudo usar la cámara. Inténtalo de nuevo.');
    }
  }
}