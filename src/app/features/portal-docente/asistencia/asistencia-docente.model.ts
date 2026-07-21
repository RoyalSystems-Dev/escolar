export interface DocenteSalonAsignado {
  nivel: string;
  grado: string;
  seccion: string;
  aforo: number;
  anioEscolar: number;
  label: string;
  cursos: string[];
  totalAlumnos: number;
}

export interface DocenteMisSalonesResponse {
  docente: {
    id: number;
    nombreCompleto: string;
    especialidad: string;
  };
  anioEscolar: number;
  salones: DocenteSalonAsignado[];
}
