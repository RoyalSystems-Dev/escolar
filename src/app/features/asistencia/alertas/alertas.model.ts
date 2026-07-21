export interface AlertSettings {
  diasAlertaAusentismo: number;
  diasAlertaCritica: number;
}

export type NivelAlerta = 'alerta' | 'critico';

export interface AlertaAusentismo {
  studentId: number;
  estudiante: string;
  nivel: string;
  grado: string;
  seccion: string;
  faltasInjustificadas: number;
  faltasJustificadas: number;
  diasConsecutivos: number;
  ultimaFalta: string | null;
  nivelAlerta: NivelAlerta;
  motivoAlerta: string;
}

export interface AlertasResponse {
  settings: AlertSettings;
  alerts: AlertaAusentismo[];
}

export interface AlertaFilters {
  nivel?: string;
  grado?: string;
  mes?: string;
  busqueda?: string;
  soloCriticos?: boolean;
}

export const MESES_ALERTAS = [
  { value: '2026-06', label: 'Junio 2026' },
  { value: '2026-05', label: 'Mayo 2026' },
  { value: '', label: 'Todos los meses' },
];
