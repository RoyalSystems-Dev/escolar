export type NivelLogro = 'AD' | 'A' | 'B' | 'C';

export interface NotaItem {
  id: number;
  descripcion: string;
  fecha: string;
  bimestre: number;
  nota: number;
}

export interface CursoNotasEstudiante {
  id: number;
  nombre: string;
  area: string;
  emoji: string;
  colorClass: string;
  dotClass: string;
  docenteAbrev: string;
  controlesDiarios: NotaItem[];
  parciales: NotaItem[];
  finales: NotaItem[];
}
