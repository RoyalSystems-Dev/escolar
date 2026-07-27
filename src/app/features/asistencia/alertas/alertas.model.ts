export interface AlertSettings {
  diasAlertaAusentismo: number;
  diasAlertaCritica: number;
}

export type NivelAlerta = 'normal' | 'alerta' | 'critico';

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
  totalRegistrosBd?: number;
  fechasInasistencia?: string[];
  apoderadoNotificado?: boolean;
  notificadoAt?: string | null;
  notificadoPor?: string | null;
}

export interface AlertasResumen {
  totalAlumnos: number;
  alumnosConFaltasInjustificadas: number;
  totalFaltasInjustificadas: number;
  totalRegistrosAsistencia: number;
  alumnosEnAlerta: number;
  alumnosEnCritico: number;
}

export interface AlertasResponse {
  settings: AlertSettings;
  alerts: AlertaAusentismo[];
  conFaltas: AlertaAusentismo[];
  resumen: AlertasResumen;
  mes: string | null;
  mesLabel: string | null;
}

export interface AlertaFilters {
  nivel?: string;
  grado?: string;
  mes?: string;
  busqueda?: string;
  soloCriticos?: boolean;
}
