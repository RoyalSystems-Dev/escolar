export type EstadoAsistenciaControl = 'P' | 'F' | 'T' | 'J';
export type NivelAlertaControl = 'normal' | 'alerta' | 'critico';

export interface ControlReportDiaEscolar {
  fecha: string;
  label: string;
  diaSemana: string;
  esHoy: boolean;
  esFuturo: boolean;
}

export interface ControlReportAlumno {
  studentId: number;
  nombres: string;
  apellidos: string;
  nombreCompleto: string;
  dni: string;
  nivel: string;
  grado: string;
  seccion: string;
  gradoLabel: string;
  faltas: number;
  faltasInjustificadas: number;
  tardanzas: number;
  justificadas: number;
  presentes: number;
  totalRegistrado: number;
  totalDiasClase: number;
  asistenciaPct: number;
  ultimaFalta: string | null;
  nivelAlerta: NivelAlertaControl;
  calendario: Record<string, EstadoAsistenciaControl | null>;
}

export interface ControlReportResponse {
  mes: string;
  mesLabel: string;
  fechaHoy: string;
  nivel: string | null;
  grado: string | null;
  seccion: string | null;
  diasEscolares: ControlReportDiaEscolar[];
  alumnos: ControlReportAlumno[];
  resumenPorDia: Record<string, { F: number; T: number; J: number }>;
  kpis: {
    totalAlumnos: number;
    conFaltas: number;
    totalFaltas: number;
    totalTardanzas: number;
    alerta: number;
    critico: number;
  };
  alertSettings: {
    diasAlertaAusentismo: number;
    diasAlertaCritica: number;
  };
}

export interface ControlReportFilters {
  mes?: string;
  nivel?: string;
  grado?: string;
  seccion?: string;
  busqueda?: string;
}

export interface ControlEventoDia {
  studentId: number;
  nombre: string;
  gradoLabel: string;
  nivel: string;
  fecha: string;
  fechaLabel: string;
  tipo: 'F' | 'T' | 'J';
}

export interface CeldaCalendarioAlumno {
  fecha: string;
  dia: number;
  estado: EstadoAsistenciaControl | null | '–';
  esFuturo: boolean;
}
