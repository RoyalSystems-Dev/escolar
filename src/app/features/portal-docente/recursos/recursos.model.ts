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

export interface RecursoUpdatePayload {
  titulo: string;
  descripcion: string;
  tipo: RecursoTipo;
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
    imagen:
      'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg',
    documento: '.pdf,.doc,.docx,.txt,application/pdf',
    excel: '.xls,.xlsx,.csv',
    ppt: '.ppt,.pptx',
    video: 'video/mp4,video/webm,.mp4,.webm',
    clase: '.pdf,.doc,.docx',
    lectura: '.pdf,.txt',
    tarea: '.pdf,.doc,.docx,.xls,.xlsx,application/pdf',
    evaluacion: '.pdf,.doc,.docx,application/pdf',
  };
  return map[tipo] ?? '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/*,video/*';
}

const EXTENSION_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mov: 'video/quicktime',
};

export function mimeFromFileName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_MIME[ext] ?? '';
}

export function validateFileForTipo(
  file: File,
  tipo: RecursoTipo,
): { ok: true } | { ok: false; message: string } {
  const maxBytes = 10 * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, message: 'El archivo supera el límite de 10 MB.' };
  }

  const inferred = (() => {
    const reported = file.type?.trim() ?? '';
    if (
      !reported ||
      reported === 'application/octet-stream' ||
      reported === 'binary/octet-stream'
    ) {
      return mimeFromFileName(file.name) || reported;
    }
    return reported;
  })();
  const allowed = acceptForTipo(tipo)
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  const mimeOk =
    allowed.some((rule) => {
      if (rule.startsWith('.')) return ext === rule;
      if (rule.endsWith('/*')) {
        const prefix = rule.slice(0, -1);
        return inferred.startsWith(prefix);
      }
      return inferred === rule;
    }) || !!mimeFromFileName(file.name);

  if (!mimeOk) {
    return {
      ok: false,
      message: `Este tipo de archivo no es válido para "${tipoRecursoLabel(tipo)}".`,
    };
  }

  return { ok: true };
}

/** Tipo de subida según el archivo (temario: material adjunto). */
export function uploadTipoForFile(file: File, fallback = 'clase'): string {
  if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)) {
    return 'imagen';
  }
  if (file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(file.name)) {
    return 'video';
  }
  if (/\.(xls|xlsx|csv)$/i.test(file.name)) return 'excel';
  if (/\.(ppt|pptx)$/i.test(file.name)) return 'ppt';
  return fallback;
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

export function coerceResourceVisible(value: unknown): boolean {
  if (value === true || value === 1 || value === '1' || value === 'true') return true;
  if (value === false || value === 0 || value === '0' || value === 'false') return false;
  return !!value;
}
