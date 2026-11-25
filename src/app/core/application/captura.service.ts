import { Injectable, inject } from '@angular/core';
import { CamaraPort } from '../domain/ports/camara.port';
import { GpsPort } from '../domain/ports/gps.port';
import { NitidezPort } from '../domain/ports/nitidez.port';
import { FotoAnalizada, Ubicacion } from '../domain/models/registro-acta.model';
import { esNitida } from '../domain/rules/nitidez.rule';

/** Foto con su nitidez y ubicación GPS (ADR-003, ADR-012). */
@Injectable({ providedIn: 'root' })
export class CapturaService {
  private readonly camara = inject(CamaraPort);
  private readonly gps = inject(GpsPort);
  private readonly nitidez = inject(NitidezPort);

  async tomarFoto(): Promise<FotoAnalizada | null> {
    const dataUrl = await this.camara.tomarFoto();
    if (!dataUrl) {
      return null;
    }
    const valor = await this.nitidez.medir(dataUrl);
    return { dataUrl, nitidez: Math.round(valor), nitida: esNitida(valor) };
  }

  obtenerUbicacion(): Promise<Ubicacion> {
    return this.gps.obtenerUbicacion();
  }
}