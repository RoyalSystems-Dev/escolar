import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DecimalPipe, NgClass, NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { HijoResumen, parentescoLabel } from '../seguimiento/seguimiento.model';
import { FinanzasPadreService } from './finanzas-padre.service';
import {
  BoletaVenta,
  CargoCuenta,
  estadoCargoBadge,
  estadoCargoLabel,
  filtrarCargos,
  formatFechaCorta,
  FiltroCargo,
  metodoPagoLabel,
} from './finanzas.model';

@Component({
  standalone: true,
  imports: [NgClass, DecimalPipe, NgTemplateOutlet, FormsModule],
  template: `
<div class="space-y-5 animate-fade-in">

  <div class="flex flex-wrap items-start justify-between gap-4">
    <div>
      <h2 class="text-xl font-bold text-gray-800">Estado de Cuenta</h2>
      <p class="text-sm text-gray-500 mt-0.5">
        {{ auth.nombreCompleto() }} · Matrícula, mensualidades y otros conceptos
      </p>
    </div>
    <button class="btn btn-secondary btn-sm" (click)="cargar()"
      [disabled]="svc.loadingHijos() || svc.loadingCuenta()">
      <span class="icon icon-sm">refresh</span> Actualizar
    </button>
  </div>

  @if (svc.loadingHijos()) {
    <div class="card p-12 flex flex-col items-center text-gray-400">
      <span class="icon icon-xl animate-spin mb-3">progress_activity</span>
      <p class="text-sm">Cargando hijos…</p>
    </div>
  } @else if (!svc.hijos().length) {
    <div class="card p-10 text-center text-gray-400">
      <span class="icon icon-xl mb-3">family_restroom</span>
      <p class="text-sm">No hay alumnos vinculados a tu cuenta.</p>
    </div>
  } @else {
    <div class="flex flex-wrap gap-2">
      @for (h of svc.hijos(); track h.studentId) {
        <button type="button"
          class="px-3 py-2 rounded-xl border text-left transition-all min-w-[160px]"
          [ngClass]="hijoId() === h.studentId
            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200'
            : 'border-gray-200 bg-white hover:border-gray-300'"
          (click)="seleccionarHijo(h)">
          <div class="text-sm font-semibold text-gray-800">{{ h.nombreCompleto }}</div>
          <div class="text-xs text-gray-500 mt-0.5">
            {{ h.aulaLabel }} · {{ parentescoLabel(h.parentesco) }}
          </div>
        </button>
      }
    </div>

    @if (svc.loadingCuenta()) {
      <div class="card p-10 flex flex-col items-center text-gray-400">
        <span class="icon icon-xl animate-spin mb-3">progress_activity</span>
        <p class="text-sm">Cargando estado de cuenta…</p>
      </div>
    } @else if (cuenta(); as c) {
      <div class="card p-4 bg-gradient-to-r from-emerald-50 to-white border-emerald-100">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="font-bold text-gray-900">{{ c.estudiante.nombreCompleto }}</h3>
            <p class="text-sm text-gray-500">{{ c.estudiante.aulaLabel }} · A.E. {{ c.anioEscolar }}</p>
          </div>
          @if (c.resumen.proximoVencimiento) {
            <div class="text-right text-sm">
              <p class="text-gray-400 text-xs">Próximo vencimiento</p>
              <p class="font-semibold text-amber-700">{{ formatFechaLarga(c.resumen.proximoVencimiento) }}</p>
            </div>
          }
        </div>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        @for (k of kpis(); track k.label) {
          <div class="card p-4">
            <div class="text-xs text-gray-500 mb-1">{{ k.label }}</div>
            <div class="text-xl font-bold" [ngClass]="k.color">S/ {{ k.value | number:'1.2-2' }}</div>
          </div>
        }
      </div>

      <div class="tabs">
        @for (tab of tabs; track tab.id) {
          <button type="button" class="tab" [class.tab-active]="vista() === tab.id" (click)="vista.set(tab.id)">
            <span class="icon icon-sm">{{ tab.icon }}</span> {{ tab.label }}
            @if (tab.id === 'pagos' && pagosRealizados().length) {
              <span class="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                {{ pagosRealizados().length }}
              </span>
            }
          </button>
        }
      </div>

      @if (vista() === 'cuenta') {
        @if (c.matricula; as mat) {
          <div class="card p-5">
            <h4 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span class="icon text-emerald-600">school</span> Matrícula
            </h4>
            <ng-container *ngTemplateOutlet="cargoRow; context: { $implicit: mat, destacado: true }"></ng-container>
          </div>
        }

        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <h4 class="font-semibold text-gray-800 flex items-center gap-2">
              <span class="icon text-indigo-600">calendar_month</span> Mensualidades
            </h4>
            <div class="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              @for (f of filtros; track f.id) {
                <button type="button"
                  class="px-3 py-1.5 text-xs font-medium rounded-md transition-all"
                  [ngClass]="filtro() === f.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:text-gray-800'"
                  (click)="filtro.set(f.id)">
                  {{ f.label }}
                </button>
              }
            </div>
          </div>

          @if (!mensualidadesFiltradas().length) {
            <div class="p-10 text-center text-sm text-gray-400">
              No hay mensualidades con el filtro seleccionado.
            </div>
          } @else {
            <div class="divide-y divide-gray-100">
              @for (cargo of mensualidadesFiltradas(); track cargo.id) {
                <div class="px-5 py-4">
                  <ng-container *ngTemplateOutlet="cargoRow; context: { $implicit: cargo, destacado: false }"></ng-container>
                </div>
              }
            </div>
          }
        </div>

        @if (c.otros.length) {
          <div class="card overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-100">
              <h4 class="font-semibold text-gray-800 flex items-center gap-2">
                <span class="icon text-amber-600">receipt</span> Otros conceptos
              </h4>
            </div>
            <div class="divide-y divide-gray-100">
              @for (cargo of c.otros; track cargo.id) {
                <div class="px-5 py-4">
                  <ng-container *ngTemplateOutlet="cargoRow; context: { $implicit: cargo, destacado: false }"></ng-container>
                </div>
              }
            </div>
          </div>
        }
      } @else {
        <div class="card overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100">
            <h4 class="font-semibold text-gray-800 flex items-center gap-2">
              <span class="icon text-green-600">payments</span> Historial de pagos
            </h4>
            <p class="text-xs text-gray-500 mt-1">Matrícula, mensualidades y otros conceptos pagados</p>
          </div>

          @if (!pagosRealizados().length) {
            <div class="p-10 text-center text-sm text-gray-400">
              <span class="icon icon-xl mb-3 block">payments</span>
              Aún no hay pagos registrados para este alumno.
            </div>
          } @else {
            <div class="overflow-x-auto">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Concepto</th>
                    <th>Método</th>
                    <th>Boleta</th>
                    <th class="text-right">Monto</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of pagosRealizados(); track p.id) {
                    <tr>
                      <td class="text-sm">{{ formatFechaCorta(p.fechaPago) }}</td>
                      <td>
                        <span class="badge text-[10px]" [ngClass]="tipoPagoBadge(p.tipo)">{{ p.tipo }}</span>
                      </td>
                      <td>
                        <p class="font-medium text-gray-800">{{ p.concepto }}</p>
                        @if (p.periodoLabel && p.periodoLabel !== p.concepto) {
                          <p class="text-xs text-gray-500">{{ p.periodoLabel }}</p>
                        }
                      </td>
                      <td class="text-sm text-gray-600">{{ metodoPagoLabel(p.metodoPago) }}</td>
                      <td class="text-sm text-gray-500">{{ p.numeroBoleta || '—' }}</td>
                      <td class="text-right font-semibold text-emerald-700">S/ {{ p.monto | number:'1.2-2' }}</td>
                      <td class="text-right">
                        <button type="button" class="btn btn-secondary btn-xs" (click)="verBoleta(p.id)">
                          <span class="icon icon-sm">receipt_long</span> Boleta
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    } @else {
      <div class="card p-10 text-center text-gray-400">
        <span class="icon icon-xl mb-3">account_balance_wallet</span>
        <p class="text-sm">No hay información de pagos para este alumno.</p>
        <p class="text-xs mt-2">Contacta con tesorería si crees que es un error.</p>
      </div>
    }
  }

</div>

<ng-template #cargoRow let-cargo let-destacado="destacado">
  <div class="flex flex-col lg:flex-row lg:items-center gap-3"
    [ngClass]="destacado ? '' : ''">
    <div class="flex-1 min-w-0">
      <div class="flex flex-wrap items-center gap-2">
        <p class="font-medium text-gray-800">{{ cargo.periodoLabel }}</p>
        <span class="badge text-[10px]" [ngClass]="estadoCargoBadge(cargo.estado)">
          {{ estadoCargoLabel(cargo.estado) }}
        </span>
      </div>
      <p class="text-xs text-gray-500 mt-0.5">{{ cargo.concepto }} · Vence {{ formatFechaCorta(cargo.fechaVencimiento) }}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3 shrink-0">
      <p class="text-lg font-bold tabular-nums"
        [ngClass]="cargo.saldo > 0 ? 'text-gray-900' : 'text-emerald-700'">
        S/ {{ cargo.monto | number:'1.2-2' }}
      </p>
      @if (cargo.saldo > 0) {
        <button type="button"
          class="btn btn-primary btn-icon shrink-0"
          title="Pagar mensualidad"
          aria-label="Pagar mensualidad"
          (click)="abrirPagoVisa(cargo)">
          <span class="icon">credit_card</span>
        </button>
      }
    </div>
  </div>
</ng-template>

@if (modalPago()) {
  <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
    (click)="cerrarPagoVisa()">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" (click)="$event.stopPropagation()">
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h3 class="font-bold text-gray-900">Pagar mensualidad</h3>
          <p class="text-xs text-gray-500">{{ cargoPago()?.periodoLabel }} · S/ {{ cargoPago()?.monto | number:'1.2-2' }}</p>
        </div>
        <button type="button" class="btn-icon text-gray-400" (click)="cerrarPagoVisa()">
          <span class="icon">close</span>
        </button>
      </div>
      <div class="px-6 py-5 space-y-4">
        <div class="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
          <div class="w-12 h-8 rounded bg-[#1A1F71] text-white text-xs font-bold flex items-center justify-center">VISA</div>
          <p class="text-xs text-blue-800">Pago simulado para demo. Tarjeta Visa válida (16 dígitos, inicia con 4).</p>
        </div>
        <div>
          <label class="form-label">Número de tarjeta</label>
          <input class="form-input mt-1 font-mono tracking-wider" maxlength="19"
            placeholder="4111 1111 1111 1111" [(ngModel)]="formVisa.numeroTarjeta" (input)="formatearTarjeta()">
        </div>
        <div>
          <label class="form-label">Nombre del titular</label>
          <input class="form-input mt-1 uppercase" placeholder="MARIA LOPEZ QUISPE" [(ngModel)]="formVisa.nombreTitular">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="form-label">Vencimiento</label>
            <input class="form-input mt-1 font-mono" maxlength="5" placeholder="MM/YY"
              [(ngModel)]="formVisa.vencimiento" (input)="formatearVencimiento()">
          </div>
          <div>
            <label class="form-label">CVV</label>
            <input class="form-input mt-1 font-mono" maxlength="4" placeholder="123"
              [(ngModel)]="formVisa.cvv" type="password">
          </div>
        </div>
        @if (errorPago()) {
          <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ errorPago() }}</div>
        }
      </div>
      <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
        <button type="button" class="btn btn-secondary" (click)="cerrarPagoVisa()">Cancelar</button>
        <button type="button" class="btn btn-primary" (click)="confirmarPagoVisa()" [disabled]="svc.payingVisa()">
          {{ svc.payingVisa() ? 'Procesando…' : 'Confirmar pago' }}
        </button>
      </div>
    </div>
  </div>
}

@if (modalBoleta()) {
  <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" (click)="cerrarBoleta()">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
      @if (svc.loadingBoleta()) {
        <div class="p-12 flex flex-col items-center text-gray-400">
          <span class="icon icon-xl animate-spin mb-3">progress_activity</span>
          <p class="text-sm">Cargando boleta…</p>
        </div>
      } @else if (boleta(); as b) {
        <div class="p-6 space-y-5" id="boleta-print">
          <div class="flex items-start justify-between gap-4 border-b pb-4">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Boleta de venta</p>
              <h3 class="text-lg font-bold text-gray-900">{{ b.institucion.nombre }}</h3>
              <p class="text-xs text-gray-500">RUC {{ b.institucion.ruc }} · Cód. modular {{ b.institucion.codigoModular }}</p>
              <p class="text-xs text-gray-500">{{ b.institucion.direccion }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-2xl font-bold text-indigo-700">{{ b.numeroBoleta }}</p>
              <p class="text-xs text-gray-500 mt-1">Emisión: {{ formatFechaCorta(b.fechaEmision) }}</p>
            </div>
          </div>
          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div class="p-3 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-400 mb-1">Estudiante</p>
              <p class="font-semibold">{{ b.estudiante.nombreCompleto }}</p>
              <p class="text-gray-500 text-xs">{{ b.estudiante.nivel }} {{ b.estudiante.grado }} "{{ b.estudiante.seccion }}"</p>
            </div>
            <div class="p-3 bg-gray-50 rounded-xl">
              <p class="text-xs text-gray-400 mb-1">Apoderado</p>
              <p class="font-semibold">{{ b.apoderado || '—' }}</p>
              <p class="text-gray-500 text-xs">A.E. {{ b.anioEscolar }}</p>
            </div>
          </div>
          <table class="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left px-4 py-2 text-xs text-gray-500">Concepto</th>
                <th class="text-left px-4 py-2 text-xs text-gray-500">Periodo</th>
                <th class="text-right px-4 py-2 text-xs text-gray-500">Importe</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-gray-100">
                <td class="px-4 py-3">{{ b.concepto }}</td>
                <td class="px-4 py-3 text-gray-600">{{ b.periodoLabel }}</td>
                <td class="px-4 py-3 text-right font-bold">S/ {{ b.monto | number:'1.2-2' }}</td>
              </tr>
            </tbody>
          </table>
          <div class="flex flex-wrap justify-between gap-3 text-sm border-t pt-4">
            <div>
              <p class="text-gray-500">Método de pago</p>
              <p class="font-medium">{{ metodoPagoLabel(b.metodoPago) }}
                @if (b.tarjetaUltimos4) { · {{ b.tarjetaMarca }} **** {{ b.tarjetaUltimos4 }} }
              </p>
              @if (b.referencia) { <p class="text-xs text-gray-400 mt-0.5">Ref. {{ b.referencia }}</p> }
            </div>
            <div class="text-right">
              <p class="text-gray-500">Total pagado</p>
              <p class="text-2xl font-bold text-emerald-700">S/ {{ b.monto | number:'1.2-2' }}</p>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t bg-gray-50 flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" (click)="cerrarBoleta()">Cerrar</button>
          <button type="button" class="btn btn-primary" (click)="imprimirBoleta()">
            <span class="icon icon-sm">print</span> Imprimir
          </button>
        </div>
      }
    </div>
  </div>
}

@if (toast()) {
  <div class="fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-lg z-[60] text-white flex items-center gap-2"
    [ngClass]="toast()!.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'">
    <span class="icon">{{ toast()!.tipo === 'success' ? 'check_circle' : 'error' }}</span>
    {{ toast()!.mensaje }}
  </div>
}
  `,
})
export class FinanzasPadreComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly auth = inject(AuthService);
  readonly svc = inject(FinanzasPadreService);

  readonly parentescoLabel = parentescoLabel;
  readonly estadoCargoBadge = estadoCargoBadge;
  readonly estadoCargoLabel = estadoCargoLabel;
  readonly metodoPagoLabel = metodoPagoLabel;
  readonly formatFechaCorta = formatFechaCorta;

  modalPago = signal(false);
  modalBoleta = signal(false);
  cargoPago = signal<CargoCuenta | null>(null);
  boleta = signal<BoletaVenta | null>(null);
  errorPago = signal('');
  toast = signal<{ tipo: 'success' | 'error'; mensaje: string } | null>(null);

  formVisa = {
    numeroTarjeta: '',
    nombreTitular: '',
    vencimiento: '',
    cvv: '',
  };

  vista = signal<'cuenta' | 'pagos'>('cuenta');
  readonly tabs: { id: 'cuenta' | 'pagos'; label: string; icon: string }[] = [
    { id: 'cuenta', label: 'Por pagar', icon: 'account_balance_wallet' },
    { id: 'pagos', label: 'Pagos realizados', icon: 'payments' },
  ];

  filtro = signal<FiltroCargo>('todos');
  readonly filtros: { id: FiltroCargo; label: string }[] = [
    { id: 'todos', label: 'Todas' },
    { id: 'pagados', label: 'Pagadas' },
    { id: 'pendientes', label: 'Pendientes' },
    { id: 'vencidos', label: 'Vencidas' },
  ];

  hijoId = computed(() => this.svc.hijoSeleccionado()?.studentId ?? null);
  cuenta = computed(() => this.svc.estadoCuenta());

  mensualidadesFiltradas = computed(() => {
    const c = this.cuenta();
    if (!c) return [];
    return filtrarCargos(c.mensualidades, this.filtro());
  });

  kpis = computed(() => {
    const r = this.cuenta()?.resumen;
    if (!r) return [];
    return [
      { label: 'Total año', value: r.totalDeuda, color: 'text-gray-800' },
      { label: 'Pagado', value: r.totalPagado, color: 'text-emerald-600' },
      { label: 'Pendiente', value: r.pendiente, color: 'text-amber-600' },
      { label: 'Vencido', value: r.vencido, color: 'text-red-600' },
    ];
  });

  pagosRealizados = computed(() => {
    const c = this.cuenta();
    if (!c) return [];
    const grupos: { tipo: string; cargos: CargoCuenta[] }[] = [
      ...(c.matricula ? [{ tipo: 'Matrícula', cargos: [c.matricula] }] : []),
      { tipo: 'Mensualidad', cargos: c.mensualidades },
      { tipo: 'Otro', cargos: c.otros },
    ];
    return grupos
      .flatMap(({ tipo, cargos }) =>
        cargos.flatMap(cargo =>
          cargo.pagos.map(p => ({
            ...p,
            tipo,
            concepto: cargo.concepto,
            periodoLabel: cargo.periodoLabel,
          })),
        ),
      )
      .sort((a, b) => b.fechaPago.localeCompare(a.fechaPago));
  });

  ngOnInit(): void {
    this.layout.setTitle('Estado de Cuenta');
    this.cargar();
  }

  cargar(): void {
    this.svc.loadHijos().subscribe({
      next: hijos => {
        if (hijos[0]) {
          this.svc.loadEstadoCuenta(hijos[0].studentId).subscribe();
        }
      },
    });
  }

  seleccionarHijo(hijo: HijoResumen): void {
    if (this.hijoId() === hijo.studentId) return;
    this.filtro.set('todos');
    this.vista.set('cuenta');
    this.svc.seleccionarHijo(hijo).subscribe();
  }

  tipoPagoBadge(tipo: string): string {
    const map: Record<string, string> = {
      Matrícula: 'badge-green',
      Mensualidad: 'badge-blue',
      Otro: 'badge-orange',
    };
    return map[tipo] ?? 'badge-gray';
  }

  abrirPagoVisa(cargo: CargoCuenta): void {
    this.cargoPago.set(cargo);
    this.errorPago.set('');
    this.formVisa = {
      numeroTarjeta: '',
      nombreTitular: this.auth.nombreCompleto()?.toUpperCase() ?? '',
      vencimiento: '',
      cvv: '',
    };
    this.modalPago.set(true);
  }

  cerrarPagoVisa(): void {
    this.modalPago.set(false);
    this.cargoPago.set(null);
    this.errorPago.set('');
  }

  formatearTarjeta(): void {
    const digits = this.formVisa.numeroTarjeta.replace(/\D/g, '').slice(0, 16);
    this.formVisa.numeroTarjeta = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  }

  formatearVencimiento(): void {
    let v = this.formVisa.vencimiento.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    this.formVisa.vencimiento = v;
  }

  confirmarPagoVisa(): void {
    const cargo = this.cargoPago();
    const studentId = this.hijoId();
    if (!cargo || !studentId) return;

    this.svc.payWithVisa(studentId, cargo.id, {
      numeroTarjeta: this.formVisa.numeroTarjeta.replace(/\D/g, ''),
      nombreTitular: this.formVisa.nombreTitular.trim(),
      vencimiento: this.formVisa.vencimiento,
      cvv: this.formVisa.cvv,
      monto: cargo.saldo,
    }).subscribe({
      next: result => {
        this.cerrarPagoVisa();
        this.vista.set('pagos');
        this.mostrarToast('success', `Pago registrado · Boleta ${result.numeroBoleta}`);
        this.svc.loadEstadoCuenta(studentId).subscribe();
      },
      error: err => {
        const msg = err?.error?.message;
        this.errorPago.set(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'No se pudo procesar el pago'));
      },
    });
  }

  verBoleta(paymentId: number): void {
    const studentId = this.hijoId();
    if (!studentId) return;
    this.boleta.set(null);
    this.modalBoleta.set(true);
    this.svc.getBoleta(studentId, paymentId).subscribe({
      next: data => this.boleta.set(data),
      error: () => {
        this.modalBoleta.set(false);
        this.mostrarToast('error', 'No se pudo cargar la boleta');
      },
    });
  }

  cerrarBoleta(): void {
    this.modalBoleta.set(false);
    this.boleta.set(null);
  }

  imprimirBoleta(): void {
    window.print();
  }

  formatFechaLarga(iso: string): string {
    return format(parseISO(iso), "d 'de' MMMM yyyy", { locale: es });
  }

  private mostrarToast(tipo: 'success' | 'error', mensaje: string): void {
    this.toast.set({ tipo, mensaje });
    setTimeout(() => this.toast.set(null), 4000);
  }
}
