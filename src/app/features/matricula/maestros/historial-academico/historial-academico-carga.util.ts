import * as XLSX from 'xlsx';

export const PLANTILLA_HEADERS = [
  'nombres',
  'apellido_paterno',
  'apellido_materno',
  'dni',
  'codigo',
  'email',
  'nivel',
  'anio',
  'grado',
  'seccion',
  'promedio',
  'estado',
] as const;

const EJEMPLOS: string[][] = [
  ['Juan', 'Perez', 'Lopez', '45567012', 'EST-001', 'estudiante@escolar.pe', 'Primaria', '2021', '5 años', 'A', '14.0', 'Promovido'],
  ['Juan', 'Perez', 'Lopez', '45567012', 'EST-001', 'estudiante@escolar.pe', 'Primaria', '2022', '1° Primaria', 'A', '14.2', 'Promovido'],
  ['Juan', 'Perez', 'Lopez', '45567012', 'EST-001', 'estudiante@escolar.pe', 'Primaria', '2023', '2° Primaria', 'A', '14.5', 'Promovido'],
  ['Juan', 'Perez', 'Lopez', '45567012', 'EST-001', 'estudiante@escolar.pe', 'Primaria', '2024', '3° Primaria', 'A', '14.8', 'Promovido'],
  ['Juan', 'Perez', 'Lopez', '45567012', 'EST-001', 'estudiante@escolar.pe', 'Primaria', '2025', '4° Primaria', 'A', '15.2', 'Promovido'],
  ['Lucia', 'Torres', 'Mendoza', '72345678', '', 'l.torres@estudiante.pe', 'Primaria', '2023', '2° Primaria', 'B', '13.5', 'Promovido'],
  ['Lucia', 'Torres', 'Mendoza', '72345678', '', 'l.torres@estudiante.pe', 'Primaria', '2024', '3° Primaria', 'B', '14.0', 'Promovido'],
];

export function descargarPlantillaHistorial(): void {
  const sheetData = [[...PLANTILLA_HEADERS], ...EJEMPLOS];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Historial');
  XLSX.writeFile(wb, 'plantilla_historial_academico.xlsx');
}

export const ESTADOS_HISTORIAL = [
  'Promovido',
  'Repitente',
  'Retirado',
  'Traslado',
  'Convalidado',
] as const;

export const PLANTILLA_COLUMNAS_TEXTO =
  'nombres, apellido_paterno, apellido_materno, dni, codigo, email, nivel, anio, grado, seccion, promedio, estado';
