export type MaestroConductaCategoria = 'falta' | 'reconocimiento';

export interface MaestroConductaDescripcionItem {
  id: number;
  tipoId: number;
  texto: string;
  orden: number;
  activo: boolean;
}

export interface MaestroConductaTipoItem {
  id: number;
  codigo: string;
  nombre: string;
  categoria: MaestroConductaCategoria;
  icon: string;
  orden: number;
  activo: boolean;
  descripciones: MaestroConductaDescripcionItem[];
}

export interface CreateMaestroConductaTipoPayload {
  codigo?: string;
  nombre: string;
  categoria: MaestroConductaCategoria;
  icon?: string;
  orden?: number;
}

export interface UpdateMaestroConductaTipoPayload {
  nombre?: string;
  categoria?: MaestroConductaCategoria;
  icon?: string;
  orden?: number;
  activo?: boolean;
}

export interface CreateMaestroConductaDescripcionPayload {
  texto: string;
  orden?: number;
}

export interface UpdateMaestroConductaDescripcionPayload {
  texto?: string;
  orden?: number;
  activo?: boolean;
}

export const CATEGORIA_CFG: Record<
  MaestroConductaCategoria,
  { label: string; badge: string; header: string }
> = {
  falta: {
    label: 'Falta',
    badge: 'badge-orange',
    header: 'bg-orange-50 text-orange-800',
  },
  reconocimiento: {
    label: 'Reconocimiento',
    badge: 'badge-green',
    header: 'bg-emerald-50 text-emerald-800',
  },
};
