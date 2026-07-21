export type NivelMatricula = 'Inicial' | 'Primaria' | 'Secundaria';

export interface BulkMatriculaPayload {
  fila?: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email?: string;
  sexo?: 'M' | 'F';
  fechaNac?: string;
  nivel: NivelMatricula;
  grado: string;
  seccion: string;
  anioIngreso?: string;
  apoderadoNombres?: string;
  apoderadoApellidos?: string;
  apoderadoDni?: string;
  apoderadoTelefono?: string;
  apoderadoEmail?: string;
}

export interface FilaCargaMatricula extends BulkMatriculaPayload {
  fila: number;
  errores: string[];
  valido: boolean;
}

export interface BulkMatriculaErrorItem {
  fila: number;
  dni: string;
  email: string;
  mensaje: string;
}

export interface BulkImportMatriculaResult {
  total: number;
  creados: number;
  omitidos: number;
  errores: BulkMatriculaErrorItem[];
  erroresValidacion: BulkMatriculaErrorItem[];
  estudiantes: Array<{
    id: number;
    codigo: string;
    nombres: string;
    apellidos: string;
    dni: string;
    gradoLabel: string;
    seccion: string;
    email: string;
  }>;
}

export interface BulkImportMatriculaRequest {
  estudiantes: BulkMatriculaPayload[];
}

export interface BulkMatriculaPreviewItem {
  fila: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  sexo?: 'M' | 'F';
  fechaNac?: string;
  nivel: NivelMatricula;
  grado: string;
  seccion: string;
  anioIngreso?: string;
  apoderadoNombres?: string;
  apoderadoApellidos?: string;
  apoderadoDni?: string;
  apoderadoTelefono?: string;
  apoderadoEmail?: string;
  gradoLabel: string;
  motivo?: string;
}

export interface BulkMatriculaPreviewResult {
  total: number;
  listosCount: number;
  bloqueadosCount: number;
  listos: BulkMatriculaPreviewItem[];
  bloqueados: BulkMatriculaPreviewItem[];
}

export interface FilaPreviewMatricula extends BulkMatriculaPreviewItem {
  seleccionado: boolean;
}

export interface MasivaPreviewState {
  archivo: string;
  listos: FilaPreviewMatricula[];
  bloqueados: BulkMatriculaPreviewItem[];
  total: number;
}
