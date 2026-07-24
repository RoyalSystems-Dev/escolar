import { ApiTask, ApiResource } from '../../../core/api/api.models';
import { environment } from '@environments/environment';

export type TareaEstado = ApiTask['estado'];
export type TareaPrioridad = ApiTask['prioridad'];
export type TareaVista = 'todas' | 'pendientes' | 'entregadas' | 'vencidas' | 'calificadas';

export interface TareaRecursoDocente {
  id: number;
  descripcion: string;
  tipo: ApiResource['tipo'];
  url: string;
  nombreArchivo: string;
  mimeType: string;
  tamanoBytes: number;
  docente: string;
}

export interface TareaEstudiante {
  id: number;
  titulo: string;
  curso: string;
  fechaEntrega: string;
  estado: TareaEstado;
  prioridad: TareaPrioridad;
  diasRestantes: number;
  venceHoy: boolean;
  vencida: boolean;
  resourceId: number | null;
  recurso: TareaRecursoDocente | null;
  comentarioEntrega: string;
  archivoEntregaUrl: string | null;
  archivoEntregaNombre: string | null;
  fechaEntregaReal: string | null;
  nota: number | null;
  retroalimentacion: string;
  calificadoAt: string | null;
}

export const CURSO_TAREA_STYLE: Record<string, { emoji: string; colorClass: string }> = {
  Matemática: { emoji: '🔢', colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  Comunicación: { emoji: '✍️', colorClass: 'bg-blue-100 text-blue-800 border-blue-200' },
  'Comprensión Lectora': { emoji: '📖', colorClass: 'bg-sky-100 text-sky-800 border-sky-200' },
  'Ciencia y Tecnología': { emoji: '🔬', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  Razonamiento: { emoji: '🧠', colorClass: 'bg-purple-100 text-purple-800 border-purple-200' },
};

export const DEFAULT_CURSO_STYLE = { emoji: '📚', colorClass: 'bg-gray-100 text-gray-800 border-gray-200' };

export function cursoStyle(curso: string) {
  return CURSO_TAREA_STYLE[curso] ?? DEFAULT_CURSO_STYLE;
}

export function estadoLabel(estado: TareaEstado): string {
  return {
    PENDING: 'Pendiente',
    SUBMITTED: 'Entregada',
    OVERDUE: 'Vencida',
    GRADED: 'Calificada',
  }[estado];
}

export function estadoBadge(estado: TareaEstado): string {
  return {
    PENDING: 'badge-yellow',
    SUBMITTED: 'badge-green',
    OVERDUE: 'badge-red',
    GRADED: 'badge-indigo',
  }[estado];
}

export function prioridadLabel(prioridad: TareaPrioridad): string {
  return { alta: 'Alta', media: 'Media', baja: 'Baja' }[prioridad];
}

export function prioridadBadge(prioridad: TareaPrioridad): string {
  return { alta: 'badge-red', media: 'badge-yellow', baja: 'badge-gray' }[prioridad];
}

export function diasRestantesLabel(dias: number, venceHoy: boolean, vencida: boolean): string {
  if (vencida) return `Vencida hace ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'}`;
  if (venceHoy) return 'Vence hoy';
  if (dias === 1) return 'Vence mañana';
  return `Faltan ${dias} días`;
}

export function taskFileUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function materialRecursoUrl(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  return taskFileUrl(raw);
}

export function materialRecursoNombre(
  nombreArchivo: string | null | undefined,
  url: string | null | undefined,
): string {
  const name = nombreArchivo?.trim();
  if (name) return name;
  const raw = url?.trim();
  if (!raw || raw.startsWith('http')) return '';
  const parts = raw.split('/');
  return decodeURIComponent(parts[parts.length - 1] ?? 'Archivo adjunto');
}

export const ACCEPT_ENTREGA =
  '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,image/jpeg,image/png,image/webp';

export const MAX_ENTREGA_BYTES = 10 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileIconForName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return 'picture_as_pdf';
  if (['doc', 'docx', 'txt'].includes(ext)) return 'description';
  if (['xls', 'xlsx'].includes(ext)) return 'table_chart';
  if (['ppt', 'pptx'].includes(ext)) return 'slideshow';
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';
  if (ext === 'zip') return 'folder_zip';
  return 'insert_drive_file';
}

export function fileAccentForName(name: string): { bg: string; text: string; border: string } {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf') return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' };
  if (['doc', 'docx', 'txt'].includes(ext)) return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' };
  if (['xls', 'xlsx'].includes(ext)) return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' };
  if (['ppt', 'pptx'].includes(ext)) return { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' };
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100' };
  if (ext === 'zip') return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' };
  return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100' };
}
