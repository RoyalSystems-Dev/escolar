export type NivelAsignacion = 'Inicial' | 'Primaria' | 'Secundaria';
export type TipoDocente = 'nombrado' | 'contratado';

export interface DocenteAsignacion {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  especialidad: string;
  tipo: TipoDocente;
  maxHoras: number;
  activo: boolean;
}

export interface CursoAsignacion {
  id: number;
  curriculumId: number;
  maestroCursoId?: number | null;
  nombre: string;
  area: string;
  areaId: number;
  nivel: NivelAsignacion;
  grados: string[];
  horasSemanales: number;
}

export interface AsignacionDocente {
  id: number;
  docenteId: number | null;
  docenteNombre: string;
  cursoId: number;
  curriculumId: number | null;
  nivel: NivelAsignacion;
  grado: string;
  secciones: string[];
  horasSemanales: number;
  activo: boolean;
}

export interface AsignacionContext {
  anioEscolar: number;
  curriculas: Array<{ id: number; anio: number; nivel: string; estado: string }>;
  docentes: DocenteAsignacion[];
  cursos: CursoAsignacion[];
  asignaciones: AsignacionDocente[];
  seccionesPorGrado: Record<string, string[]>;
}

export interface CreateAsignacionPayload {
  curriculumId: number;
  docenteId: number;
  cursoId: number;
  nivel: NivelAsignacion;
  grado: string;
  secciones: string[];
  horasSemanales?: number;
}

export interface UpdateAsignacionPayload {
  docenteId?: number;
  cursoId?: number;
  nivel?: NivelAsignacion;
  grado?: string;
  secciones?: string[];
  horasSemanales?: number;
  activo?: boolean;
}
