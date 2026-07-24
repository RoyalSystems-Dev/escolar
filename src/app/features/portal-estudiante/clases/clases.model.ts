import { ApiResource } from '../../../core/api/api.models';
import { TemarioClaseItem } from '../../portal-docente/temario/temario.model';

export interface CursoClaseEstudiante {
  id: number;
  nombre: string;
  area: string;
  colorClass: string;
  dotClass: string;
  docenteAbrev: string;
  docenteNombre: string;
  sesionesSemana: number;
  diasSemana: number[];
  iniciales: string;
}

/** Sesión de clase en orden cronológico (por fecha). */
export interface SesionClaseDetalle {
  orden: number;
  fechaClase: string;
  fechaClaseDisplay: string;
  temas: TemarioClaseItem[];
  recursos: ApiResource[];
}

const PALABRAS_OMITIDAS = new Set(['y', 'de', 'del', 'la', 'el']);

export function inicialesCurso(nombre: string): string {
  const palabras = nombre
    .trim()
    .split(/\s+/)
    .filter(p => !PALABRAS_OMITIDAS.has(p.toLowerCase()));

  if (!palabras.length) return '?';

  if (palabras.length === 1) {
    return palabras[0].charAt(0).toUpperCase();
  }

  return palabras
    .slice(0, 2)
    .map(p => p.charAt(0).toUpperCase())
    .join('');
}

export function sesionKey(fecha: string): string {
  return fecha.slice(0, 10);
}
