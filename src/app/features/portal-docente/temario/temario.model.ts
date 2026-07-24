import {
  ApiModoLiberacionTemario,
  ApiTemarioClase,
  ApiTemarioClaseEstado,
  ApiTemarioImagenClase,
  ApiTemarioMaterialTipo,
} from '../../../core/api/api.models';
import { environment } from '@environments/environment';

export type TemarioClaseEstado = ApiTemarioClaseEstado;
export type TemarioClaseItem = ApiTemarioClase;
export type ModoLiberacionTemario = ApiModoLiberacionTemario;
export type TemarioMaterialTipo = ApiTemarioMaterialTipo;
export type TemarioImagenClase = ApiTemarioImagenClase;

export interface TemarioImagenFormItem {
  url: string;
  nombre: string;
  leyenda: string;
  preview?: string;
  pendingFile?: File;
}

export interface TemarioClasePayload {
  cursoId: number;
  cursoNombre: string;
  nivel: string;
  grado: string;
  seccion: string;
  anioEscolar: number;
  assignmentId?: number;
  numero: number;
  titulo: string;
  descripcion?: string;
  objetivos?: string;
  contenidoClase?: string;
  imagenesClase?: TemarioImagenClasePayload[];
  fechaClase: string;
  estado?: TemarioClaseEstado;
  visibleEstudiante?: boolean;
  modoLiberacion?: ModoLiberacionTemario;
  fechaLiberacion?: string | null;
  horaLiberacion?: string;
  diasAntesLiberacion?: number | null;
  materialTitulo?: string;
  materialDescripcion?: string;
  materialTipo?: TemarioMaterialTipo;
  materialUrl?: string;
  materialNombreArchivo?: string;
  materialMimeType?: string;
}

export interface TemarioClaseUpdatePayload {
  numero?: number;
  titulo?: string;
  descripcion?: string;
  objetivos?: string;
  contenidoClase?: string;
  imagenesClase?: TemarioImagenClasePayload[];
  fechaClase?: string;
  estado?: TemarioClaseEstado;
  visibleEstudiante?: boolean;
  modoLiberacion?: ModoLiberacionTemario;
  fechaLiberacion?: string | null;
  horaLiberacion?: string;
  diasAntesLiberacion?: number | null;
  materialTitulo?: string;
  materialDescripcion?: string;
  materialTipo?: TemarioMaterialTipo;
  materialUrl?: string;
  materialNombreArchivo?: string;
  materialMimeType?: string;
}

export const ESTADOS_TEMARIO: { value: TemarioClaseEstado; label: string }[] = [
  { value: 'programada', label: 'Programada' },
  { value: 'dictada', label: 'Dictada' },
  { value: 'reprogramada', label: 'Reprogramada' },
  { value: 'cancelada', label: 'Cancelada' },
];

export const MODOS_LIBERACION: { value: ModoLiberacionTemario; label: string; hint: string }[] = [
  { value: 'oculto', label: 'Oculto', hint: 'Los alumnos no verán este tema' },
  { value: 'inmediato', label: 'Liberar ahora', hint: 'Visible de inmediato para alumnos' },
  { value: 'dias_antes', label: 'Días antes de la clase', hint: 'Se publica X días antes, a la hora indicada' },
  { value: 'programada', label: 'Fecha y hora específicas', hint: 'Elige cuándo se publicará para los alumnos' },
];

export const TIPOS_MATERIAL_TEMARIO: { value: TemarioMaterialTipo; label: string }[] = [
  { value: 'texto', label: 'Texto / indicaciones' },
  { value: 'documento', label: 'Documento / PDF' },
  { value: 'enlace', label: 'Enlace web' },
  { value: 'video', label: 'Video' },
];

export function estadoTemarioBadge(estado: TemarioClaseEstado): string {
  if (estado === 'dictada') return 'badge-green';
  if (estado === 'programada') return 'badge-indigo';
  if (estado === 'reprogramada') return 'badge-amber';
  return 'badge-red';
}

export function estadoTemarioLabel(estado: TemarioClaseEstado): string {
  return ESTADOS_TEMARIO.find((e) => e.value === estado)?.label ?? estado;
}

export function liberacionTemarioBadge(c: Pick<TemarioClaseItem, 'modoLiberacion' | 'liberadoAlumno'>): string {
  if (c.modoLiberacion === 'oculto') return 'badge-gray';
  if (c.liberadoAlumno) return 'badge-green';
  return 'badge-amber';
}

export function temarioMaterialUrl(c: Pick<TemarioClaseItem, 'materialUrl' | 'materialUrlDisplay'>): string {
  return temarioAssetUrl(c.materialUrlDisplay || c.materialUrl);
}

export function temarioAssetUrl(raw?: string): string {
  const path = (raw ?? '').trim();
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function temarioImagenUrl(img: Pick<TemarioImagenClase, 'url' | 'urlDisplay'>): string {
  return temarioAssetUrl(img.urlDisplay || img.url);
}

export function resumenClase(c: Pick<TemarioClaseItem, 'contenidoClase' | 'descripcion'>, max = 140): string {
  const texto = (c.contenidoClase || c.descripcion || '').trim();
  if (!texto) return '';
  if (texto.length <= max) return texto;
  return `${texto.slice(0, max).trim()}…`;
}

export function tieneContenidoClase(
  c: Pick<TemarioClaseItem, 'contenidoClase' | 'imagenesClase' | 'descripcion' | 'objetivos'>,
): boolean {
  return !!(
    c.contenidoClase?.trim() ||
    c.descripcion?.trim() ||
    c.objetivos?.trim() ||
    (c.imagenesClase?.length ?? 0) > 0
  );
}

export function tieneMaterialTemario(c: Pick<TemarioClaseItem, 'tieneMaterial' | 'materialTitulo' | 'materialDescripcion' | 'materialUrl'>): boolean {
  return !!(
    c.tieneMaterial ||
    c.materialTitulo?.trim() ||
    c.materialDescripcion?.trim() ||
    c.materialUrl?.trim()
  );
}

export function materialTemarioLabel(tipo: TemarioMaterialTipo): string {
  return TIPOS_MATERIAL_TEMARIO.find((t) => t.value === tipo)?.label ?? tipo;
}

/** Formatos admitidos al adjuntar imágenes en crear/editar clase. */
export const IMAGENES_CLASE_ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/svg+xml,.jpg,.jpeg,.png,.webp,.gif,.bmp,.svg';

const IMAGENES_CLASE_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif',
  '.bmp',
  '.svg',
]);

export function esImagenClasePermitida(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  const dot = file.name.lastIndexOf('.');
  if (dot < 0) return false;
  return IMAGENES_CLASE_EXT.has(file.name.slice(dot).toLowerCase());
}

/** Solo campos aceptados por el API al guardar imágenes de clase. */
export interface TemarioImagenClasePayload {
  url: string;
  nombre: string;
  leyenda?: string;
}

export function toImagenesClasePayload(
  items: Array<Partial<TemarioImagenFormItem> & { urlDisplay?: string }>,
): TemarioImagenClasePayload[] {
  return items
    .filter((img) => img.url?.trim())
    .map((img) => ({
      url: img.url!.trim(),
      nombre: img.nombre?.trim() || 'Imagen',
      leyenda: img.leyenda?.trim() ?? '',
    }));
}
