export type MaestroFeriadoTipo = 'nacional' | 'local' | 'institucional';

export interface MaestroFeriadoItem {
  id: number;
  anioEscolar: number;
  fecha: string;
  nombre: string;
  tipo: MaestroFeriadoTipo;
  descripcion: string;
  activo: boolean;
}

export interface CreateMaestroFeriadoPayload {
  anioEscolar: number;
  fecha: string;
  nombre: string;
  tipo?: MaestroFeriadoTipo;
  descripcion?: string;
  activo?: boolean;
}

export interface UpdateMaestroFeriadoPayload {
  anioEscolar?: number;
  fecha?: string;
  nombre?: string;
  tipo?: MaestroFeriadoTipo;
  descripcion?: string;
  activo?: boolean;
}

export interface DiasClaseResumen {
  anioEscolar: number;
  desde: string;
  hasta: string;
  diasLaborables: number;
  feriadosEnRango: Array<{ fecha: string; nombre: string; tipo: string }>;
  diasClase: number;
}

export const TIPO_FERIADO_CFG: Record<
  MaestroFeriadoTipo,
  { label: string; badge: string }
> = {
  nacional: { label: 'Nacional', badge: 'badge-red' },
  local: { label: 'Local', badge: 'badge-yellow' },
  institucional: { label: 'Institucional', badge: 'badge-indigo' },
};
