import * as XLSX from 'xlsx';
import {
  buildEstudianteEmail,
  splitNombreCompleto,
} from '../nueva/nueva-matricula.model';
import { BulkMatriculaPayload, FilaCargaMatricula, NivelMatricula } from './masiva.model';

export const PLANTILLA_HEADERS = [
  'nombres',
  'apellido_paterno',
  'apellido_materno',
  'tipo_documento',
  'dni',
  'email',
  'sexo',
  'fecha_nac',
  'direccion',
  'distrito',
  'provincia',
  'departamento',
  'telefono_emergencia',
  'nivel',
  'grado',
  'seccion',
  'anio_ingreso',
  'apoderado_nombres',
  'apoderado_apellido_paterno',
  'apoderado_apellido_materno',
  'apoderado_tipo_documento',
  'apoderado_dni',
  'apoderado_telefono',
  'apoderado_email',
  'apoderado_parentesco',
] as const;

const PLANTILLA_ALUMNOS = 10;
const PLANTILLA_DNI_BASE = 80600001;

export const NIVELES_VALIDOS: NivelMatricula[] = ['Inicial', 'Primaria', 'Secundaria'];
export const SEXOS_VALIDOS = ['M', 'F'] as const;

export function descargarPlantillaMatricula(): void {
  const filas = generarFilasEjemploPlantilla(PLANTILLA_ALUMNOS, PLANTILLA_DNI_BASE);
  const sheetData = [[...PLANTILLA_HEADERS], ...filas];
  escribirExcelMatricula(sheetData, 'plantilla_matricula_masiva.xlsx');
}

function normalizeHeader(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, '_');
}

function generarFilasEjemploPlantilla(cantidad: number, dniBase: number): string[][] {
  const nombresM = [
    'Lucas', 'Mateo', 'Santiago', 'Diego', 'Sebastian', 'Nicolas', 'Daniel', 'Alejandro',
    'Gabriel', 'Adrian',
  ];
  const nombresF = [
    'Lucia', 'Sofia', 'Valentina', 'Camila', 'Isabella', 'Mariana', 'Daniela', 'Gabriela',
    'Alejandra', 'Fernanda',
  ];
  const apellidos = [
    'Garcia', 'Lopez', 'Quispe', 'Mamani', 'Flores', 'Rojas', 'Torres', 'Vargas',
    'Castillo', 'Mendoza',
  ];
  const apellidos2 = [
    'Vega', 'Soto', 'Paz', 'Lima', 'Nunez', 'Ibarra', 'Cano', 'Rios', 'Acosta', 'Vera',
  ];
  const niveles: Array<{ nivel: NivelMatricula; grados: string[]; fechas: string[] }> = [
    {
      nivel: 'Inicial',
      grados: ['1', '2', '3'],
      fechas: ['2021-04-12', '2020-09-08', '2022-01-15'],
    },
    {
      nivel: 'Primaria',
      grados: ['1', '2', '3', '4', '5', '6'],
      fechas: ['2018-03-20', '2017-07-14', '2016-11-05', '2015-02-22', '2014-08-30', '2013-05-10'],
    },
    {
      nivel: 'Secundaria',
      grados: ['1', '2', '3', '4', '5'],
      fechas: ['2012-06-18', '2011-09-25', '2010-12-03', '2009-04-07', '2008-10-16'],
    },
  ];
  const secciones = ['A', 'B', 'C'];
  const distritos = ['Miraflores', 'San Isidro', 'Surco', 'San Borja', 'La Molina'];

  const filas: string[][] = [];
  for (let i = 0; i < cantidad; i++) {
    const esF = i % 2 === 0;
    const nombre = esF ? nombresF[i % nombresF.length] : nombresM[i % nombresM.length];
    const ape1 = apellidos[i % apellidos.length];
    const ape2 = apellidos2[i % apellidos2.length];
    const cfg = niveles[i % niveles.length];
    const grado = cfg.grados[i % cfg.grados.length];
    const seccion = secciones[i % secciones.length];
    const dni = String(dniBase + i).padStart(8, '0');
    const apoDni = String(90220001 + i).padStart(8, '0');
    const apoNombre = esF ? 'Carlos' : 'Maria';
    const distrito = distritos[i % distritos.length];

    filas.push([
      nombre,
      ape1,
      ape2,
      'DNI',
      dni,
      '',
      esF ? 'F' : 'M',
      cfg.fechas[i % cfg.fechas.length],
      `Av. Los Pinos ${120 + i}, ${distrito}`,
      distrito,
      'Lima',
      'Lima',
      '',
      cfg.nivel,
      grado,
      seccion,
      '2026',
      apoNombre,
      ape1,
      ape2.split(' ')[0],
      'DNI',
      apoDni,
      `987${String(100000 + i).slice(-6)}`,
      `apoderado.${dni}@email.com`,
      esF ? 'padre' : 'madre',
    ]);
  }
  return filas;
}

