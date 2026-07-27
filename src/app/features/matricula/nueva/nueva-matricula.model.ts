import {
  TipoDocumentoIdentidad,
  validarCelular,
  validarEmail,
  validarNumeroDocumento,
} from '../../estudiantes/shared/identidad-documento';

export interface ApoderadoForm {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  tipoDocumento: TipoDocumentoIdentidad;
  dni: string;
  parentesco: string;
  celular: string;
  email: string;
  esPrincipal: boolean;
}

export interface DocumentoMatriculaForm {
  tipo: string;
  obligatorio: boolean;
  estado: 'pendiente' | 'entregado';
  imagenUrl?: string;
}

export interface NuevaMatriculaForm {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  tipoDocumento: TipoDocumentoIdentidad;
  dni: string;
  fechaNac: string;
  sexo: string;
  telEmergencia: string;
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  apoderados: ApoderadoForm[];
  nivel: 'inicial' | 'primaria' | 'secundaria';
  grado: string;
  seccion: string;
  documentos: DocumentoMatriculaForm[];
}

export interface RepresentantePayload {
  nombres: string;
  apellidos: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  tipoDocumento: TipoDocumentoIdentidad;
  dni: string;
  telefono: string;
  email: string;
  trabajo?: string;
}

export interface NuevaMatriculaPayload {
  nombres: string;
  apellidos: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  tipoDocumento: TipoDocumentoIdentidad;
  dni: string;
  email: string;
  fechaNac?: string;
  sexo?: 'M' | 'F';
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  telefonoEmergencia?: string;
  observaciones?: string;
  gradoLabel: string;
  seccion: string;
  anioIngreso?: string;
  estado?: 'activo';
  padre?: RepresentantePayload;
  madre?: RepresentantePayload;
  apoderado?: RepresentantePayload;
  documentos?: Array<{
    tipo: string;
    estado: 'entregado' | 'pendiente' | 'vencido';
    imagenUrl?: string;
  }>;
}

export interface ExpedienteCreado {
  id: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  gradoLabel: string;
  seccion: string;
  email: string;
}

export interface OcupacionSeccion {
  seccion: string;
  matriculados: number;
  capacidad: number;
  disponibles: number;
}

export function nivelLabel(nivel: NuevaMatriculaForm['nivel']): string {
  return { inicial: 'Inicial', primaria: 'Primaria', secundaria: 'Secundaria' }[nivel];
}

export function gradoLabelFromForm(form: Pick<NuevaMatriculaForm, 'grado' | 'nivel'>): string {
  return `${form.grado}° ${nivelLabel(form.nivel)}`;
}

export function joinApellidos(paterno: string, materno: string): string {
  return [paterno.trim(), materno.trim()].filter(Boolean).join(' ');
}

export function formatDireccion(
  form: Pick<NuevaMatriculaForm, 'direccion' | 'distrito' | 'provincia' | 'departamento'>,
): string {
  return [form.direccion, form.distrito, form.provincia, form.departamento]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(', ');
}

export function splitNombreCompleto(full: string): { nombres: string; apellidos: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { nombres: '', apellidos: '' };
  if (parts.length === 1) return { nombres: parts[0], apellidos: '' };
  return { nombres: parts[0], apellidos: parts.slice(1).join(' ') };
}

export function apoderadoTieneDatos(ap: ApoderadoForm): boolean {
  return !!(
    ap.nombres.trim() ||
    ap.apellidoPaterno.trim() ||
    ap.apellidoMaterno.trim() ||
    ap.dni.trim() ||
    ap.celular.trim() ||
    ap.email.trim()
  );
}

