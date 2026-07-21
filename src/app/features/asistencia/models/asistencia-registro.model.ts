export type EstadoAsistencia = 'P' | 'F' | 'T' | 'J';



export interface RegistroAsistenciaRow {

  studentId: number;

  nombres: string;

  apellidos: string;

  dni: string;

  attendanceId: number | null;

  estado: EstadoAsistencia | null;

  observacion: string | null;

}



export interface DailyRegisterNavigation {

  hoy: string;

  anterior: string | null;

  siguiente: string | null;

  esHoy: boolean;

  esFinDeSemana: boolean;

  esDiaClase: boolean;

  fueraDePeriodo: boolean;

  periodoActual: {

    id: number;

    nombre: string;

    inicio: string;

    fin: string;

  } | null;

}



export interface DailyRegisterResponse {

  fecha: string;

  nivel: string;

  grado: string;

  seccion: string;

  gradoLabel: string;

  feriado: { nombre: string; tipo: string } | null;

  totalAlumnos: number;

  registros: RegistroAsistenciaRow[];

  navegacion: DailyRegisterNavigation;

}



export interface DailyRegisterCalendarDay {

  fecha: string;

  dia: number;

  esMesActual: boolean;

  esHoy: boolean;

  esSeleccionado: boolean;

  esFinDeSemana: boolean;

  esDiaClase: boolean;

  fueraDePeriodo: boolean;

  feriado: { nombre: string; tipo: string } | null;

  registrado: boolean;

  registrosCount: number;

  totalAlumnos: number;

}



export interface DailyRegisterCalendarResponse {

  mes: string;

  mesLabel: string;

  fechaHoy: string;

  fechaSeleccionada: string;

  periodoActual: {

    id: number;

    nombre: string;

    inicio: string;

    fin: string;

  } | null;

  totalAlumnos: number;

  mesAnterior: string;

  mesSiguiente: string;

  dias: DailyRegisterCalendarDay[];

}



export interface DailyRegisterFilters {

  nivel: string;

  grado: string;

  seccion: string;

  fecha: string;

}



export interface SaveDailyRegisterPayload {

  nivel: string;

  grado: string;

  seccion: string;

  fecha: string;

  registros: Array<{

    studentId: number;

    estado: EstadoAsistencia;

    observacion?: string;

  }>;

}



export interface SaveDailyRegisterResult {

  fecha: string;

  nivel: string;

  grado: string;

  seccion: string;

  guardados: number;

}


