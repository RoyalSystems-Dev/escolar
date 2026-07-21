export interface MaestroNavItem {
  label: string;
  icon: string;
  route: string;
  description: string;
}

export const MAESTROS_NAV: MaestroNavItem[] = [
  {
    label: 'Salones',
    icon: 'meeting_room',
    route: 'salones',
    description: 'Aforo por nivel, grado y seccion',
  },
  {
    label: 'Sedes',
    icon: 'location_city',
    route: 'sedes',
    description: 'Sedes por institución educativa',
  },
  {
    label: 'Cursos',
    icon: 'menu_book',
    route: 'cursos',
    description: 'Catalogo de cursos para currícula académica',
  },
  {
    label: 'Docentes',
    icon: 'school',
    route: 'docentes',
    description: 'Registro de docentes, especialización y carga horaria',
  },
  {
    label: 'Faltas y Reconocimientos',
    icon: 'gavel',
    route: 'faltas-reconocimientos',
    description: 'Descripciones para incidentes de conducta escolar',
  },
  {
    label: 'Feriados',
    icon: 'event_busy',
    route: 'feriados',
    description: 'Dias no lectivos del calendario escolar',
  },
  {
    label: 'Períodos Académicos',
    icon: 'date_range',
    route: 'periodos-academicos',
    description: 'Bimestres, trimestres y semestres del año lectivo',
  },
  {
    label: 'Eventos',
    icon: 'event',
    route: 'eventos',
    description: 'Calendario maestro de eventos institucionales',
  },
  {
    label: 'Fórmulas de Evaluación',
    icon: 'functions',
    route: 'formulas-evaluacion',
    description: 'Estructura ponderada de calificaciones por nivel/curso',
  },
];
