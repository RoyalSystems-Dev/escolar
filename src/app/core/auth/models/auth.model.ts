// ==========================================
// MODELOS DE AUTENTICACIÓN Y SEGURIDAD
// ==========================================

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  foto?: string;
  roles: UserRole[];
  permisos: string[];
  institucionId: string;
  sedeId?: string;
  estado: 'activo' | 'inactivo' | 'bloqueado';
  ultimoAcceso?: Date;
  requiereCambioPassword: boolean;
}

export interface UserRole {
  id: string;
  nombre: string;
  codigo: RolCodigo;
  nivel: number;
}

export type RolCodigo =
  | 'ADMIN' | 'DIRECTOR' | 'DOCENTE'
  | 'PADRE' | 'ESTUDIANTE' | 'TESORERO'
  | 'SECRETARIA' | 'BIBLIOTECARIO';

export interface TokenPayload {
  sub: string;
  username: string;
  email: string;
  roles: string[];
  permisos: string[];
  institucionId: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenRequest { refreshToken: string; }
export interface ChangePasswordRequest { passwordActual: string; passwordNuevo: string; confirmPassword: string; }
export interface ForgotPasswordRequest { email: string; }
export interface ResetPasswordRequest  { token: string; passwordNuevo: string; confirmPassword: string; }

export const PERMISOS = {
  ADMIN_FULL:         'admin:full',
  USUARIOS_VER:       'usuarios:ver',
  USUARIOS_CREAR:     'usuarios:crear',
  USUARIOS_EDITAR:    'usuarios:editar',
  USUARIOS_ELIMINAR:  'usuarios:eliminar',
  ROLES_GESTIONAR:    'roles:gestionar',
  CONFIG_INST:        'config:institucional',
  ESTUDIANTES_VER:    'estudiantes:ver',
  ESTUDIANTES_CREAR:  'estudiantes:crear',
  ESTUDIANTES_EDITAR: 'estudiantes:editar',
  MATRICULA_VER:      'matricula:ver',
  MATRICULA_CREAR:    'matricula:crear',
  ACADEMICO_VER:      'academico:ver',
  ACADEMICO_GESTIONAR:'academico:gestionar',
  ASISTENCIA_VER:     'asistencia:ver',
  ASISTENCIA_REG:     'asistencia:registrar',
  EVALUACION_VER:     'evaluacion:ver',
  NOTAS_REGISTRAR:    'notas:registrar',
  NOTAS_CERRAR:       'notas:cerrar',
  TESORERIA_VER:      'tesoreria:ver',
  PAGOS_REGISTRAR:    'pagos:registrar',
  REPORTES_VER:       'reportes:ver',
  REPORTES_EXPORT:    'reportes:exportar',
  DASHBOARD_VER:      'dashboard:ver',
  DASHBOARD_BI:       'dashboard:bi',
} as const;

export type Permiso = typeof PERMISOS[keyof typeof PERMISOS];
