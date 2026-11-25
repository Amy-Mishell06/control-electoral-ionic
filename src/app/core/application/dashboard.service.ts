import { Injectable, computed, inject, signal } from '@angular/core';
import { Dignidad } from '../domain/models/acta.model';
import {
  ActaUbicada, AvanceRecinto, ResultadoConPorcentaje, ResultadoOrganizacion, TotalesDignidad,
} from '../domain/models/resultados.model';
import { DashboardPort } from '../domain/ports/dashboard.port';
import { calcularPorcentajes, porcentajeAvance, sumarActas } from '../domain/rules/resultados.rule';

/** Estado del dashboard provincial con Signals (ADR-005). */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly dashboard = inject(DashboardPort);

  readonly resultados = signal<ResultadoOrganizacion[]>([]);
  readonly totales = signal<TotalesDignidad[]>([]);
  readonly avance = signal<AvanceRecinto[]>([]);
  readonly actas = signal<ActaUbicada[]>([]);
  readonly actualizado = signal<Date | null>(null);

  /** Dignidades que existen en los datos (Alcaldía, Prefectura). */
  readonly dignidades = computed(() => [...new Set(this.resultados().map((r) => r.dignidad))]);

  readonly avanceGeneral = computed(() => {
    const esperadas = this.avance().reduce((s, r) => s + r.esperadas, 0);
    const recibidas = this.avance().reduce((s, r) => s + r.recibidas, 0);
    return { esperadas, recibidas, porcentaje: porcentajeAvance(recibidas, esperadas) };
  });

  async cargar(): Promise<void> {
    const [resultados, resumen, avance, actas] = await Promise.all([
      this.dashboard.resultados(),
      this.dashboard.actasResumen(),
      this.dashboard.avance(),
      this.dashboard.actasUbicadas(),
    ]);
    this.resultados.set(resultados);
    this.totales.set(sumarActas(resumen));
    this.avance.set(avance);
    this.actas.set(actas);
    this.actualizado.set(new Date());
  }

  resultadosDe(dignidad: Dignidad): ResultadoConPorcentaje[] {
    return calcularPorcentajes(this.resultados().filter((r) => r.dignidad === dignidad));
  }

  totalesDe(dignidad: Dignidad): TotalesDignidad | null {
    return this.totales().find((t) => t.dignidad === dignidad) ?? null;
  }

  urlFoto(ruta: string): Promise<string> {
    return this.dashboard.urlFoto(ruta);
  }
}
