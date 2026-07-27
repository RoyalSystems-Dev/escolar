export interface BulkHistorialPayload {
  fila?: number;
  nombres?: string;
  apellidos?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  dni?: string;
  codigo?: string;
  email?: string;
  nivel?: string;
  anio: string;
  grado: string;
  seccion: string;
  promedio: number;
  estado?: string;
}

export interface BulkHistorialErrorItem {
  fila: number;
  dni: string;
  email: string;
  mensaje: string;
}

export interface HistorialRegistroAnterior {
  grado: string;
  seccion: string;
  promedio: number;
  estado: string;
}

export type HistorialAccionPrevista = 'creado' | 'actualizado' | 'sin_cambios';

export interface BulkHistorialPreviewItem {
  fila: number;
  nombres: string;
  apellidos: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  dni: string;
  codigo: string;
  email: string;
  nivel: string;
  anio: string;
  grado: string;
  seccion: string;
  promedio: number;
  estado: string;
  yaRegistrado: boolean;
  accionPrevista: HistorialAccionPrevista;
  registroAnterior?: HistorialRegistroAnterior;
  motivo?: string;
}

export interface BulkHistorialPreviewResult {
  total: number;
  listosCount: number;
  bloqueadosCount: number;
  nuevosCount: number;
  actualizadosCount: number;
  sinCambiosCount: number;
  listos: BulkHistorialPreviewItem[];
  bloqueados: BulkHistorialPreviewItem[];
}

export interface BulkImportHistorialResult {
  total: number;
  importados: number;
  creados: number;
  actualizados: number;
  sinCambios: number;
  omitidos: number;
  errores: BulkHistorialErrorItem[];
  erroresValidacion: BulkHistorialErrorItem[];
  filas: Array<{
    studentId: number;
    codigo: string;
    nombres: string;
    apellidos: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    dni: string;
    email: string;
    nivel: string;
    anio: string;
    grado: string;
    seccion: string;
    promedio: number;
    estado: string;
    accion: HistorialAccionPrevista;
  }>;
}

export interface BulkImportHistorialRequest {
  filas: BulkHistorialPayload[];
}

export interface FilaPreviewHistorial extends BulkHistorialPreviewItem {
  seleccionado: boolean;
}

export interface HistorialPreviewState {
  archivo: string;
  total: number;
  nuevosCount: number;
  actualizadosCount: number;
  sinCambiosCount: number;
  listos: FilaPreviewHistorial[];
  bloqueados: BulkHistorialPreviewItem[];
}

export function labelAccionHistorial(accion: HistorialAccionPrevista): string {
  if (accion === 'creado') return 'Nuevo';
  if (accion === 'actualizado') return 'Actualizar';
  return 'Ya registrado';
}

export function claseAccionHistorial(accion: HistorialAccionPrevista): string {
  if (accion === 'creado') return 'badge-success';
  if (accion === 'actualizado') return 'badge-info';
  return 'badge-warning';
}
