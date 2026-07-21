export type ContactosVista = 'companeros' | 'docentes';

export interface ContactoCompanero {
  id: number;
  nombreCompleto: string;
  email: string;
  telefono: string;
  iniciales: string;
}

export interface ContactoDocente {
  id: number;
  nombreCompleto: string;
  abrev: string;
  email: string;
  telefono: string;
  especialidad: string;
  cursos: string[];
  iniciales: string;
}

export interface ContactosEstudianteData {
  aulaLabel: string;
  anioEscolar: number;
  companeros: ContactoCompanero[];
  docentes: ContactoDocente[];
}

export function inicialesContacto(nombres: string, apellidos: string): string {
  const n = nombres.trim().charAt(0).toUpperCase();
  const a = apellidos.trim().charAt(0).toUpperCase();
  return `${n}${a}` || '?';
}

export function nombreCompletoContacto(nombres: string, apellidos: string): string {
  return `${nombres.trim()} ${apellidos.trim()}`.trim();
}
