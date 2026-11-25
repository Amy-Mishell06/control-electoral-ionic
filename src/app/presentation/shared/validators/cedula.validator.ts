import { ValidatorFn } from '@angular/forms';
import { validarCedula } from '../../../core/domain/rules/cedula.rule';

export const cedulaValidator: ValidatorFn = (control) => {
  const motivo = validarCedula(control.value ?? '');
  return motivo ? { cedula: motivo } : null;
};