export interface Sede {
  id: number;
  institutionId?: number;
  nombre: string;
  codigo: string;
  direccion: string;
  distrito: string;
  provincia: string;
  region: string;
  telefono: string;
  email: string;
  director: string;
  niveles: string[];
  turnos: string[];
  estado: 'activo' | 'inactivo';
}

export interface Periodo {
  numero: number;
  nombre: string;
  tipo: string;
  inicio: string;
  fin: string;
  actual: boolean;
}

export interface Seccion {
  id: number;
  nombre: string;
}

export interface Grado {
  id: number;
  nombre: string;
  orden?: number;
  secciones: Seccion[];
}

export interface Nivel {
  id: number;
  nombre: string;
  activo: boolean;
  orden?: number;
  grados: Grado[];
}

export interface InstitucionData {
  nombre: string;
  siglas: string;
  ruc: string;
  codigoModular: string;
  tipoGestion: string;
  ugel: string;
  dre: string;
  resolucion: string;
  direccion: string;
  distrito: string;
  provincia: string;
  region: string;
  codigoPostal: string;
  telefono: string;
  telefono2: string;
  email: string;
  web: string;
  facebook: string;
  director: string;
  subdirector: string;
  administrador: string;
  anio: string;
  sistemaEval: string;
  tipoPeriodo: string;
  notaMinima: number;
  escalaLogro?: { AD: number; A: number; B: number };
}

export interface ConfigSistema {
  moneda: string;
  timezone: string;
  formatoFecha: string;
}

export interface ModuloSistema {
  key: string;
  label: string;
  desc: string;
  icon: string;
  activo: boolean;
}

export interface InstitutionConfigResponse {
  institution: InstitucionData & {
    id: number;
    escalaLogro?: { AD: number; A: number; B: number };
    niveles: Nivel[];
    periodos: Periodo[];
    config: ConfigSistema;
    modulos: ModuloSistema[];
  };
  campuses: Sede[];
}
