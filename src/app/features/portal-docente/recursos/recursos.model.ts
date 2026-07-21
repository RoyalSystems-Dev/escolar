import { ApiResource } from '../../../core/api/api.models';
import { environment } from '@environments/environment';

export type RecursoTipo = ApiResource['tipo'];

export interface CursoDocente {
  id: number;
  clave: string;
  nombre: string;
  gradoLabel: string;
  nivel: string;
  grado: string;
  seccion: string;
}

export interface RecursoItem extends ApiResource {
  cursoLabel: string;
  archivoUrl: string;
}

export interface RecursoFilters {
  curso?: string;
  tipo?: string;
  nivel?: string;
  grado?: string;
  seccion?: string;
  docente?: string;
}

export interface RecursoPayload {
  titulo: string;
  descripcion: string;
  tipo: RecursoTipo;
  courseId?: number;
  curso: string;
  nivel: string;
  grado: string;
  seccion: string;
  docente: string;
  fechaPublicacion: string;
  fechaEntrega?: string;
  url?: string;
  nombreArchivo?: string;
  mimeType?: string;
  tamanoBytes?: number;
  visible: boolean;
}

export interface RecursoUploadResponse {
  url: string;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
}

export const TIPOS_RECURSO: { value: RecursoTipo | ''; label: string; emoji: string }[] = [
  { value: '', label: 'Todos los tipos', emoji: '' },
  { value: 'documento', label: 'Documento (PDF/Word)', emoji: '📄' },
  { value: 'imagen', label: 'Imagen', emoji: '🖼️' },
  { value: 'video', label: 'Video', emoji: '🎬' },
  { value: 'enlace', label: 'Enlace web', emoji: '🔗' },
  { value: 'excel', label: 'Excel / hoja de cálculo', emoji: '📊' },
  { value: 'ppt', label: 'Presentación (PPT)', emoji: '📽️' },
  { value: 'tarea', label: 'Tarea', emoji: '📝' },
  { value: 'evaluacion', label: 'Evaluación', emoji: '📋' },
  { value: 'clase', label: 'Material de clase', emoji: '📖' },
  { value: 'lectura', label: 'Lectura', emoji: '📚' },
];

export const TIPOS_MODAL = TIPOS_RECURSO.filter((t) => t.value !== '');

export function tipoRecursoLabel(tipo: RecursoTipo): string {
  return TIPOS_RECURSO.find((t) => t.value === tipo)?.label ?? tipo;
}

export function tipoRecursoEmoji(tipo: RecursoTipo): string {
  return TIPOS_RECURSO.find((t) => t.value === tipo)?.emoji ?? '📎';
}

export function tipoRecursoBadge(tipo: RecursoTipo): string {
  const map: Record<RecursoTipo, string> = {
    tarea: 'badge-yellow',
    clase: 'badge-indigo',
    lectura: 'badge-blue',
    video: 'badge-purple',
    enlace: 'badge-cyan',
    evaluacion: 'badge-red',
    imagen: 'badge-pink',
    documento: 'badge-gray',
    excel: 'badge-green',
    ppt: 'badge-orange',
  };
  return map[tipo] ?? 'badge-gray';
}

export function tipoUsaArchivo(tipo: RecursoTipo): boolean {
  return !['enlace'].includes(tipo);
}

export function tipoUsaUrl(tipo: RecursoTipo): boolean {
  return tipo === 'enlace' || tipo === 'video';
}

export function acceptForTipo(tipo: RecursoTipo): string {
  const map: Record<string, string> = {
    imagen: 'image/jpeg,image/png,image/webp,image/gif',
    documento: '.pdf,.doc,.docx,.txt,application/pdf',
    excel: '.xls,.xlsx,.csv',
    ppt: '.ppt,.pptx',
    video: 'video/mp4,video/webm,.mp4,.webm',
    clase: '.pdf,.doc,.docx',
    lectura: '.pdf,.txt',
    tarea: '.pdf,.doc,.docx,.xls,.xlsx',
    evaluacion: '.pdf,.doc,.docx',
  };
  return map[tipo] ?? '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,video/*';
}

export function resourceFileUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
