export type TipoConcepto = 'obligatorio' | 'voluntario' | 'eventual';
export type Periodicidad = 'mensual' | 'bimestral' | 'anual' | 'único';
export type NivelConcepto = 'Todos' | 'Inicial' | 'Primaria' | 'Secundaria';

export interface Concepto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  monto: number;
  tipo: TipoConcepto;
  periodicidad: Periodicidad;
  nivel: NivelConcepto;
  activo: boolean;
  creadoEl: string;
}

export interface ConceptoApi {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  monto: number;
  tipo: TipoConcepto;
  periodicidad: 'mensual' | 'bimestral' | 'anual' | 'unico';
  nivel: string;
  activo: boolean;
  creadoEl: string;
}

export interface CreateConceptoPayload {
  nombre: string;
  descripcion?: string;
  monto: number;
  tipo: TipoConcepto;
  periodicidad: Periodicidad;
  nivel?: NivelConcepto;
  activo?: boolean;
}

export interface UpdateConceptoPayload {
  nombre?: string;
  descripcion?: string;
  monto?: number;
  tipo?: TipoConcepto;
  periodicidad?: Periodicidad;
  nivel?: NivelConcepto;
  activo?: boolean;
}

export function mapConceptoFromApi(row: ConceptoApi): Concepto {
  return {
    ...row,
    periodicidad: row.periodicidad === 'unico' ? 'único' : row.periodicidad,
    nivel: row.nivel as NivelConcepto,
    monto: Number(row.monto),
  };
}

export function mapPeriodicidadToApi(
  periodicidad: Periodicidad,
): ConceptoApi['periodicidad'] {
  return periodicidad === 'único' ? 'unico' : periodicidad;
}
