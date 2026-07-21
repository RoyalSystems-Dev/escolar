export type ActaEstado = 'borrador' | 'generada' | 'aprobada' | 'cerrada';

export interface ActaListItem {
  id: number;
  nivel: string;
  grado: string;
  seccion: string;
  bimestre: number;
  anio: string;
  estado: ActaEstado;
  docente: string;
  aprobadoPor: string;
  totalAlumnos: number;
  aprobados: number;
  desaprobados: number;
  promedioAula: number | null;
  fechaGeneracion: string;
  fechaAprobacion: string | null;
}

export interface ActaAlumnoRow {
  studentId: number;
  estudiante: string;
  notas: Record<string, number | null>;
  promedio: number | null;
  nivel: string | null;
  situacion: 'aprobado' | 'desaprobado' | 'sin_notas';
}

export interface ActaDetail extends ActaListItem {
  observaciones: string;
  cursos: string[];
  alumnos: ActaAlumnoRow[];
  bimestreActual?: number;
  bimestresTerminados?: number[];
}

export interface ActasBimestresMeta {
  anioEscolar: number;
  bimestreActual: number;
  bimestresTerminados: number[];
}

export interface GenerateActaPayload {
  nivel: string;
  grado: string;
  seccion: string;
  bimestre: number;
  anio?: string;
  docente?: string;
  observaciones?: string;
}

export interface ActaFilters {
  nivel?: string;
  grado?: string;
  seccion?: string;
  bimestre?: number;
  estado?: string;
}

export const ESTADOS_ACTA: { value: ActaEstado | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'generada', label: 'Generada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'cerrada', label: 'Cerrada' },
];

export const BIMESTRES_ACTA = [
  { value: 0, label: 'Todos' },
  { value: 1, label: '1° Bimestre' },
  { value: 2, label: '2° Bimestre' },
  { value: 3, label: '3° Bimestre' },
  { value: 4, label: '4° Bimestre' },
];
