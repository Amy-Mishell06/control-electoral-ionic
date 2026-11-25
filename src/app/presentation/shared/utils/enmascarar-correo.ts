/** am***@gmail.com: muestra el correo sin revelarlo completo (ADR-011). */
export function enmascararCorreo(correo: string): string {
  const [usuario, dominio] = correo.split('@');
  if (!dominio) {
    return correo;
  }
  const visible = usuario.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(usuario.length - 2, 3))}@${dominio}`;
}