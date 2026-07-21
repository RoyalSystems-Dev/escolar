export interface HistorialAsistenciaResumen {
  total: number;
  presentes: number;
  faltas: number;
  tardanzas: number;
  justificadas: number;
  porcentaje: number;
}

export interface HistorialNotaItem {
  curso: string;
  bimestre: number;
  tipo: string;
  nota: number;
  fechaEvaluacion: string;
}

export interface HistorialTrayectoriaItem {
  anio: string;
  grado: string;
  seccion: string;
  promedio: number;
  estado: string;
  esActual: boolean;
  asistencia: HistorialAsistenciaResumen;
  notas: HistorialNotaItem[];
}

export interface HistorialAcademicoListItem {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  dni: string;
  nivel: string;
  gradoActual: string;
  seccionActual: string;
  anioIngreso: string;
  aniosRegistrados: number;
  promedioUltimo: number | null;
  asistenciaPct: number;
  conductaNota: string;
  estado: string;
}

export interface HistorialAcademicoDetalle {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  dni: string;
  nivel: string;
  gradoActual: string;
  seccionActual: string;
  anioIngreso: string;
  conductaNota: string;
  asistenciaPct: number;
  trayectoria: HistorialTrayectoriaItem[];
  notasActuales: HistorialNotaItem[];
  resumenNotas: {
    promedioGeneral: number | null;
    totalRegistros: number;
    porBimestre: Array<{ bimestre: number; promedio: number; cantidad: number }>;
  };
}

export function notaColorClass(nota: number): string {
  if (nota >= 14) return 'text-green-600';
  if (nota >= 11) return 'text-yellow-600';
  return 'text-red-600';
}

export function conductaColorClass(nota: string): string {
  if (nota === 'AD') return 'text-green-600';
  if (nota === 'A') return 'text-blue-600';
  if (nota === 'B') return 'text-yellow-600';
  return 'text-red-600';
}

export function estadoMatriculaLabel(estado: string): string {
  const map: Record<string, string> = {
    activo: 'Activo',
    inactivo: 'Inactivo',
    retirado: 'Retirado',
  };
  return map[estado] ?? estado;
}
