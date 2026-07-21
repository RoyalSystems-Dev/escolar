export type Situacion = 'promovido' | 'repitente' | 'retirado' | 'egresado';
export type EstadoApro = 'pendiente' | 'aprobado' | 'rechazado';

export type NivelFiltro = 'todos' | 'inicial' | 'primaria' | 'secundaria';
export type SituacionFiltro = 'todos' | Situacion;

export interface EstCont {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  dni: string;
  sexo: 'M' | 'F';
  nivel: string;
  gradoActual: string;
  seccionActual: string;
  promedioFinal: number;
  situacion: Situacion;
  gradoPropuesto: string;
  seccionPropuesta: string;
  vacantesDisponibles?: number;
  aforoSalon?: number;
  generado: boolean;
  seleccionado: boolean;
}

export interface RegistroCont {
  id: number;
  estudianteId: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  gradoAnterior: string;
  seccionAnterior: string;
  gradoNuevo: string;
  seccionNueva: string;
  promedioFinal: number;
  situacion: Situacion;
  anioAnterior: number;
  anioNuevo: number;
  fechaGeneracion: string;
  generadoPor: string;
  estado: EstadoApro;
  vacantesDisponibles?: number;
  aforoSalon?: number;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
}

export interface GenerateContinuityRequest {
  anioOrigen: number;
  anioNuevo: number;
  generadoPor?: string;
  items: Array<{
    studentId: number;
    situacion?: Situacion;
    seccionNueva?: string;
  }>;
}

export interface GenerateContinuityResult {
  created: RegistroCont[];
  createdCount: number;
  skippedCount: number;
  skippedStudentIds: number[];
}

export interface ApproveAllResult {
  approvedCount: number;
  items: RegistroCont[];
}

const PROGRESION: Record<string, string> = {
  '1° Inicial': '2° Inicial',
  '2° Inicial': '3° Inicial',
  '3° Inicial': '1° Primaria',
  '1° Primaria': '2° Primaria',
  '2° Primaria': '3° Primaria',
  '3° Primaria': '4° Primaria',
  '4° Primaria': '5° Primaria',
  '5° Primaria': '6° Primaria',
  '6° Primaria': '1° Secundaria',
  '1° Secundaria': '2° Secundaria',
  '2° Secundaria': '3° Secundaria',
  '3° Secundaria': '4° Secundaria',
  '4° Secundaria': '5° Secundaria',
  '5° Secundaria': 'Egresado',
};

export function gradoSig(grado: string, sit: Situacion): string {
  if (sit === 'egresado') return 'Egresado';
  if (sit === 'retirado') return '—';
  if (sit === 'repitente') return grado;
  return PROGRESION[grado] ?? '—';
}

export function sitLabel(s: Situacion): string {
  return {
    promovido: 'Promovido',
    repitente: 'Repitente',
    retirado: 'Retirado',
    egresado: 'Egresado',
  }[s];
}

export function sitBadgeClass(s: Situacion): string {
  return {
    promovido: 'badge-green',
    repitente: 'badge-yellow',
    retirado: 'badge-red',
    egresado: 'badge-indigo',
  }[s];
}

/** Normaliza nivel educativo para filtros (inicial | primaria | secundaria). */
export function normalizeNivel(nivel: string, gradoLabel = ''): string {
  const fuente = `${nivel} ${gradoLabel}`.toLowerCase();
  if (fuente.includes('inicial')) return 'inicial';
  if (fuente.includes('secundaria')) return 'secundaria';
  if (fuente.includes('primaria')) return 'primaria';
  return '';
}

export function matchBusqueda(
  q: string,
  campos: { nombres: string; apellidos: string; codigo: string; dni?: string },
): boolean {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  const texto = `${campos.nombres} ${campos.apellidos} ${campos.codigo} ${campos.dni ?? ''}`.toLowerCase();
  return texto.includes(term);
}

export function matchNivelFiltro(nivelClave: string, filtro: string): boolean {
  if (filtro === 'todos') return true;
  return nivelClave === filtro;
}

export function matchSituacionFiltro(situacion: Situacion, filtro: string): boolean {
  if (filtro === 'todos') return true;
  return situacion === filtro;
}

export function filtrosActivos(
  busqueda: string,
  nivel: string,
  situacion: string,
): boolean {
  return !!busqueda.trim() || nivel !== 'todos' || situacion !== 'todos';
}

export function filtraEstudiante(
  e: EstCont,
  busqueda: string,
  nivel: string,
  situacion: string,
): boolean {
  if (!matchBusqueda(busqueda, e)) return false;
  const nivelClave = e.nivel || normalizeNivel('', e.gradoActual);
  if (!matchNivelFiltro(nivelClave, nivel)) return false;
  if (!matchSituacionFiltro(e.situacion, situacion)) return false;
  return true;
}

export function filtraRegistro(
  r: RegistroCont,
  busqueda: string,
  nivel: string,
  situacion: string,
): boolean {
  if (!matchBusqueda(busqueda, r)) return false;
  const nivelClave = normalizeNivel('', r.gradoAnterior);
  if (!matchNivelFiltro(nivelClave, nivel)) return false;
  if (!matchSituacionFiltro(r.situacion, situacion)) return false;
  return true;
}
