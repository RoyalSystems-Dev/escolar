export interface FormulaComponenteItem {
  codigo: string;
  nombre: string;
  peso: number;
  orden: number;
  activo?: boolean;
}

export interface FormulaEscalaLogro {
  AD: number;
  A: number;
  B: number;
}

export interface MaestroFormulaEvaluacionItem {
  id: number;
  nombre: string;
  codigo: string;
  nivel: string;
  grado: string;
  curso: string;
  bimestre: number | null;
  componentes: FormulaComponenteItem[];
  escalaLogro: FormulaEscalaLogro;
  esDefault: boolean;
  orden: number;
  activo: boolean;
}

export interface CreateMaestroFormulaPayload {
  nombre: string;
  codigo?: string;
  nivel?: string;
  grado?: string;
  curso?: string;
  bimestre?: number;
  componentes: FormulaComponenteItem[];
  escalaLogro?: FormulaEscalaLogro;
  esDefault?: boolean;
  orden?: number;
  estado?: 'activo' | 'inactivo';
}

export type UpdateMaestroFormulaPayload = Partial<CreateMaestroFormulaPayload>;

export const COMPONENTES_SUGERIDOS: FormulaComponenteItem[] = [
  { codigo: 'examen_parcial', nombre: 'Examen Parcial', peso: 30, orden: 1, activo: true },
  { codigo: 'examen_final', nombre: 'Examen Final', peso: 40, orden: 2, activo: true },
  { codigo: 'trabajo_exposicion', nombre: 'Trabajo / Exposición', peso: 30, orden: 3, activo: true },
];

export const ESCALA_DEFAULT: FormulaEscalaLogro = { AD: 17.5, A: 14, B: 11 };

export function sumaPesos(componentes: FormulaComponenteItem[]): number {
  return componentes
    .filter(c => c.activo !== false)
    .reduce((sum, c) => sum + (Number(c.peso) || 0), 0);
}

export function slugCodigo(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}
