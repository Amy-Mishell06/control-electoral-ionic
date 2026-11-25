import { Injectable, inject, signal } from '@angular/core';
import { RecintosPort } from '../domain/ports/recintos.port';
import { NuevoRecinto, Recinto } from '../domain/models/recinto.model';

/** Estado de los recintos con Signals (ADR-005). */
@Injectable({ providedIn: 'root' })
export class RecintosService {
  private readonly puerto = inject(RecintosPort);
  private readonly _recintos = signal<Recinto[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly recintos = this._recintos.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  async cargar(): Promise<void> {
    this._cargando.set(true);
    this._error.set(null);
    try {
      this._recintos.set(await this.puerto.listar());
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : 'No se pudieron cargar los recintos.');
    } finally {
      this._cargando.set(false);
    }
  }

  async crear(recinto: NuevoRecinto): Promise<void> {
    if (!recinto.nombre.trim() || !recinto.parroquia.trim()) {
      throw new Error('Completa el nombre y la parroquia.');
    }
    if (!Number.isInteger(recinto.cantidadJrv) || recinto.cantidadJrv < 1) {
      throw new Error('La cantidad de mesas debe ser un número entero mayor que 0.');
    }
    await this.puerto.crear(recinto);
    await this.cargar();
  }
}