export type PeriodoAcademicoTipo = 'bimestre' | 'trimestre' | 'semestre';
export type PeriodoAcademicoEstado = 'pendiente' | 'en_curso' | 'cerrado';

export interface PeriodoAcademicoItem {
  id: number;
  anioEscolar: number;
  numero: number;
  nombre: string;
  tipo: PeriodoAcademicoTipo;
  inicio: string;
  fin: string;
  actual: boolean;
  descripcion: string;
  activo: boolean;
  estado: PeriodoAcademicoEstado;
  inicioDisplay: string;
  finDisplay: string;
  duracionDias: number;
  duracionSemanas: number;
}

export interface PeriodoAcademicoPayload {
  anioEscolar: number;
  numero: number;
  nombre: string;
  tipo?: PeriodoAcademicoTipo;
  inicio: string;
  fin: string;
  actual?: boolean;
  descripcion?: string;
  activo?: boolean;
}

export const TIPOS_PERIODO: { value: PeriodoAcademicoTipo; label: string }[] = [
  { value: 'bimestre', label: 'Bimestre' },
  { value: 'trimestre', label: 'Trimestre' },
  { value: 'semestre', label: 'Semestre' },
];

export const ESTADO_PERIODO_CFG: Record<
  PeriodoAcademicoEstado,
  { label: string; badge: string; color: string }
> = {
  pendiente: { label: 'Pendiente', badge: 'badge-gray', color: 'text-gray-500' },
  en_curso: { label: 'En curso', badge: 'badge-green', color: 'text-green-600' },
  cerrado: { label: 'Cerrado', badge: 'badge-blue', color: 'text-blue-600' },
};