export function validarApoderado(ap: ApoderadoForm, esPrincipal: boolean): string | null {
  if (!esPrincipal && !apoderadoTieneDatos(ap)) return null;

  if (!ap.nombres.trim()) return 'Ingresa los nombres del apoderado.';
  if (!ap.apellidoPaterno.trim()) return 'Ingresa el apellido paterno del apoderado.';
  if (!ap.apellidoMaterno.trim()) return 'Ingresa el apellido materno del apoderado.';

  const docError = validarNumeroDocumento(ap.tipoDocumento, ap.dni);
  if (docError) return docError;

  const celError = validarCelular(ap.celular, esPrincipal);
  if (celError) return celError;

  const emailError = validarEmail(ap.email);
  if (emailError) return emailError;

  return null;
}

export function buildEstudianteEmail(
  nombres: string,
  apellidos: string,
  dni: string,
): string {
  if (dni.trim()) {
    return `alumno.${dni.trim()}@estudiante.pe`;
  }
  const slug = `${nombres}.${apellidos}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.]+/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.|\.$/g, '');
  return `${slug || 'nuevo.alumno'}@estudiante.pe`;
}

export function mapApoderados(apoderados: ApoderadoForm[]): {
  padre?: RepresentantePayload;
  madre?: RepresentantePayload;
  apoderado?: RepresentantePayload;
} {
  const toRep = (ap: ApoderadoForm): RepresentantePayload => {
    const apellidos = joinApellidos(ap.apellidoPaterno, ap.apellidoMaterno);
    return {
      nombres: ap.nombres.trim(),
      apellidos,
      apellidoPaterno: ap.apellidoPaterno.trim(),
      apellidoMaterno: ap.apellidoMaterno.trim(),
      tipoDocumento: ap.tipoDocumento,
      dni: ap.dni.trim(),
      telefono: ap.celular.trim(),
      email: ap.email.trim(),
    };
  };

  let padre: RepresentantePayload | undefined;
  let madre: RepresentantePayload | undefined;
  let apoderado: RepresentantePayload | undefined;

  for (const ap of apoderados) {
    if (!apoderadoTieneDatos(ap)) continue;
    const rep = toRep(ap);
    if (ap.parentesco === 'padre') padre = rep;
    if (ap.parentesco === 'madre') madre = rep;
    if (ap.esPrincipal) apoderado = rep;
  }

  const principal = apoderados.find((ap) => ap.esPrincipal && apoderadoTieneDatos(ap));
  if (principal) {
    const rep = toRep(principal);
    if (principal.parentesco === 'padre') padre = rep;
    else if (principal.parentesco === 'madre') madre = rep;
    apoderado = rep;
  }

  return { padre, madre, apoderado };
}

export function buildNuevaMatriculaPayload(form: NuevaMatriculaForm): NuevaMatriculaPayload {
  const reps = mapApoderados(form.apoderados);
  const apellidos = joinApellidos(form.apellidoPaterno, form.apellidoMaterno);
  return {
    nombres: form.nombres.trim(),
    apellidos,
    apellidoPaterno: form.apellidoPaterno.trim(),
    apellidoMaterno: form.apellidoMaterno.trim(),
    tipoDocumento: form.tipoDocumento,
    dni: form.dni.trim(),
    email: buildEstudianteEmail(form.nombres, apellidos, form.dni),
    fechaNac: form.fechaNac || undefined,
    sexo: (form.sexo === 'F' ? 'F' : form.sexo === 'M' ? 'M' : undefined),
    direccion: form.direccion.trim() || undefined,
    distrito: form.distrito.trim() || undefined,
    provincia: form.provincia.trim() || undefined,
    departamento: form.departamento.trim() || undefined,
    telefonoEmergencia: form.telEmergencia.trim() || undefined,
    gradoLabel: gradoLabelFromForm(form),
    seccion: form.seccion,
    anioIngreso: String(new Date().getFullYear()),
    estado: 'activo',
    padre: reps.padre,
    madre: reps.madre,
    apoderado: reps.apoderado,
    documentos: form.documentos.map((doc) => ({
      tipo: doc.tipo,
      estado: doc.estado,
      imagenUrl: doc.imagenUrl,
    })),
  };
}
