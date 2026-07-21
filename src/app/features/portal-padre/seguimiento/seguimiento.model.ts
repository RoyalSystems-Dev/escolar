export interface HijoResumen {
  studentId: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  nivel: string;
  grado: string;
  seccion: string;
  aulaLabel: string;
  parentesco: string;
}

export interface CursoSeguimiento {
  curso: string;
  promedio: number | null;
  nivel: string | null;
  b1: number | null;
  b2: number | null;
  b3: number | null;
  b4: number | null;
  ultimasNotas: {
    id: number;
    descripcion: string;
    nota: number;
    fecha: string;
    bimestre: number;
    tipo: string;
  }[];
}

export interface AsistenciaSeguimiento {
  asistenciaPct: number;
  totalDias: number;
  presentes: number;
  faltas: number;
  tardanzas: number;
  justificadas: number;
  inasistenciasNetas: number;
  reciente: {
    id: number;
    fecha: string;
    estado: string;
    observacion?: string;
  }[];
}

export interface TareaSeguimiento {
  id: number;
  titulo: string;
  curso: string;
  fechaEntrega: string;
  estado: 'PENDING' | 'SUBMITTED' | 'OVERDUE' | 'GRADED';
  prioridad: 'alta' | 'media' | 'baja';
  comentarioEntrega?: string;
  archivoEntregaUrl?: string | null;
  archivoEntregaNombre?: string | null;
  archivoEntregaMime?: string | null;
  fechaEntregaReal?: string | null;
  nota?: number | null;
  retroalimentacion?: string;
  calificadoAt?: string | null;
}

export interface SeguimientoAcademico {
  estudiante: HijoResumen;
  promedioGeneral: number | null;
  nivelGeneral: string | null;
  asistencia: AsistenciaSeguimiento;
  tareasPendientes: number;
  tareasVencidas: number;
  tareasEntregadas: number;
  tareasCalificadas: number;
  cursos: CursoSeguimiento[];
  tareas: TareaSeguimiento[];
}

import { environment } from '@environments/environment';

export type SeguimientoVista = 'resumen' | 'notas' | 'asistencia' | 'tareas';

export const CURSO_STYLE: Record<string, { emoji: string; colorClass: string }> = {
  Matemática: { emoji: '🔢', colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  Comunicación: { emoji: '✍️', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  'Comprensión Lectora': { emoji: '📖', colorClass: 'bg-sky-100 text-sky-800 border-sky-200' },
  'Ciencia y Tecnología': { emoji: '🔬', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  Razonamiento: { emoji: '🧠', colorClass: 'bg-purple-100 text-purple-800 border-purple-200' },
};

export const DEFAULT_CURSO_STYLE = { emoji: '📚', colorClass: 'bg-gray-100 text-gray-800 border-gray-200' };

export function cursoStyle(curso: string) {
  return CURSO_STYLE[curso] ?? DEFAULT_CURSO_STYLE;
}

export function nivelBadge(nivel: string | null): string {
  const map: Record<string, string> = {
    AD: 'badge-indigo',
    A: 'badge-green',
    B: 'badge-yellow',
    C: 'badge-red',
  };
  return map[nivel ?? ''] ?? 'badge-gray';
}

export function notaColor(nota: number | null): string {
  if (nota === null) return 'text-gray-400';
  if (nota >= 14) return 'text-emerald-600';
  if (nota >= 11) return 'text-amber-600';
  return 'text-red-600';
}

export function estadoAsistenciaLabel(estado: string): string {
  return { P: 'Presente', F: 'Falta', T: 'Tardanza', J: 'Justificada' }[estado] ?? estado;
}

export function estadoAsistenciaBadge(estado: string): string {
  return { P: 'badge-green', F: 'badge-red', T: 'badge-yellow', J: 'badge-blue' }[estado] ?? 'badge-gray';
}

export function tareaEstadoLabel(estado: TareaSeguimiento['estado']): string {
  return { PENDING: 'Pendiente', SUBMITTED: 'Entregada', OVERDUE: 'Vencida', GRADED: 'Calificada' }[estado];
}

export function tareaEstadoBadge(estado: TareaSeguimiento['estado']): string {
  return { PENDING: 'badge-yellow', SUBMITTED: 'badge-green', OVERDUE: 'badge-red', GRADED: 'badge-indigo' }[estado];
}

export function taskFileUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function parentescoLabel(parentesco: string): string {
  const map: Record<string, string> = {
    padre: 'Padre',
    madre: 'Madre',
    tutor: 'Tutor',
    apoderado: 'Apoderado',
  };
  return map[parentesco] ?? parentesco;
}
