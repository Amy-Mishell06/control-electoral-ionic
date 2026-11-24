/** Dignidades que se registran en cada mesa (R6). */
export type Dignidad = 'alcalde' | 'prefecto';

/** Estados de un acta, acordados en el ADR-002. */
export type EstadoActa = 'pendiente' | 'registrada' | 'corregida';

/** Votos de una organización política dentro de un acta. */
export interface VotoOrganizacion {
  organizacionId: string;
  votos: number;
}

/** Los números que el veedor escribe en el acta. */
export interface TotalesActa {
  votos: VotoOrganizacion[];
  nulos: number;
  blancos: number;
  totalSufragantes: number;
}