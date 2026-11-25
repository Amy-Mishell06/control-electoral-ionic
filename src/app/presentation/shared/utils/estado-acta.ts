import { EstadoActa } from '../../../core/domain/models/acta.model';

/** Texto y color de cada estado */
export const TEXTO_ESTADO: Record<EstadoActa, string> = {
  pendiente: 'Pendiente',
  registrada: 'Registrada',
  corregida: 'Corregida',
};

export const COLOR_ESTADO: Record<EstadoActa, string> = {
  pendiente: 'medium',
  registrada: 'success',
  corregida: 'warning',
};