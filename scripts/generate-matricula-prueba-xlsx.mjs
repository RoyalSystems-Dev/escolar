/**
 * Genera public/matricula_prueba_20_alumnos.xlsx (DNIs 80500001-80500020).
 * Uso: node scripts/generate-matricula-prueba-xlsx.mjs
 */
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const cantidad = Number(process.argv[2] || 20);
const dniBase = Number(process.argv[3] || 80500001);

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const publicDir = join(root, 'public');
const outFile = join(publicDir, `matricula_prueba_${cantidad}_alumnos.xlsx`);

const HEADERS = [
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
];

function generarFilas(count, base) {
  const nombresM = ['Lucas', 'Mateo', 'Santiago', 'Diego', 'Sebastian', 'Nicolas', 'Daniel', 'Alejandro', 'Gabriel', 'Adrian'];
  const nombresF = ['Lucia', 'Sofia', 'Valentina', 'Camila', 'Isabella', 'Mariana', 'Daniela', 'Gabriela', 'Alejandra', 'Fernanda'];
  const apellidos = ['Garcia', 'Lopez', 'Quispe', 'Mamani', 'Flores', 'Rojas', 'Torres', 'Vargas', 'Castillo', 'Mendoza'];
  const apellidos2 = ['Vega', 'Soto', 'Paz', 'Lima', 'Nunez', 'Ibarra', 'Cano', 'Rios', 'Acosta', 'Vera'];
  const niveles = [
    { nivel: 'Inicial', grados: ['1', '2', '3'], fechas: ['2021-04-12', '2020-09-08', '2022-01-15'] },
    { nivel: 'Primaria', grados: ['1', '2', '3', '4', '5', '6'], fechas: ['2018-03-20', '2017-07-14', '2016-11-05', '2015-02-22', '2014-08-30', '2013-05-10'] },
    { nivel: 'Secundaria', grados: ['1', '2', '3', '4', '5'], fechas: ['2012-06-18', '2011-09-25', '2010-12-03', '2009-04-07', '2008-10-16'] },
  ];
  const secciones = ['A', 'B', 'C'];
  const distritos = ['Miraflores', 'San Isidro', 'Surco', 'San Borja', 'La Molina'];
  const filas = [];

  for (let i = 0; i < count; i++) {
    const esF = i % 2 === 0;
    const nombre = esF ? nombresF[i % nombresF.length] : nombresM[i % nombresM.length];
    const ape1 = apellidos[i % apellidos.length];
    const ape2 = apellidos2[i % apellidos2.length];
    const cfg = niveles[i % niveles.length];
    const dni = String(base + i).padStart(8, '0');
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
      cfg.grados[i % cfg.grados.length],
      secciones[i % secciones.length],
      '2026',
      esF ? 'Carlos' : 'Maria',
      ape1,
      ape2.split(' ')[0],
      'DNI',
      String(90210001 + i).padStart(8, '0'),
      `987${String(200000 + i).slice(-6)}`,
      `apoderado.${dni}@email.com`,
      esF ? 'padre' : 'madre',
    ]);
  }
  return filas;
}

if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

const sheetData = [HEADERS, ...generarFilas(cantidad, dniBase)];
const ws = XLSX.utils.aoa_to_sheet(sheetData);
ws['!cols'] = HEADERS.map((h) => ({ wch: Math.max(12, Math.min(28, h.length + 4)) }));
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Matriculas');
XLSX.writeFile(wb, outFile);

console.log(`Generado: ${outFile}`);
console.log(`${cantidad} alumnos · DNI ${String(dniBase).padStart(8, '0')}–${String(dniBase + cantidad - 1).padStart(8, '0')}`);
