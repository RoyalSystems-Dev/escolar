export type PrioridadEspera = 'alta' | 'media' | 'baja';
export type EstadoEspera = 'en_espera' | 'notificado' | 'asignado' | 'cancelado';

export interface EsperaItem {
  id: number;
  estudiante: string;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  telefono: string;
  nivel: string;
  grado: string;
  seccionDeseada: string;
  prioridad: PrioridadEspera;
  estado: EstadoEspera;
  observacion: string;
  studentId: number | null;
  fechaSolicitud: string;
  notificadoAt: string | null;
  asignadoAt: string | null;
  vacantesDisponibles: number;
  vacantesEnSeccion: number | null;
  vacanteDisponible: boolean;
  seccionSugerida: string | null;
}

export interface CreateEsperaPayload {
  nombres: string;
  apellidos: string;
  dni: string;
  email?: string;
  telefono?: string;
  nivel: string;
  grado: string;
  seccionDeseada?: string;
  prioridad?: PrioridadEspera;
  observacion?: string;
}

export interface UpdateEsperaPayload {
  nombres?: string;
  apellidos?: string;
  email?: string;
  telefono?: string;
  nivel?: string;
  grado?: string;
  seccionDeseada?: string;
  prioridad?: PrioridadEspera;
  observacion?: string;
}

export interface AssignEsperaPayload {
  seccion?: string;
}

export interface AssignEsperaResult {
  entry: EsperaItem;
  seccionAsignada: string;
}

export const PRIORIDADES_ESPERA: { value: PrioridadEspera; label: string }[] = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Media' },
  { value: 'baja', label: 'Baja' },
];

export const ESTADOS_ESPERA: { value: EstadoEspera | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'en_espera', label: 'En espera' },
  { value: 'notificado', label: 'Notificado' },
  { value: 'asignado', label: 'Asignado' },
];
