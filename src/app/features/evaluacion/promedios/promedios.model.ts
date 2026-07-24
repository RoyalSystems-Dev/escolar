import type { GradingConfig } from '../../../core/grading/grading-config.model';

export type NivelLogro = 'AD' | 'A' | 'B' | 'C';
export type ColumnaPromedioTipo = 'numerico' | 'competencia';

export interface CursoPromedio {
  curso: string;
  tipo?: ColumnaPromedioTipo;
  b1: number | null;
  b2: number | null;
  b3: number | null;
  b4: number | null;
  promedioAnual: number | null;
  nivel: NivelLogro | null;
  b1Nivel?: NivelLogro | null;
  b2Nivel?: NivelLogro | null;
  b3Nivel?: NivelLogro | null;
  b4Nivel?: NivelLogro | null;
}

export interface AlumnoPromedio {
  studentId: number;
  estudiante: string;
  nivel: string;
  grado: string;
  seccion: string;
  cursos: CursoPromedio[];
  promedioGeneral: number | null;
  nivelGeneral: NivelLogro | null;
}

export interface PromediosResumen {
  totalAlumnos: number;
  promedioAula: number | null;
  promedioAulaNivel?: NivelLogro | null;
  aprobados: number;
  desaprobados: number;
  enRiesgo: number;
  destacados: number;
}

export interface PromediosResponse {
  resumen: PromediosResumen;
  alumnos: AlumnoPromedio[];
  cursosDisponibles: string[];
  areasDisponibles?: string[];
  bimestreActual: number;
  gradingConfig: GradingConfig;
}

export interface PromediosFilters {
  nivel?: string;
  grado?: string;
  seccion?: string;
  curso?: string;
  busqueda?: string;
}

export interface ColumnaPromedio {
  key: string;
  label: string;
  tipo: ColumnaPromedioTipo;
}

export const NIVEL_VAL: Record<NivelLogro, number> = { AD: 4, A: 3, B: 2, C: 1 };

export function calcPromedioNivel(vals: NivelLogro[]): NivelLogro | null {
  if (!vals.length) return null;
  const avg = vals.reduce((s, n) => s + NIVEL_VAL[n], 0) / vals.length;
  if (avg >= 3.5) return 'AD';
  if (avg >= 2.5) return 'A';
  if (avg >= 1.5) return 'B';
  return 'C';
}

export const BIMESTRES = [
  { key: 'b1' as const, label: 'Bim. 1', num: 1 },
  { key: 'b2' as const, label: 'Bim. 2', num: 2 },
  { key: 'b3' as const, label: 'Bim. 3', num: 3 },
  { key: 'b4' as const, label: 'Bim. 4', num: 4 },
];
