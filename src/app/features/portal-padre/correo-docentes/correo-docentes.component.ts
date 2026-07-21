import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import {
  CorreoDocentesService,
  ParentTeacherContact,
} from './correo-docentes.service';

@Component({
  standalone: true,
  imports: [FormsModule, NgClass, DatePipe],
  template: `
    <div class="space-y-5 animate-fade-in">
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Correo a docentes</h2>
          <p class="text-sm text-gray-400 mt-0.5">
            Escribe a los profesores de tus hijos vinculados
          </p>
        </div>
        <button class="btn btn-secondary btn-sm" (click)="cargar()" [disabled]="svc.loading() || svc.sending()">
          <span class="icon icon-sm">refresh</span> Actualizar
        </button>
      </div>

      @if (error()) {
        <div class="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{{ error() }}</div>
      }

      <div class="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <!-- Lista docentes -->
        <div class="xl:col-span-5 space-y-4">
          <div class="card overflow-hidden">
            <div class="px-4 py-3 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
              Docentes ({{ svc.teachers().length }})
            </div>
            @if (svc.loading()) {
              <div class="p-10 text-center text-sm text-gray-400">Cargando docentes…</div>
            } @else if (!svc.teachers().length) {
              <div class="p-10 text-center text-sm text-gray-400">
                No hay docentes con horario asignado a tus hijos.
              </div>
            } @else {
              <div class="divide-y divide-gray-100 max-h-[560px] overflow-y-auto">
                @for (t of svc.teachers(); track t.docenteId) {
                  <button type="button"
                    class="w-full text-left px-4 py-3 hover:bg-indigo-50/60 transition-colors"
                    [class.bg-indigo-50]="docenteSelId() === t.docenteId"
                    (click)="seleccionarDocente(t)">
                    <div class="flex items-start gap-3">
                      <div class="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {{ iniciales(t.nombreCompleto) }}
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-medium text-gray-900 text-sm">{{ t.nombreCompleto }}</p>
                        <p class="text-xs text-gray-500 truncate">{{ t.email }}</p>
                        @if (t.especialidad) {
                          <p class="text-[11px] text-gray-400 mt-0.5">{{ t.especialidad }}</p>
                        }
                        <p class="text-[11px] text-indigo-600 mt-1 truncate">
                          {{ t.cursos.join(' · ') || 'Sin cursos' }}
                        </p>
                      </div>
                    </div>
                  </button>
                }
              </div>
            }
          </div>
        </div>

        <!-- Composer + historial -->
        <div class="xl:col-span-7 space-y-4">
          <div class="card p-5">
            <h3 class="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span class="icon text-indigo-600">mail</span> Nuevo correo
            </h3>

            @if (!docenteSel()) {
              <p class="text-sm text-gray-400 py-8 text-center">
                Selecciona un docente de la lista para redactar el mensaje.
              </p>
            } @else {
              <div class="space-y-4">
                <div class="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p class="text-sm font-medium text-indigo-900">{{ docenteSel()!.nombreCompleto }}</p>
                  <p class="text-xs text-indigo-700">{{ docenteSel()!.email }}</p>
                </div>

                <div>
                  <label class="form-label">Respecto a hijo/a <span class="text-red-400">*</span></label>
                  <select class="form-input mt-1" [(ngModel)]="form.studentId">
                    <option [ngValue]="0">Seleccionar…</option>
                    @for (h of docenteSel()!.hijos; track h.studentId) {
                      <option [ngValue]="h.studentId">{{ h.nombreCompleto }} — {{ h.aulaLabel }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="form-label">Asunto <span class="text-red-400">*</span></label>
                  <input class="form-input mt-1" [(ngModel)]="form.asunto"
                    placeholder="Ej. Consulta sobre evaluación de Matemática">
                </div>

                <div>
                  <label class="form-label">Mensaje <span class="text-red-400">*</span></label>
                  <textarea class="form-input mt-1 min-h-36 resize-none" [(ngModel)]="form.cuerpo"
                    placeholder="Escribe tu mensaje al docente…"></textarea>
                </div>

                @if (errorForm()) {
                  <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {{ errorForm() }}
                  </div>
                }

                <div class="flex justify-end gap-2">
                  <button type="button" class="btn btn-ghost" (click)="limpiarForm()">Limpiar</button>
                  <button type="button" class="btn btn-primary" (click)="enviar()"
                    [disabled]="svc.sending()">
                    <span class="icon icon-sm">send</span>
                    {{ svc.sending() ? 'Enviando…' : 'Enviar correo' }}
                  </button>
                </div>
              </div>
            }
          </div>

          <div class="card overflow-hidden">
            <div class="px-4 py-3 border-b bg-gray-50 font-semibold text-gray-800 text-sm">
              Correos enviados
            </div>
            @if (!svc.messages().length) {
              <p class="text-sm text-gray-400 text-center py-8">Aún no has enviado correos.</p>
            } @else {
              <div class="divide-y divide-gray-50 max-h-80 overflow-y-auto">
                @for (m of svc.messages(); track m.id) {
                  <div class="px-4 py-3">
                    <div class="flex flex-wrap items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-900">{{ m.asunto }}</p>
                        <p class="text-xs text-gray-500 mt-0.5">
                          Para {{ m.docenteNombre }} · {{ m.studentNombre }}
                        </p>
                        <p class="text-xs text-gray-400 mt-1 line-clamp-2">{{ m.cuerpo }}</p>
                      </div>
                      <div class="text-right shrink-0">
                        <span class="badge badge-green text-[10px]">{{ m.estado }}</span>
                        <p class="text-[11px] text-gray-400 mt-1">
                          {{ m.createdAt | date:'dd/MM/yyyy HH:mm' }}
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    @if (toast()) {
      <div class="fixed bottom-5 right-5 px-5 py-3 rounded-xl shadow-lg z-50 text-white flex items-center gap-2"
        [ngClass]="toast()!.tipo === 'ok' ? 'bg-green-500' : 'bg-red-500'">
        <span class="icon">{{ toast()!.tipo === 'ok' ? 'check_circle' : 'error' }}</span>
        {{ toast()!.msg }}
      </div>
    }
  `,
})
export class CorreoDocentesComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  readonly svc = inject(CorreoDocentesService);

  readonly docenteSelId = signal<number | null>(null);
  readonly error = signal('');
  readonly errorForm = signal('');
  readonly toast = signal<{ msg: string; tipo: 'ok' | 'err' } | null>(null);

  form = { studentId: 0, asunto: '', cuerpo: '' };

  readonly docenteSel = computed(() =>
    this.svc.teachers().find((t) => t.docenteId === this.docenteSelId()) ?? null,
  );

  ngOnInit(): void {
    this.layout.setTitle('Correo a docentes');
    this.cargar();
  }

  cargar(): void {
    this.error.set('');
    this.svc.loadTeachers().subscribe({
      next: (items) => {
        this.svc.teachers.set(items);
        const current = this.docenteSelId();
        if (current && !items.some((t) => t.docenteId === current)) {
          this.docenteSelId.set(null);
          this.limpiarForm();
        }
      },
      error: () => {
        this.svc.teachers.set([]);
        this.error.set('No se pudieron cargar los docentes.');
      },
    });
    this.svc.loadMessages().subscribe({
      next: (items) => this.svc.messages.set(items),
      error: () => this.svc.messages.set([]),
    });
  }

  seleccionarDocente(t: ParentTeacherContact): void {
    this.docenteSelId.set(t.docenteId);
    this.errorForm.set('');
    this.form = {
      studentId: t.hijos[0]?.studentId ?? 0,
      asunto: '',
      cuerpo: '',
    };
  }

  limpiarForm(): void {
    const t = this.docenteSel();
    this.form = {
      studentId: t?.hijos[0]?.studentId ?? 0,
      asunto: '',
      cuerpo: '',
    };
    this.errorForm.set('');
  }

  enviar(): void {
    const t = this.docenteSel();
    if (!t) return;
    if (!this.form.studentId) {
      this.errorForm.set('Selecciona el hijo/a relacionado.');
      return;
    }
    if (!this.form.asunto.trim() || !this.form.cuerpo.trim()) {
      this.errorForm.set('Completa el asunto y el mensaje.');
      return;
    }

    this.errorForm.set('');
    this.svc
      .send({
        studentId: this.form.studentId,
        docenteId: t.docenteId,
        asunto: this.form.asunto.trim(),
        cuerpo: this.form.cuerpo.trim(),
      })
      .subscribe({
        next: (msg) => {
          this.svc.messages.update((list) => [msg, ...list]);
          this.limpiarForm();
          this.mostrarToast('Correo enviado correctamente.');
        },
        error: (err) => {
          const m = err?.error?.message;
          this.errorForm.set(
            Array.isArray(m) ? m.join(', ') : m ?? 'No se pudo enviar el correo.',
          );
        },
      });
  }

  iniciales(nombre: string): string {
    const parts = nombre.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
  }

  private mostrarToast(msg: string, tipo: 'ok' | 'err' = 'ok'): void {
    this.toast.set({ msg, tipo });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
