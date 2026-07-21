export type EstadoAsistencia = 'P' | 'F' | 'T' | 'J';

export interface RegistroAsistenciaAlumno {
  id: number;
  estudianteId: string;
  fecha: string;
  estado: EstadoAsistencia;
  observacion?: string;
}

export interface ResumenAsistenciaAlumno {
  totalDias: number;
  presentes: number;
  faltas: number;
  tardanzas: number;
  justificadas: number;
  inasistenciasNetas: number;
  asistenciaPct: number;
}