function escribirExcelMatricula(sheetData: string[][], filename: string): void {
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet['!cols'] = PLANTILLA_HEADERS.map((h) => ({
    wch: Math.max(12, Math.min(28, h.length + 4)),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Matriculas');
  XLSX.writeFile(workbook, filename);
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0 && value <= 99999999) {
      return String(value).padStart(8, '0').slice(-8);
    }
    return String(value);
  }
  return String(value).trim();
}

function normalizeNivel(value: string): NivelMatricula | '' {
  const v = value.trim().toLowerCase();
  if (v === 'inicial') return 'Inicial';
  if (v === 'primaria') return 'Primaria';
  if (v === 'secundaria') return 'Secundaria';
  return '';
}

function normalizeSexo(value: string): 'M' | 'F' | '' {
  const v = value.trim().toUpperCase();
  if (v === 'M' || v === 'F') return v;
  if (v === 'MASCULINO' || v === 'MALE') return 'M';
  if (v === 'FEMENINO' || v === 'FEMALE') return 'F';
  return '';
}

function normalizeGrado(value: string): string {
  return value.replace(/°/g, '').trim();
}

function resolveApellidos(
  apellidoPaterno: string,
  apellidoMaterno: string,
  apellidosLegacy: string,
): { apellidoPaterno: string; apellidoMaterno: string; apellidos: string } {
  const paterno = apellidoPaterno.trim();
  const materno = apellidoMaterno.trim();
  if (paterno || materno) {
    return {
      apellidoPaterno: paterno,
      apellidoMaterno: materno,
      apellidos: [paterno, materno].filter(Boolean).join(' '),
    };
  }
  const legacy = apellidosLegacy.trim();
  if (!legacy) {
    return { apellidoPaterno: '', apellidoMaterno: '', apellidos: '' };
  }
  const parts = legacy.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      apellidoPaterno: parts[0],
      apellidoMaterno: parts.slice(1).join(' '),
      apellidos: legacy,
    };
  }
  return { apellidoPaterno: legacy, apellidoMaterno: '', apellidos: legacy };
}

function validarColumnas(headers: string[]): void {
  const required = ['nombres', 'dni', 'nivel', 'grado', 'seccion', 'direccion'];
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length) {
    throw new Error(`La plantilla no tiene las columnas requeridas: ${missing.join(', ')}`);
  }
  const tieneApellidosSeparados =
    headers.includes('apellido_paterno') && headers.includes('apellido_materno');
  if (!tieneApellidosSeparados && !headers.includes('apellidos')) {
    throw new Error(
      'La plantilla debe incluir apellido_paterno y apellido_materno, o la columna apellidos',
    );
  }
}

function validarFila(
  data: Omit<FilaCargaMatricula, 'errores' | 'valido'>,
): FilaCargaMatricula {
  const errores: string[] = [];

  if (!data.nombres.trim()) errores.push('Nombres es obligatorio');
  if (!data.apellidoPaterno?.trim()) errores.push('Apellido paterno es obligatorio');
  if (!data.apellidoMaterno?.trim()) errores.push('Apellido materno es obligatorio');
  if (!/^\d{8}$/.test(data.dni) && (data.tipoDocumento ?? 'DNI') === 'DNI') {
    errores.push('DNI debe tener 8 digitos');
  }
  if (!data.direccion?.trim()) errores.push('Direccion es obligatoria');
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errores.push('Email invalido');
  }
  if (!NIVELES_VALIDOS.includes(data.nivel)) {
    errores.push(`Nivel invalido. Valores: ${NIVELES_VALIDOS.join(', ')}`);
  }
  if (!data.grado) errores.push('Grado es obligatorio');
  if (!/^[A-Z]$/i.test(data.seccion)) errores.push('Seccion debe ser una letra (A, B, C...)');
  if (data.sexo && !SEXOS_VALIDOS.includes(data.sexo)) {
    errores.push('Sexo invalido. Valores: M, F');
  }

  const gradoNum = parseInt(data.grado, 10);
  if (data.nivel === 'Inicial' && (gradoNum < 1 || gradoNum > 3)) {
    errores.push('Grado Inicial debe ser 1, 2 o 3');
  }
  if (data.nivel === 'Primaria' && (gradoNum < 1 || gradoNum > 6)) {
    errores.push('Grado Primaria debe ser 1 a 6');
  }
  if (data.nivel === 'Secundaria' && (gradoNum < 1 || gradoNum > 5)) {
    errores.push('Grado Secundaria debe ser 1 a 5');
  }

  return { ...data, errores, valido: errores.length === 0 };
}

