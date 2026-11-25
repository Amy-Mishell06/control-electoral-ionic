import { Injectable } from '@angular/core';
import { NitidezPort } from '../../domain/ports/nitidez.port';
import { varianzaLaplaciano } from '../../domain/rules/nitidez.rule';

/** Reduce la foto a 500 px, la pasa a grises y calcula la varianza del Laplaciano (ADR-012). */
@Injectable()
export class CanvasNitidezAdapter implements NitidezPort {
  async medir(dataUrl: string): Promise<number> {
    const imagen = await cargarImagen(dataUrl);
    const ancho = Math.min(500, imagen.naturalWidth);
    const alto = Math.round((imagen.naturalHeight * ancho) / imagen.naturalWidth);

    const canvas = document.createElement('canvas');
    canvas.width = ancho;
    canvas.height = alto;
    const contexto = canvas.getContext('2d', { willReadFrequently: true });
    if (!contexto) {
      throw new Error('No se pudo analizar la foto.');
    }
    contexto.drawImage(imagen, 0, 0, ancho, alto);

    const { data } = contexto.getImageData(0, 0, ancho, alto);
    const gris = new Float32Array(ancho * alto);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      gris[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    return varianzaLaplaciano(gris, ancho, alto);
  }
}

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.onload = () => resolver(imagen);
    imagen.onerror = () => rechazar(new Error('No se pudo leer la foto.'));
    imagen.src = src;
  });
}