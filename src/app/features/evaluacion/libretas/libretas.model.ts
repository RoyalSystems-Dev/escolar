import { NivelLogro } from '../competencias/competencias.model';

export type EstadoLibreta = 'pendiente' | 'generada' | 'firmada';

export interface FirmaInfo {
  nombre: string;
  cargo: string;
  fechaFirma: string;
  firmado: boolean;
}

export interface CompEval {
  codigo: string;
  nombre: string;
  niveles: Record<number, NivelLogro | null>;
}

export interface AreaEval {
  nombre: string;
  emoji: string;
  competencias: CompEval[];
  promediosPorBimestre: Record<number, NivelLogro | null>;
}

export interface Libreta {
  id?: number;
  alumnoId: number;
  alumno: string;
  nivel: string;
  grado: string;
  seccion: string;
  bimestre: number;
  anio: number;
  bimestresVisibles: number[];
  estado: EstadoLibreta;
  areas: AreaEval[];
  promediosPorBimestre: Record<number, NivelLogro | null>;
  promedioGlobal: NivelLogro | null;
  firmaDirector: FirmaInfo;
  firmaTutor: FirmaInfo;
  observaciones: string;
}

export interface LibretaInstitucion {
  nombre: string;
  siglas: string;
  codigoModular: string;
  ruc: string;
  tipoGestion: string;
  ugel: string;
  dre: string;
  resolucion: string;
  direccion: string;
  distrito: string;
  provincia: string;
  region: string;
  telefono: string;
  email: string;
  director: string;
  subdirector: string;
  anioLectivo: number;
  tipoPeriodo: string;
}

export interface LibretaListResponse {
  institucion: LibretaInstitucion;
  bimestre: number;
  bimestresVisibles: number[];
  bimestresDisponibles: number[];
  nivel: string;
  grado: string;
  seccion: string;
  anio: number;
  resumen: {
    total: number;
    pendiente: number;
    generada: number;
    firmada: number;
  };
  libretas: Libreta[];
}

export interface LibretaFilters {
  nivel: string;
  grado: string;
  seccion: string;
  bimestre: number;
  anio?: number;
  estado?: EstadoLibreta | 'todos';
}

export interface GenerateLibretasPayload extends LibretaFilters {
  studentIds?: number[];
}

export interface UpdateLibretaPayload extends LibretaFilters {
  observaciones?: string;
  firmaDirectorNombre?: string;
  firmaDirectorCargo?: string;
  firmaDirectorFirmado?: boolean;
  firmaDirectorFecha?: string;
  firmaTutorNombre?: string;
  firmaTutorCargo?: string;
  firmaTutorFirmado?: boolean;
  firmaTutorFecha?: string;
  estado?: EstadoLibreta;
}

export function nivelCompetencia(comp: CompEval, bimestre: number): NivelLogro | null {
  return comp.niveles[bimestre] ?? null;
}
