import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LayoutService } from '../../../core/layout/services/layout.service';
import { MailApiService, MailStatus } from './mail-api.service';

@Component({
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div class="space-y-5 animate-fade-in">
      <div>
        <h2 class="text-xl font-bold text-gray-800">Configuración de Correo</h2>
        <p class="text-sm text-gray-500 mt-0.5">
          Envío SMTP desde desarrollo. Credenciales en <code class="text-xs bg-gray-100 px-1 rounded">escolar-backend/.env</code>
        </p>
      </div>

      @if (loading()) {
        <div class="card p-6 text-sm text-indigo-600">Cargando configuración...</div>
      }

      @if (error()) {
        <div class="card p-4 border border-red-200 bg-red-50 text-red-700 text-sm">{{ error() }}</div>
      }

      @if (status(); as s) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="card p-4">
            <div class="text-xs text-gray-500 uppercase tracking-wide">Estado</div>
            <div class="mt-2 flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full"
                    [ngClass]="s.enabled && s.mode !== 'off' ? 'bg-emerald-500' : 'bg-amber-400'"></span>
              <span class="font-semibold text-gray-800">
                {{ s.enabled ? (s.mode === 'smtp' ? 'Gmail / SMTP real' : s.mode === 'ethereal' ? 'Desarrollo (Ethereal)' : 'Sin transporte') : 'Desactivado' }}
              </span>
            </div>
          </div>
          <div class="card p-4">
            <div class="text-xs text-gray-500 uppercase tracking-wide">Remitente</div>
            <div class="mt-2 font-medium text-gray-800 text-sm">{{ s.fromName }}</div>
            <div class="text-xs text-gray-500">{{ s.from || s.user || '—' }}</div>
          </div>
          <div class="card p-4">
            <div class="text-xs text-gray-500 uppercase tracking-wide">Servidor</div>
            <div class="mt-2 font-medium text-gray-800 text-sm">{{ s.host || '—' }}:{{ s.port }}</div>
            <div class="text-xs text-gray-500">{{ s.hasPassword ? 'Contraseña configurada' : 'Sin MAIL_PASS (modo prueba)' }}</div>
          </div>
        </div>

        <div class="card p-5 space-y-4">
          <h3 class="font-semibold text-gray-800 flex items-center gap-2">
            <span class="icon text-indigo-500">send</span> Probar envío
          </h3>

          @if (s.mode === 'ethereal') {
            <div class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Modo desarrollo: los correos se envían a Ethereal (no llegan al buzón real).
              Tras enviar, abre el enlace <strong>Vista previa</strong> para ver el mensaje.
              Para Gmail real, agrega <code class="bg-white/70 px-1 rounded">MAIL_PASS</code> en <code class="bg-white/70 px-1 rounded">.env</code> y reinicia el backend.
            </div>
          }

          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1">
              <label class="form-label">Destinatario de prueba</label>
              <input class="form-input" type="email" [(ngModel)]="testTo" placeholder="correo@ejemplo.com">
            </div>
            <div class="flex items-end gap-2">
              <button class="btn btn-secondary" (click)="verificar()" [disabled]="testing()">
                Verificar conexión
              </button>
              <button class="btn btn-primary" (click)="enviarPrueba()" [disabled]="testing() || !testTo.trim()">
                <span class="icon text-base">mail</span>
                {{ testing() ? 'Enviando…' : 'Enviar prueba' }}
              </button>
            </div>
          </div>

          @if (verifyMsg()) {
            <div class="text-sm rounded-lg px-4 py-3 border"
                 [ngClass]="verifyOk() ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'">
              {{ verifyMsg() }}
            </div>
          }

          @if (previewUrl()) {
            <div class="rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              <div class="font-medium mb-1">Vista previa del correo enviado</div>
              <a [href]="previewUrl()" target="_blank" rel="noopener"
                 class="text-indigo-700 underline break-all">{{ previewUrl() }}</a>
            </div>
          }

          @if (testMsg()) {
            <div class="text-sm rounded-lg px-4 py-3 border"
                 [ngClass]="testOk() ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'">
              {{ testMsg() }}
            </div>
          }
        </div>

        <div class="card p-5">
          <h3 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span class="icon text-gray-500">settings</span> Variables en .env
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono text-gray-600">
            @for (line of envLines; track line) {
              <div class="bg-gray-50 rounded px-3 py-2 border border-gray-100">{{ line }}</div>
            }
          </div>
          <p class="text-xs text-gray-500 mt-3">
            Gmail: genera una contraseña de aplicación en Google → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones.
            Pégala en <code class="bg-gray-100 px-1 rounded">MAIL_PASS</code> y reinicia el backend.
          </p>
        </div>
      }
    </div>
  `,
})
export class CorreoConfigComponent implements OnInit {
  private readonly layout = inject(LayoutService);
  private readonly mailApi = inject(MailApiService);

  loading = signal(true);
  testing = signal(false);
  error = signal('');
  status = signal<MailStatus | null>(null);
  testTo = '';
  verifyMsg = signal('');
  verifyOk = signal(false);
  testMsg = signal('');
  testOk = signal(false);
  previewUrl = signal('');

  readonly envLines = [
    'MAIL_ENABLED=true',
    'SMTP_HOST=smtp.gmail.com',
    'SMTP_PORT=587',
    'MAIL_USER=magentadin@gmail.com',
    'MAIL_PASS=contraseña_de_aplicacion',
    'MAIL_FROM=magentadin@gmail.com',
    'MAIL_DEV_FALLBACK=ethereal',
  ];

  ngOnInit(): void {
    this.layout.setTitle('Configuración de Correo');
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    this.error.set('');
    this.mailApi.getStatus().subscribe({
      next: (s) => {
        this.status.set(s);
        this.testTo = s.testTo || s.user || '';
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la configuración de correo. Verifique que el backend esté activo.');
        this.loading.set(false);
      },
    });
  }

  verificar(): void {
    this.testing.set(true);
    this.verifyMsg.set('');
    this.mailApi.verify().subscribe({
      next: (r) => {
        this.verifyOk.set(r.ok);
        this.verifyMsg.set(r.message);
        this.testing.set(false);
      },
      error: () => {
        this.verifyOk.set(false);
        this.verifyMsg.set('Error al verificar la conexión SMTP.');
        this.testing.set(false);
      },
    });
  }

  enviarPrueba(): void {
    const to = this.testTo.trim();
    if (!to) return;
    this.testing.set(true);
    this.testMsg.set('');
    this.previewUrl.set('');
    this.mailApi.sendTest(to).subscribe({
      next: (r) => {
        this.testOk.set(r.sent && !r.simulated);
        if (r.previewUrl) {
          this.previewUrl.set(r.previewUrl);
          this.testMsg.set('Correo de prueba enviado. Abra la vista previa para verlo (modo desarrollo Ethereal).');
        } else if (r.sent) {
          this.testMsg.set(`Correo enviado a ${r.to}. Revise la bandeja de entrada.`);
        } else if (r.simulated) {
          this.testOk.set(false);
          this.testMsg.set('El correo se simuló porque no hay transporte SMTP configurado.');
        } else {
          this.testOk.set(false);
          this.testMsg.set('No se pudo completar el envío.');
        }
        this.testing.set(false);
        this.cargar();
      },
      error: () => {
        this.testOk.set(false);
        this.testMsg.set('Error al enviar el correo de prueba.');
        this.testing.set(false);
      },
    });
  }
}