function mapRecord(fila: number, data: Record<string, string>): FilaCargaMatricula {
  const nombres = data['nombres'] ?? '';
  const dni = data['dni'] ?? '';
  const nivel = normalizeNivel(data['nivel'] ?? '');
  const sexoRaw = normalizeSexo(data['sexo'] ?? '');

  const apellidosRes = resolveApellidos(
    data['apellido_paterno'] ?? '',
    data['apellido_materno'] ?? '',
    data['apellidos'] ?? '',
  );

  const apoderadoFull = data['apoderado_nombres']?.trim() ?? '';
  let apoderadoNombres = apoderadoFull;
  const apoderadoApellidosRes = resolveApellidos(
    data['apoderado_apellido_paterno'] ?? '',
    data['apoderado_apellido_materno'] ?? '',
    data['apoderado_apellidos'] ?? '',
  );
  if (apoderadoFull && !apoderadoApellidosRes.apellidos) {
    const split = splitNombreCompleto(apoderadoFull);
    apoderadoNombres = split.nombres;
  }

  return validarFila({
    fila,
    nombres: nombres.trim(),
    apellidos: apellidosRes.apellidos,
    apellidoPaterno: apellidosRes.apellidoPaterno,
    apellidoMaterno: apellidosRes.apellidoMaterno,
    tipoDocumento: (data['tipo_documento']?.trim() || 'DNI') as BulkMatriculaPayload['tipoDocumento'],
    dni: dni.trim(),
    email:
      (data['email'] ?? '').trim() ||
      (dni ? buildEstudianteEmail(nombres, apellidosRes.apellidos, dni) : ''),
    sexo: sexoRaw || undefined,
    fechaNac: data['fecha_nac']?.trim() || undefined,
    direccion: (data['direccion'] ?? '').trim(),
    distrito: data['distrito']?.trim() || undefined,
    provincia: data['provincia']?.trim() || undefined,
    departamento: data['departamento']?.trim() || undefined,
    telefonoEmergencia: data['telefono_emergencia']?.trim() || undefined,
    nivel: nivel || ('' as NivelMatricula),
    grado: normalizeGrado(data['grado'] ?? ''),
    seccion: (data['seccion'] ?? 'A').trim().toUpperCase(),
    anioIngreso: data['anio_ingreso']?.trim() || String(new Date().getFullYear()),
    apoderadoNombres: apoderadoNombres || undefined,
    apoderadoApellidos: apoderadoApellidosRes.apellidos || undefined,
    apoderadoApellidoPaterno: apoderadoApellidosRes.apellidoPaterno || undefined,
    apoderadoApellidoMaterno: apoderadoApellidosRes.apellidoMaterno || undefined,
    apoderadoTipoDocumento: (data['apoderado_tipo_documento']?.trim() ||
      undefined) as BulkMatriculaPayload['apoderadoTipoDocumento'],
    apoderadoDni: data['apoderado_dni']?.trim() || undefined,
    apoderadoTelefono: data['apoderado_telefono']?.trim() || undefined,
    apoderadoEmail: data['apoderado_email']?.trim() || undefined,
    apoderadoParentesco: (data['apoderado_parentesco']?.trim().toLowerCase() ||
      undefined) as BulkMatriculaPayload['apoderadoParentesco'],
  });
}

function buildFilasFromRecords(
  records: { fila: number; data: Record<string, string> }[],
): FilaCargaMatricula[] {
  if (!records.length) return [];

  const headers = Object.keys(records[0].data);
  validarColumnas(headers);

  const filas = records
    .map(({ fila, data }) => {
      if (!Object.values(data).some(Boolean)) return null;
      return mapRecord(fila, data);
    })
    .filter((row): row is FilaCargaMatricula => row !== null);

  const dnis = new Set<string>();
  const emails = new Set<string>();
  return filas.map((fila) => {
    const errores = [...fila.errores];
    if (dnis.has(fila.dni)) errores.push('DNI duplicado en el archivo');
    if (fila.email && emails.has(fila.email.toLowerCase())) errores.push('Email duplicado en el archivo');
    dnis.add(fila.dni);
    if (fila.email) emails.add(fila.email.toLowerCase());
    return { ...fila, errores, valido: errores.length === 0 };
  });
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  values.push(current.trim());
  return values;
}

export function parsearCsvMatricula(text: string): FilaCargaMatricula[] {
  const clean = text.replace(/^\uFEFF/, '').trim();
  if (!clean) return [];

  const lines = clean.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);

  const records = lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line, delimiter);
    const data: Record<string, string> = {};
    headers.forEach((header, i) => {
      data[header] = (values[i] ?? '').trim();
    });
    return { fila: index + 2, data };
  });

  return buildFilasFromRecords(records);
}

export async function parsearExcelMatricula(file: File): Promise<FilaCargaMatricula[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('El archivo Excel no contiene hojas de calculo');
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][];

  if (matrix.length < 2) return [];

  const headers = (matrix[0] ?? []).map((cell) => normalizeHeader(cellToString(cell)));
  const records = matrix.slice(1).map((row, index) => {
    const data: Record<string, string> = {};
    headers.forEach((header, i) => {
      data[header] = cellToString(row[i]);
    });
    return { fila: index + 2, data };
  });

  return buildFilasFromRecords(records);
}

export async function parsearArchivoMatricula(file: File): Promise<FilaCargaMatricula[]> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'csv') {
    const text = await file.text();
    return parsearCsvMatricula(text);
  }
  if (ext === 'xlsx' || ext === 'xls') {
    return parsearExcelMatricula(file);
  }
  throw new Error('Formato no soportado. Use CSV (.csv) o Excel (.xlsx, .xls)');
}
