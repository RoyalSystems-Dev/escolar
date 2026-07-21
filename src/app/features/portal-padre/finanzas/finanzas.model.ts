import { HijoResumen } from '../seguimiento/seguimiento.model';

export type CargoEstado = 'pendiente' | 'parcial' | 'pagado' | 'vencido';
export type FiltroCargo = 'todos' | 'pagados' | 'pendientes' | 'vencidos';

export interface PagoRegistrado {
  id: number;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  referencia: string;
  numeroBoleta: string;
  tarjetaMarca: string;
  tarjetaUltimos4: string;
}

export interface CargoCuenta {
  id: number;
  concepto: string;
  codigoConcepto: string;
  tipoConcepto: string;
  periodoLabel: string;
  monto: number;
  montoPagado: number;
  saldo: number;
  fechaVencimiento: string;
  estado: CargoEstado;
  pagos: PagoRegistrado[];
}

export interface ResumenCuenta {
  totalDeuda: number;
  totalPagado: number;
  pendiente: number;
  vencido: number;
  proximoVencimiento: string | null;
}

export interface EstadoCuentaHijo {
  estudiante: HijoResumen;
  anioEscolar: number;
  resumen: ResumenCuenta;
  matricula: CargoCuenta | null;
  mensualidades: CargoCuenta[];
  otros: CargoCuenta[];
}

export function estadoCargoBadge(estado: CargoEstado): string {
  const map: Record<CargoEstado, string> = {
    pagado: 'badge-green',
    pendiente: 'badge-yellow',
    vencido: 'badge-red',
    parcial: 'badge-orange',
  };
  return map[estado] ?? 'badge-gray';
}

export function estadoCargoLabel(estado: CargoEstado): string {
  const map: Record<CargoEstado, string> = {
    pagado: 'Pagado',
    pendiente: 'Pendiente',
    vencido: 'Vencido',
    parcial: 'Parcial',
  };
  return map[estado] ?? estado;
}

export function metodoPagoLabel(metodo: string): string {
  const map: Record<string, string> = {
    efectivo: 'Efectivo',
    transferencia: 'Transferencia',
    tarjeta: 'Tarjeta',
    visa: 'Visa',
  };
  return map[metodo] ?? metodo;
}

export interface PayVisaRequest {
  numeroTarjeta: string;
  nombreTitular: string;
  vencimiento: string;
  cvv: string;
  monto?: number;
}

export interface PayVisaResult {
  paymentId: number;
  numeroBoleta: string;
  monto: number;
  chargeId: number;
  estado: CargoEstado;
  saldoRestante: number;
}

export interface BoletaInstitucion {
  nombre: string;
  siglas: string;
  ruc: string;
  codigoModular: string;
  direccion: string;
}

export interface BoletaVenta {
  id: number;
  numeroBoleta: string;
  serie: string;
  correlativo: string;
  fechaEmision: string;
  fechaPago: string;
  estudiante: {
    id: number;
    nombreCompleto: string;
    nivel: string;
    grado: string;
    seccion: string;
  };
  apoderado: string;
  concepto: string;
  periodoLabel: string;
  anioEscolar: number;
  monto: number;
  metodoPago: string;
  referencia: string;
  tarjetaMarca: string;
  tarjetaUltimos4: string;
  institucion: BoletaInstitucion;
}

export function filtrarCargos(
  cargos: CargoCuenta[],
  filtro: FiltroCargo,
): CargoCuenta[] {
  switch (filtro) {
    case 'pagados':
      return cargos.filter(c => c.estado === 'pagado');
    case 'pendientes':
      return cargos.filter(c => c.estado === 'pendiente' || c.estado === 'parcial');
    case 'vencidos':
      return cargos.filter(c => c.estado === 'vencido');
    default:
      return cargos;
  }
}

export function formatFechaCorta(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
