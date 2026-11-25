import { DatosPersona } from '../models/nuevo-usuario.model';
import { validarCedula } from './cedula.rule';

/** Valida los datos de un usuario nuevo antes de enviarlos (R2, ADR-006). */
export function validarDatosPersona(d: DatosPersona): string | null {
  const motivoCedula = validarCedula(d.cedula);
  if (motivoCedula) {
    return motivoCedula;
  }
  if (!d.nombres.trim() || !d.apellidos.trim()) {
    return 'Completa los nombres y apellidos.';
  }
  if (!/^\d{10}$/.test(d.telefono.trim())) {
    return 'El teléfono debe tener 10 dígitos.';
  }
  if (!/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(d.correo.trim())) {
    return 'El correo no es válido.';
  }
  return null;
}