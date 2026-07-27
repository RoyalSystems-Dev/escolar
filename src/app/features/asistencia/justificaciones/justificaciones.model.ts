import { environment } from '@environments/environment';

export interface JustificacionAdjunto {
  url: string;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
}

export interface FaltaPendienteDetalle {
  id: number;
  fecha: string;
  fechaLabel: string;
  observacion?: string;
}

export interface PendienteJustificacion {
  studentId: number;
  estudiante: string;
  nivel: string;
  grado: string;
  seccion: string;
  faltasSinJustificar: number;
  faltasJustificadas: number;
  totalFaltas: number;
  ultimaFalta: string | null;
  faltasPendientes: FaltaPendienteDetalle[];
}

export interface JustificacionItem {
  id: number;
  studentId: number;
  estudiante: string;
  nivel: string;
  grado: string;
  seccion: string;
  cantidad: number;
  motivo: string;
  observacion: string;
  fechas: string[];
  attendanceIds?: number[];
  adjuntos?: JustificacionAdjunto[];
  registradoPor: string;
  fechaRegistro: string;
}

export interface CreateJustificacionPayload {
  studentId: number;
  cantidad: number;
  motivo: string;
  observacion?: string;
  registradoPor?: string;
  mes?: string;
  attendanceIds?: number[];
  adjuntos?: File[];
}

export function justificacionAdjuntoUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export interface JustificacionFilters {
  nivel?: string;
  grado?: string;
  mes?: string;
  busqueda?: string;
}

export const MOTIVOS_JUSTIFICACION = [
  'Enfermedad',
  'Cita médica',
  'Accidente',
  'Duelo familiar',
  'Viaje familiar',
  'Otro',
] as const;

export type MotivoJustificacion = (typeof MOTIVOS_JUSTIFICACION)[number];
