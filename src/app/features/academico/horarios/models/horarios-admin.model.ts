export type NivelHorario = 'Inicial' | 'Primaria' | 'Secundaria';
export type HorarioTab = 'horario' | 'gestion' | 'conflictos';
export type ConflictoTipo = 'docente_solapado' | 'asignacion_invalida';

export interface PeriodoHorario {
  id: number;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  isReceso: boolean;
  niveles: NivelHorario[];
}

export interface CursoHorario {
  id: number;
  nombre: string;
  area: string;
  nivel: NivelHorario;
  colorClass: string;
  dotClass: string;
}

export interface DocenteHorario {
  id: number;
  apellidos: string;
  nombres: string;
  abrev: string;
}

export interface EntradaHorario {
  id: number;
  nivel: NivelHorario;
  grado: string;
  seccion: string;
  dia: number;
  periodoId: number;
  cursoId: number;
  docenteId: number;
}

export interface SalonHorario {
  nivel: NivelHorario;
  grado: string;
  seccion: string;
}

export interface ConflictoHorario {
  key: string;
  tipo: ConflictoTipo;
  dia: number;
  periodoId: number;
  docenteId: number;
  docNombre: string;
  entradas: EntradaHorario[];
}

export interface GestionClaseHorario {
  nivel: NivelHorario;
  grado: string;
  seccion: string;
  key: string;
  totalSlots: number;
  filled: number;
  estado: 'completo' | 'en_progreso' | 'sin_horario';
}

export interface HorarioContext {
  anioEscolar: number;
  periodos: PeriodoHorario[];
  salones: SalonHorario[];
  cursos: Array<{ id: number; nombre: string; area: string; nivel: NivelHorario }>;
  docentes: DocenteHorario[];
  blocks: EntradaHorario[];
  conflictos: ConflictoHorario[];
  gestion: {
    conHorario: number;
    enProgreso: number;
    sinHorario: number;
    clases: GestionClaseHorario[];
  };
}

export interface CreateHorarioBlockPayload {
  anioEscolar: number;
  nivel: NivelHorario;
  grado: string;
  seccion: string;
  dia: number;
  periodoId: number;
  cursoId: number;
  docenteId: number;
}

export interface UpdateHorarioBlockPayload {
  cursoId?: number;
  docenteId?: number;
}

export interface ResolveConflictsPayload {
  keepBlockId: number;
  removeBlockIds: number[];
}

const AREA_COLORS: Record<string, { colorClass: string; dotClass: string }> = {
  Matemática: {
    colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dotClass: 'bg-indigo-500',
  },
  Comunicación: {
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
    dotClass: 'bg-blue-500',
  },
  'C y T': {
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dotClass: 'bg-emerald-500',
  },
  'Ciencias Soc.': {
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  'CCSS e Historia': {
    colorClass: 'bg-amber-100 text-amber-800 border-amber-200',
    dotClass: 'bg-amber-500',
  },
  Arte: {
    colorClass: 'bg-pink-100 text-pink-800 border-pink-200',
    dotClass: 'bg-pink-500',
  },
  'Ed. Física': {
    colorClass: 'bg-lime-100 text-lime-800 border-lime-200',
    dotClass: 'bg-lime-500',
  },
  'Personal Social': {
    colorClass: 'bg-green-100 text-green-800 border-green-200',
    dotClass: 'bg-green-500',
  },
  Inglés: {
    colorClass: 'bg-sky-100 text-sky-800 border-sky-200',
    dotClass: 'bg-sky-500',
  },
  'Ed. Religiosa': {
    colorClass: 'bg-violet-100 text-violet-800 border-violet-200',
    dotClass: 'bg-violet-500',
  },
  DPCC: {
    colorClass: 'bg-teal-100 text-teal-800 border-teal-200',
    dotClass: 'bg-teal-500',
  },
  Tutoría: {
    colorClass: 'bg-gray-100 text-gray-700 border-gray-300',
    dotClass: 'bg-gray-500',
  },
};

const DEFAULT_COLOR = {
  colorClass: 'bg-gray-100 text-gray-700 border-gray-300',
  dotClass: 'bg-gray-500',
};

export function enrichCursoHorario(
  c: { id: number; nombre: string; area: string; nivel: NivelHorario },
): CursoHorario {
  const palette = AREA_COLORS[c.area] ?? DEFAULT_COLOR;
  return { ...c, ...palette };
}

const NIVEL_ALIASES: Record<string, NivelHorario> = {
  inicial: 'Inicial',
  primaria: 'Primaria',
  secundaria: 'Secundaria',
};

export function normalizeNivel(value: string): NivelHorario {
  const trimmed = value?.trim() ?? '';
  return NIVEL_ALIASES[trimmed.toLowerCase()] ?? (trimmed as NivelHorario);
}

export function normalizeGrado(value: string): string {
  const trimmed = value?.trim() ?? '';
  if (/^\d+$/.test(trimmed)) return `${trimmed}°`;
  return trimmed;
}

export function normalizeSeccion(value: string): string {
  return (value?.trim() ?? '').toUpperCase();
}

export function mapHorarioContext(ctx: HorarioContext): {
  periodos: PeriodoHorario[];
  cursos: CursoHorario[];
  docentes: DocenteHorario[];
  blocks: EntradaHorario[];
  salones: SalonHorario[];
  conflictos: ConflictoHorario[];
  gestion: HorarioContext['gestion'];
} {
  return {
    periodos: ctx.periodos.map((p) => ({
      ...p,
      niveles: p.niveles as NivelHorario[],
    })),
    cursos: ctx.cursos.map(enrichCursoHorario),
    docentes: ctx.docentes,
    blocks: ctx.blocks.map((b) => ({
      ...b,
      nivel: normalizeNivel(b.nivel),
      grado: normalizeGrado(b.grado),
      seccion: normalizeSeccion(b.seccion),
    })),
    salones: ctx.salones.map((s) => ({
      ...s,
      nivel: normalizeNivel(s.nivel),
      grado: normalizeGrado(s.grado),
      seccion: normalizeSeccion(s.seccion),
    })),
    conflictos: ctx.conflictos.map((c) => ({
      ...c,
      entradas: c.entradas.map((e) => ({
        ...e,
        nivel: normalizeNivel(e.nivel),
        grado: normalizeGrado(e.grado),
        seccion: normalizeSeccion(e.seccion),
      })),
    })),
    gestion: {
      ...ctx.gestion,
      clases: ctx.gestion.clases.map((cl) => ({
        ...cl,
        nivel: normalizeNivel(cl.nivel),
        grado: normalizeGrado(cl.grado),
        seccion: normalizeSeccion(cl.seccion),
        key: `${normalizeNivel(cl.nivel)}-${normalizeGrado(cl.grado)}-${normalizeSeccion(cl.seccion)}`,
      })),
    },
  };
}
