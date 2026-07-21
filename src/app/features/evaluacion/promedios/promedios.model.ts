export type NivelLogro = 'AD' | 'A' | 'B' | 'C';

export interface CursoPromedio {
  curso: string;
  b1: number | null;
  b2: number | null;
  b3: number | null;
  b4: number | null;
  promedioAnual: number | null;
  nivel: NivelLogro | null;
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
  aprobados: number;
  desaprobados: number;
  enRiesgo: number;
  destacados: number;
}

export interface PromediosResponse {
  resumen: PromediosResumen;
  alumnos: AlumnoPromedio[];
  cursosDisponibles: string[];
  bimestreActual: number;
}

export interface PromediosFilters {
  nivel?: string;
  grado?: string;
  seccion?: string;
  curso?: string;
  busqueda?: string;
}

export const NIVELES_LOGRO: { nivel: NivelLogro; label: string; min: number; badge: string }[] = [
  { nivel: 'AD', label: 'Logro Destacado', min: 17.5, badge: 'badge-indigo' },
  { nivel: 'A', label: 'Logro Esperado', min: 14, badge: 'badge-green' },
  { nivel: 'B', label: 'En Proceso', min: 11, badge: 'badge-yellow' },
  { nivel: 'C', label: 'En Inicio', min: 0, badge: 'badge-red' },
];

export const BIMESTRES = [
  { key: 'b1' as const, label: 'Bim. 1', num: 1 },
  { key: 'b2' as const, label: 'Bim. 2', num: 2 },
  { key: 'b3' as const, label: 'Bim. 3', num: 3 },
  { key: 'b4' as const, label: 'Bim. 4', num: 4 },
];
