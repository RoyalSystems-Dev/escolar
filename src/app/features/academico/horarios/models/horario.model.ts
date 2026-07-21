export type Nivel = 'Inicial' | 'Primaria' | 'Secundaria';

export interface Periodo {
  id: number;
  nombre: string;
  horaInicio: string;
  horaFin: string;
  isReceso: boolean;
  niveles: Nivel[];
}

export interface Curso {
  id: number;
  nombre: string;
  area: string;
  colorClass: string;
  dotClass: string;
}

export interface Docente {
  id: number;
  apellidos: string;
  nombres: string;
  abrev: string;
}

export interface EntradaHorario {
  id: number;
  nivel: Nivel;
  grado: string;
  seccion: string;
  dia: number;
  periodoId: number;
  cursoId: number;
  docenteId: number;
}

export interface PerfilEstudiante {
  nivel: Nivel;
  grado: string;
  seccion: string;
  aulaLabel: string;
}

export interface CeldaCalendario {
  fecha: Date;
  enMes: boolean;
  esHoy: boolean;
  esEscolar: boolean;
  diaHorario: number | null;
  clases: { curso: Curso; periodo: Periodo; docente: Docente }[];
}
