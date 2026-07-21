export type TipoIncidente = string;

export type EstadoIncidente = 'pendiente' | 'en_proceso' | 'resuelto';
export type NivelConducta = 'excelente' | 'bueno' | 'regular' | 'deficiente';

export interface Incidente {
  id: number;
  alumnoId: number;
  alumno: string;
  grado: string;
  seccion: string;
  tipo: TipoIncidente;
  descripcion: string;
  fecha: string;
  fechaIso?: string;
  lugar: string;
  reportadoPor: string;
  estado: EstadoIncidente;
  medida: string;
  notificadoPadre: boolean;
  observaciones: string;
}

export interface AlumnoConducta {
  id: number;
  nombre: string;
  grado: string;
  seccion: string;
}

export interface ResumenAlumno {
  alumnoId: number;
  alumno: string;
  grado: string;
  seccion: string;
  leves: number;
  graves: number;
  muyGraves: number;
  reconocimientos: number;
  nivel: NivelConducta;
}

export interface ConductIncidentPayload {
  studentId: number;
  tipo: TipoIncidente;
  descripcion: string;
  fecha: string;
  lugar?: string;
  reportadoPor?: string;
  estado?: EstadoIncidente;
  medida?: string;
  notificadoPadre?: boolean;
  observaciones?: string;
}

export interface ConductIncidentFilters {
  studentId?: number;
  grado?: string;
  seccion?: string;
  tipo?: string;
  estado?: string;
  busqueda?: string;
  nivel?: string;
  page?: number;
  pageSize?: number;
  resumenPage?: number;
  resumenPageSize?: number;
}

export interface ConductKpis {
  total: number;
  leves: number;
  graves: number;
  muyGraves: number;
  reconocimientos: number;
}

export interface ConductIncidentsPage {
  items: Incidente[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  kpis: ConductKpis;
  resumen: ResumenAlumno[];
  resumenTotal: number;
  resumenPage: number;
  resumenPageSize: number;
  resumenTotalPages: number;
  grados: string[];
}

export const TIPO_CFG: Record<
  TipoIncidente,
  { badge: string; label: string; icon: string; color: string }
> = {
  falta_leve: {
    badge: 'badge-yellow',
    label: 'Falta Leve',
    icon: 'warning',
    color: 'text-yellow-500',
  },
  falta_grave: {
    badge: 'badge-orange',
    label: 'Falta Grave',
    icon: 'report',
    color: 'text-orange-500',
  },
  falta_muy_grave: {
    badge: 'badge-red',
    label: 'Falta Muy Grave',
    icon: 'gpp_bad',
    color: 'text-red-500',
  },
  reconocimiento: {
    badge: 'badge-green',
    label: 'Reconocimiento',
    icon: 'emoji_events',
    color: 'text-emerald-500',
  },
};

export const ESTADO_CFG: Record<EstadoIncidente, { badge: string; label: string }> = {
  pendiente: { badge: 'badge-yellow', label: 'Pendiente' },
  en_proceso: { badge: 'badge-blue', label: 'En Proceso' },
  resuelto: { badge: 'badge-green', label: 'Resuelto' },
};

export const NIVEL_CFG: Record<NivelConducta, { badge: string; label: string; bar: string }> = {
  excelente: { badge: 'badge-green', label: 'Excelente', bar: 'bg-emerald-500' },
  bueno: { badge: 'badge-blue', label: 'Bueno', bar: 'bg-blue-500' },
  regular: { badge: 'badge-yellow', label: 'Regular', bar: 'bg-amber-500' },
  deficiente: { badge: 'badge-red', label: 'Deficiente', bar: 'bg-red-500' },
};

export const LUGARES = [
  'Salón de clase',
  'Patio',
  'Pasadizo',
  'Laboratorio',
  'Biblioteca',
  'Comedor',
  'Cancha deportiva',
];


export const MEDIDAS: Record<string, string[]> = {
  falta_leve: [
    'Llamada de atención verbal',
    'Anotación en anecdotario',
    'Citación al padre de familia',
  ],
  falta_grave: [
    'Suspensión de 1 día',
    'Carta de compromiso firmada',
    'Derivación a psicología',
  ],
  falta_muy_grave: [
    'Suspensión de 3 días',
    'Intervención del CONEI',
    'Proceso disciplinario formal',
  ],
  reconocimiento: [
    'Diploma de reconocimiento',
    'Mención en acto cívico',
    'Carta de felicitación',
  ],
};

export function calcNivel(inc: Incidente[]): NivelConducta {
  const mg = inc.filter((i) => i.tipo === 'falta_muy_grave').length;
  const g = inc.filter((i) => i.tipo === 'falta_grave').length;
  const l = inc.filter((i) => i.tipo === 'falta_leve').length;
  const r = inc.filter((i) => i.tipo === 'reconocimiento').length;
  if (mg > 0 || g >= 3) return 'deficiente';
  if (g >= 1 || l >= 3) return 'regular';
  if (r >= 2 && l === 0) return 'excelente';
  return 'bueno';
}

export function formatFechaHoy(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

export function toFechaInput(fecha: string): string {
  if (!fecha) return formatFechaHoy();
  if (fecha.includes('/')) return fecha;
  const [y, m, d] = fecha.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

export function mapIncidenteFromApi(item: Incidente): Incidente {
  return {
    ...item,
    fecha: item.fecha || toFechaInput(item.fechaIso ?? ''),
  };
}

export function mapAlumnoFromExpediente(exp: {
  id: number;
  nombres: string;
  apellidos: string;
  grado: string;
  seccion: string;
}): AlumnoConducta {
  return {
    id: exp.id,
    nombre: `${exp.nombres} ${exp.apellidos}`.trim(),
    grado: exp.grado.replace(/\s+(Primaria|Secundaria|Inicial)$/i, '').trim() || exp.grado,
    seccion: exp.seccion,
  };
}
