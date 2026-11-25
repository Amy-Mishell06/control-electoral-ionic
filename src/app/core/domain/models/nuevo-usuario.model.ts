/** Datos personales que se piden al crear cualquier usuario (R2). */
export interface DatosPersona {
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  correo: string;
}

export interface NuevoUsuario extends DatosPersona {
  rol: 'coordinador_recinto' | 'veedor';
  recintoId: string | null; 
}

export interface UsuarioCreado {
  id: string;
  bienvenidaEnviada: boolean;
}