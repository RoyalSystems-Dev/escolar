export interface PendienteJustificacion {
  studentId: number;
  estudiante: string;
  nivel: string;
  grado: string;
  seccion: string;
  faltasSinJustificar: number;
  faltasJustificadas: number;
  totalFaltas: number;
  ultimaFalta: string | null;
}

export interface JustificacionItem {
  id: number;
  studentId: number;
  estudiante: string;
  nivel: string;
  grado: string;
  seccion: string;
  cantidad: number;
  motivo: string;
  observacion: string;
  fechas: string[];
  registradoPor: string;
  fechaRegistro: string;
}

export interface CreateJustificacionPayload {
  studentId: number;
  cantidad: number;
  motivo: string;
  observacion?: string;
  registradoPor?: string;
}

export interface JustificacionFilters {
  nivel?: string;
  grado?: string;
  mes?: string;
  busqueda?: string;
}

export const MOTIVOS_JUSTIFICACION = [
  'Enfermedad',
  'Cita médica',
  'Accidente',
  'Duelo familiar',
  'Viaje familiar',
  'Otro',
] as const;

export type MotivoJustificacion = (typeof MOTIVOS_JUSTIFICACION)[number];

export const MESES_OPCIONES = [
  { value: '2026-06', label: 'Junio 2026' },
  { value: '2026-05', label: 'Mayo 2026' },
  { value: '', label: 'Todos los meses' },
];
