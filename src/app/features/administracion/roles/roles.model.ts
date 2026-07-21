export type RolCodigo =
  | 'ADMIN'
  | 'DIRECTOR'
  | 'DOCENTE'
  | 'SECRETARIA'
  | 'TESORERO'
  | 'PADRE'
  | 'ESTUDIANTE'
  | 'BIBLIOTECARIO';

export interface Permiso {
  codigo: string;
  label: string;
}

export interface SeccionPermisos {
  modulo: string;
  icono: string;
  permisos: Permiso[];
}

export interface RolDto {
  codigo: RolCodigo;
  label: string;
  descripcion: string;
  color: string;
  esAdmin: boolean;
  usuariosCount: number;
  permisos: string[];
}

export interface RolesResponse {
  roles: RolDto[];
  catalog: SeccionPermisos[];
}

export interface UpdateRolePermissionsPayload {
  permisos: string[];
}
