import { TipoEscala } from '../../academico/curricula/curricula.model';

export type NivelLogro = 'AD' | 'A' | 'B' | 'C';

export interface CompetenciaItem {
  id: number;
  cursoId: number;
  codigo: string;
  nombre: string;
  short: string;
}

export interface AreaCompetencia {
  id: number;
  nombre: string;
  emoji: string;
  competencias: CompetenciaItem[];
}

export interface AlumnoCompetencia {
  id: number;
  nombre: string;
  grado: string;
  seccion: string;
}

export interface EvaluacionCompetencia {
  id: number;
  studentId: number;
  competenciaId: number;
  bimestre: number;
  anio: number;
  nivelLogro: NivelLogro;
}

export interface CompetencyMatrixResponse {
  curriculum: {
    id: number;
    anio: number;
    nivel: string;
    tipoEscala: TipoEscala;
    tipoPeriodo: string;
  };
  bimestre: number;
  bimestreActual: number;
  bimestreHabilitado: boolean;
  cursoId?: number;
  cursoNombre?: string;
  nivel: string;
  grado: string;
  seccion: string;
  areas: AreaCompetencia[];
  alumnos: AlumnoCompetencia[];
  evaluaciones: EvaluacionCompetencia[];
}

export interface CompetencyMatrixFilters {
  nivel: string;
  grado: string;
  seccion: string;
  bimestre: number;
  anio?: number;
  curriculumId?: number;
  cursoId?: number;
}

export interface SaveCompetencyEntry {
  studentId: number;
  competenciaId: number;
  evaluationId?: number;
  nivelLogro?: NivelLogro | null;
}

export interface SaveCompetencyBulkPayload {
  nivel: string;
  grado: string;
  seccion: string;
  bimestre: number;
  anio?: number;
  curriculumId?: number;
  cursoId?: number;
  entries: SaveCompetencyEntry[];
}

export const NIVEL_VAL: Record<NivelLogro, number> = { AD: 4, A: 3, B: 2, C: 1 };

export const NCFG: Record<
  NivelLogro,
  { badge: string; btn: string; bar: string; label: string }
> = {
  AD: {
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    btn: 'bg-indigo-600 text-white hover:bg-indigo-700',
    bar: 'bg-indigo-400',
    label: 'Logro Destacado',
  },
  A: {
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    btn: 'bg-emerald-600 text-white hover:bg-emerald-700',
    bar: 'bg-emerald-400',
    label: 'Logro Esperado',
  },
  B: {
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    btn: 'bg-amber-500 text-white hover:bg-amber-600',
    bar: 'bg-amber-400',
    label: 'En Proceso',
  },
  C: {
    badge: 'bg-red-100 text-red-700 border-red-200',
    btn: 'bg-red-500 text-white hover:bg-red-600',
    bar: 'bg-red-400',
    label: 'En Inicio',
  },
};

export const NIVELES: NivelLogro[] = ['AD', 'A', 'B', 'C'];

/** Opción de grado: valor API (4°) + etiqueta UI (4° Grado) */
export interface GradoFiltroOption {
  valor: string;
  etiqueta: string;
  institucional: string;
}

/** Convierte nombre institucional → valor de matrícula/currícula */
export function gradoInstitucionalAValor(nivel: string, nombre: string): string {
  const m = nombre.trim().match(/(\d+)/);
  if (!m) return nombre.trim();
  if (nivel === 'Inicial') return `${m[1]} años`;
  return `${m[1]}°`;
}

/** Etiqueta amigable para el selector */
export function gradoEtiqueta(nivel: string, nombre: string): string {
  const valor = gradoInstitucionalAValor(nivel, nombre);
  if (nivel === 'Inicial') return valor;
  if (nivel === 'Secundaria') return `${valor.replace('°', '')}° Año`;
  return `${valor} Grado`;
}

export function buildGradoOptions(
  niveles: Array<{
    nombre: string;
    activo?: boolean;
    grados: Array<{ nombre: string; secciones: Array<{ nombre: string }> }>;
  }>,
): {
  gradosPorNivel: Record<string, GradoFiltroOption[]>;
  seccionesPorGrado: Record<string, string[]>;
} {
  const gradosPorNivel: Record<string, GradoFiltroOption[]> = {};
  const seccionesPorGrado: Record<string, string[]> = {};

  for (const nivel of niveles.filter((n) => n.activo !== false)) {
    gradosPorNivel[nivel.nombre] = nivel.grados.map((g) => ({
      valor: gradoInstitucionalAValor(nivel.nombre, g.nombre),
      etiqueta: gradoEtiqueta(nivel.nombre, g.nombre),
      institucional: g.nombre,
    }));
    for (const g of nivel.grados) {
      const valor = gradoInstitucionalAValor(nivel.nombre, g.nombre);
      seccionesPorGrado[`${nivel.nombre}|${valor}`] = g.secciones.map((s) => s.nombre);
    }
  }

  return { gradosPorNivel, seccionesPorGrado };
}

export function eKey(a: number, c: number, b: number): string {
  return `${a}-${c}-${b}`;
}

export function calcPromedio(vals: NivelLogro[]): NivelLogro | null {
  if (!vals.length) return null;
  const avg = vals.reduce((s, n) => s + NIVEL_VAL[n], 0) / vals.length;
  return avg >= 3.5 ? 'AD' : avg >= 2.5 ? 'A' : avg >= 1.5 ? 'B' : 'C';
}
