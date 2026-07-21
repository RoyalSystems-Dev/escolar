export type NivelMaestroCurso = 'Inicial' | 'Primaria' | 'Secundaria';

export interface MaestroCursoItem {
  id: number;
  nombre: string;
  area: string;
  nivel: NivelMaestroCurso;
  grados: string[];
  horasSemanales: number;
  activo: boolean;
}

export interface CreateMaestroCursoPayload {
  nombre: string;
  area: string;
  nivel: NivelMaestroCurso;
  grados: string[];
  horasSemanales: number;
  activo?: boolean;
}

export interface UpdateMaestroCursoPayload {
  nombre?: string;
  area?: string;
  nivel?: NivelMaestroCurso;
  grados?: string[];
  horasSemanales?: number;
  activo?: boolean;
}

export interface MaestroCursosPage {
  items: MaestroCursoItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
