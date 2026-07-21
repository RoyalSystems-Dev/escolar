import { ApiTask } from '../../../core/api/api.models';



export function estadoEntregaLabel(estado: ApiTask['estado']): string {

  return {

    PENDING: 'Pendiente',

    SUBMITTED: 'Entregada',

    OVERDUE: 'Vencida',

    GRADED: 'Calificada',

  }[estado];

}



export function estadoEntregaBadge(estado: ApiTask['estado']): string {

  return {

    PENDING: 'badge-yellow',

    SUBMITTED: 'badge-green',

    OVERDUE: 'badge-red',

    GRADED: 'badge-indigo',

  }[estado];

}



export function alumnoNombreCompleto(task: Pick<ApiTask, 'studentApellido' | 'studentNombre' | 'studentId'>): string {

  const label = [task.studentApellido, task.studentNombre].filter(Boolean).join(', ').trim();

  return label || `Alumno #${task.studentId}`;

}



export function alumnoIniciales(task: Pick<ApiTask, 'studentApellido' | 'studentNombre' | 'studentId'>): string {

  const a = task.studentApellido?.trim()?.[0] ?? '';

  const n = task.studentNombre?.trim()?.[0] ?? '';

  const ini = `${a}${n}`.toUpperCase();

  return ini || '#';

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



export type EntregaPreviewTipo = 'pdf' | 'image' | 'other';



export function previewTipo(mime?: string | null, nombre?: string | null): EntregaPreviewTipo {

  const m = (mime ?? '').toLowerCase();

  const ext = (nombre ?? '').split('.').pop()?.toLowerCase() ?? '';

  if (m.includes('pdf') || ext === 'pdf') return 'pdf';

  if (m.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return 'image';

  return 'other';

}


