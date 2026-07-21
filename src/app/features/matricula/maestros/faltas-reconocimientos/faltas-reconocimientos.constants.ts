/** @deprecated Usar FaltasReconocimientosService (API). Mantener tipos legacy para conducta. */
export type TipoFaltaReconocimiento =
  | 'falta_leve'
  | 'falta_grave'
  | 'falta_muy_grave'
  | 'reconocimiento';

export const TIPOS_FALTA_RECONOCIMIENTO: TipoFaltaReconocimiento[] = [
  'falta_leve',
  'falta_grave',
  'falta_muy_grave',
  'reconocimiento',
];

export const TIPO_FALTA_RECONOCIMIENTO_CFG: Record<
  TipoFaltaReconocimiento,
  { label: string; icon: string; badge: string; header: string }
> = {
  falta_leve: {
    label: 'Falta Leve',
    icon: 'warning',
    badge: 'badge-yellow',
    header: 'bg-yellow-50 text-yellow-800',
  },
  falta_grave: {
    label: 'Falta Grave',
    icon: 'report',
    badge: 'badge-orange',
    header: 'bg-orange-50 text-orange-800',
  },
  falta_muy_grave: {
    label: 'Falta Muy Grave',
    icon: 'gpp_bad',
    badge: 'badge-red',
    header: 'bg-red-50 text-red-800',
  },
  reconocimiento: {
    label: 'Reconocimiento',
    icon: 'emoji_events',
    badge: 'badge-green',
    header: 'bg-emerald-50 text-emerald-800',
  },
};
