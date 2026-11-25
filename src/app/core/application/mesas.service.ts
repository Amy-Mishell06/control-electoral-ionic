import { Injectable, inject, signal } from '@angular/core';
import { JuntasPort } from '../domain/ports/juntas.port';
import { EstadoJunta, Veedor } from '../domain/models/junta.model';

/** Mesas y veedores del recinto, con Signals (ADR-005). */
@Injectable({ providedIn: 'root' })
export class MesasService {
  private readonly puerto = inject(JuntasPort);
  private readonly _mesas = signal<EstadoJunta[]>([]);
  private readonly _veedores = signal<Veedor[]>([]);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly mesas = this._mesas.asReadonly();
  readonly veedores = this._veedores.asReadonly();
  readonly cargando = this._cargando.asReadonly();
  readonly error = this._error.asReadonly();

  async cargar(): Promise<void> {
    this._cargando.set(true);
    this._error.set(null);
    try {
      const [mesas, veedores] = await Promise.all([
        this.puerto.listarEstado(),
        this.puerto.listarVeedores(),
      ]);
      this._mesas.set(mesas);
      this._veedores.set(veedores);
    } catch (e) {
      this._error.set(e instanceof Error ? e.message : 'No se pudieron cargar los datos.');
    } finally {
      this._cargando.set(false);
    }
  }

  async asignar(juntaId: string, veedorId: string): Promise<void> {
    await this.puerto.asignarVeedor(juntaId, veedorId);
    await this.cargar();
  }
}