export type EventoTipo =
  | 'academico'
  | 'deportivo'
  | 'cultural'
  | 'reunion'
  | 'feriado'
  | 'otro';

export type EventoDestinatario =
  | 'alumnos'
  | 'padres'
  | 'todos'
  | 'docentes'
  | 'salon';

export type EventoVisibilidad = 'global' | 'limitado';

export type EventoAudienciaLimitada = 'docentes' | 'alumnos' | 'padres' | 'salon';

export type EventoEstado = 'programado' | 'en_curso' | 'finalizado' | 'cancelado';

export interface EventoItem {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: EventoTipo;
  fechaInicio: string;
  fechaFin: string | null;
  horaInicio: string;
  horaFin: string | null;
  lugar: string;
  destinatarios: EventoDestinatario;
  visibilidad?: EventoVisibilidad;
  nivel: string;
  grado?: string;
  seccion?: string;
  responsable: string;
  publicado: boolean;
  cancelado: boolean;
  estado: EventoEstado;
  fechaInicioDisplay: string;
  fechaFinDisplay: string | null;
  horario: string;
}

export interface EventoFilters {
  mes?: string;
  tipo?: string;
  destinatarios?: string;
  estado?: string;
  busqueda?: string;
}

export interface EventoPayload {
  titulo: string;
  descripcion?: string;
  tipo: EventoTipo;
  fechaInicio: string;
  fechaFin?: string;
  horaInicio?: string;
  horaFin?: string;
  lugar?: string;
  destinatarios: EventoDestinatario;
  visibilidad?: EventoVisibilidad;
  nivel?: string;
  grado?: string;
  seccion?: string;
  responsable?: string;
  publicado?: boolean;
  cancelado?: boolean;
  estado?: EventoEstado;
}

export interface EventoVisibilidadInfo {
  tipo: EventoVisibilidad;
  tipoLabel: string;
  detalle: string;
  badge: string;
  icon: string;
}

export function resolveVisibilidadEvento(
  e: Pick<
    EventoItem,
    'visibilidad' | 'destinatarios' | 'nivel' | 'grado' | 'seccion'
  >,
): EventoVisibilidadInfo {
  const esGlobal =
    e.visibilidad === 'global' ||
    (!e.visibilidad &&
      e.destinatarios === 'todos' &&
      !e.grado?.trim() &&
      !e.seccion?.trim());

  if (esGlobal) {
    return {
      tipo: 'global',
      tipoLabel: 'Global',
      detalle: 'Visible para toda la comunidad educativa',
      badge: 'badge-indigo',
      icon: 'public',
    };
  }

  if (e.destinatarios === 'salon' || (e.grado?.trim() && e.seccion?.trim())) {
    const salon = [e.nivel, e.grado, e.seccion ? `"${e.seccion}"` : '']
      .filter(Boolean)
      .join(' ');
    return {
      tipo: 'limitado',
      tipoLabel: 'Limitado',
      detalle: salon ? `Salón ${salon}` : 'Salón específico',
      badge: 'badge-amber',
      icon: 'meeting_room',
    };
  }

  const audiencia = AUDIENCIA_LIMITADA_EVENTO.find((a) => a.value === e.destinatarios);
  return {
    tipo: 'limitado',
    tipoLabel: 'Limitado',
    detalle: audiencia?.label ?? `Audiencia: ${e.destinatarios}`,
    badge: 'badge-amber',
    icon: audiencia?.icon ?? 'group',
  };
}

export const AUDIENCIA_LIMITADA_EVENTO: {
  value: EventoAudienciaLimitada;
  label: string;
  icon: string;
}[] = [
  { value: 'alumnos', label: 'Alumnos', icon: 'school' },
  { value: 'padres', label: 'Padres de familia', icon: 'family_restroom' },
  { value: 'docentes', label: 'Docentes', icon: 'person' },
  { value: 'salon', label: 'Salón en particular', icon: 'meeting_room' },
];

export const TIPOS_EVENTO: { value: EventoTipo | ''; label: string; icon: string; badge: string }[] = [
  { value: '', label: 'Todos', icon: 'event', badge: 'badge-gray' },
  { value: 'academico', label: 'Académico', icon: 'school', badge: 'badge-indigo' },
  { value: 'deportivo', label: 'Deportivo', icon: 'sports_soccer', badge: 'badge-green' },
  { value: 'cultural', label: 'Cultural', icon: 'theater_comedy', badge: 'badge-purple' },
  { value: 'reunion', label: 'Reunión', icon: 'groups', badge: 'badge-blue' },
  { value: 'feriado', label: 'Feriado', icon: 'beach_access', badge: 'badge-yellow' },
  { value: 'otro', label: 'Otro', icon: 'event_note', badge: 'badge-gray' },
];

export const DESTINATARIOS_EVENTO: { value: EventoDestinatario | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'todos', label: 'Toda la comunidad' },
  { value: 'alumnos', label: 'Alumnos' },
  { value: 'padres', label: 'Padres' },
  { value: 'docentes', label: 'Docentes' },
];

export const ESTADOS_EVENTO: { value: EventoEstado | ''; label: string; badge: string; icon: string }[] = [
  { value: '', label: 'Todos', badge: 'badge-gray', icon: 'filter_list' },
  { value: 'programado', label: 'Programado', badge: 'badge-blue', icon: 'upcoming' },
  { value: 'en_curso', label: 'En curso', badge: 'badge-green', icon: 'play_circle' },
  { value: 'finalizado', label: 'Finalizado', badge: 'badge-gray', icon: 'check_circle' },
  { value: 'cancelado', label: 'Cancelado', badge: 'badge-red', icon: 'cancel' },
];

export const MESES_EVENTOS = [
  { value: '', label: 'Todos los meses' },
  { value: '2026-06', label: 'Junio 2026' },
  { value: '2026-07', label: 'Julio 2026' },
  { value: '2026-08', label: 'Agosto 2026' },
];
