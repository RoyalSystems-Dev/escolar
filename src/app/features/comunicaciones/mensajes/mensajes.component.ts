import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutService } from '../../../core/layout/services/layout.service';

// ── Types ───────────────────────────────────────────────────────────────────
type TipoMsg  = 'general' | 'tarea' | 'inasistencia' | 'tardanza' | 'actividad';
type Carpeta  = 'entrada' | 'enviados' | 'destacados';

interface Persona {
  id: number; nombre: string; email: string;
  rol: 'DOCENTE' | 'PADRE' | 'ESTUDIANTE' | 'ADMIN'; ini: string;
}
interface Mensaje {
  id: number; carpeta: Carpeta; tipo: TipoMsg; asunto: string; cuerpo: string;
  de: Persona; para: Persona[]; fecha: Date; leido: boolean;
  envioPorCorreo: boolean; destacado: boolean;
  ctx?: { alumno?: string; grado?: string; seccion?: string; curso?: string; detalle?: string; };
}

// ── Mock Data ───────────────────────────────────────────────────────────────
const ME: Persona = { id: 0, nombre: 'Administración', email: 'admin@colegiopedroni.edu.pe', rol: 'ADMIN', ini: 'AD' };
const CONTACTOS: Persona[] = [
  { id: 1, nombre: 'Prof. Roberto Mendoza', email: 'r.mendoza@colegiopedroni.edu.pe', rol: 'DOCENTE', ini: 'RM' },
  { id: 2, nombre: 'Prof. Carmen Salcedo',  email: 'c.salcedo@colegiopedroni.edu.pe', rol: 'DOCENTE', ini: 'CS' },
  { id: 3, nombre: 'Prof. Jorge Pérez',     email: 'j.perez@colegiopedroni.edu.pe',   rol: 'DOCENTE', ini: 'JP' },
  { id: 4, nombre: 'Sra. María García',     email: 'maria.garcia@gmail.com',           rol: 'PADRE',   ini: 'MG' },
  { id: 5, nombre: 'Sr. Carlos Torres',     email: 'carlos.torres@hotmail.com',        rol: 'PADRE',   ini: 'CT' },
  { id: 6, nombre: 'Sra. Rosa Díaz',        email: 'rosa.diaz@yahoo.com',              rol: 'PADRE',   ini: 'RD' },
  { id: 7, nombre: 'Sr. Luis Quispe',       email: 'luis.quispe@gmail.com',            rol: 'PADRE',   ini: 'LQ' },
  { id: 8, nombre: 'Dir. Ricardo Sánchez',  email: 'director@colegiopedroni.edu.pe',   rol: 'ADMIN',   ini: 'RS' },
];
const NOW = new Date('2026-06-15T09:00:00');
function h(hrs: number): Date { return new Date(NOW.getTime() - hrs * 3_600_000); }

const MOCK_MSGS: Mensaje[] = [
  // ── Bandeja ──
  { id:1, carpeta:'entrada', tipo:'general', asunto:'Consulta sobre calificaciones del bimestre',
    cuerpo:'Buenos días,\n\nLe escribo para consultar sobre las calificaciones de la evaluación del segundo bimestre. Mi hijo Juan García aún no ha recibido su libreta y me gustaría saber cuándo estarán disponibles.\n\nQuedo a la espera de su respuesta.\n\nAtentamente,\nMaría García',
    de:CONTACTOS[3], para:[ME], fecha:h(1.5), leido:false, envioPorCorreo:false, destacado:false,
    ctx:{ alumno:'Juan García', grado:'5°', seccion:'A' } },
  { id:2, carpeta:'entrada', tipo:'general', asunto:'Re: Inasistencia de Ana Torres — Lunes 15 Jun',
    cuerpo:'Estimada Administración,\n\nGracias por avisarme. Ana estuvo enferma ese día con fiebre. Adjunto la justificación médica firmada.\n\nGracias,\nCarlos Torres',
    de:CONTACTOS[4], para:[ME], fecha:h(4), leido:true, envioPorCorreo:false, destacado:false,
    ctx:{ alumno:'Ana Torres', grado:'5°', seccion:'A' } },
  { id:3, carpeta:'entrada', tipo:'general', asunto:'Reunión de coordinación pedagógica — Semana 3',
    cuerpo:'Estimados colegas,\n\nLes convoco a la reunión de coordinación pedagógica para el viernes 19 de junio a las 3:30 PM en la sala de reuniones.\n\nTemas:\n1. Avance curricular del bimestre\n2. Evaluaciones pendientes\n3. Actividades extracurriculares\n\nSaludos,\nDir. Ricardo Sánchez',
    de:CONTACTOS[7], para:[ME], fecha:h(8), leido:false, envioPorCorreo:false, destacado:true },
  { id:4, carpeta:'entrada', tipo:'tarea', asunto:'Consulta: Tarea de Álgebra — Luis Quispe Jr.',
    cuerpo:'Prof. buenas tardes,\n\nMi hijo Luis Quispe Jr. tiene dudas sobre los ejercicios de la página 45, específicamente el ejercicio 3b de factorización. ¿Podría orientarnos?\n\nGracias,\nLuis Quispe',
    de:CONTACTOS[6], para:[ME], fecha:h(24), leido:true, envioPorCorreo:false, destacado:false,
    ctx:{ alumno:'Luis Quispe Jr.', grado:'3°', seccion:'A', curso:'Álgebra' } },
  { id:5, carpeta:'entrada', tipo:'actividad', asunto:'Confirmación: Feria de Ciencias — Rosa Díaz Jr.',
    cuerpo:'Estimada Administración,\n\nConfirmo la participación de mi hija Rosa Díaz Jr. en la Feria de Ciencias del próximo viernes. Toda la familia asistirá.\n\n¡Gracias por organizar este tipo de actividades!\n\nSaludos,\nRosa Díaz',
    de:CONTACTOS[5], para:[ME], fecha:h(30), leido:true, envioPorCorreo:false, destacado:false,
    ctx:{ alumno:'Rosa Díaz Jr.', grado:'3°', seccion:'A' } },
  // ── Enviados ──
  { id:6, carpeta:'enviados', tipo:'inasistencia', asunto:'Inasistencia: Juan García — 5°A · Lunes 15 Jun',
    cuerpo:'Estimada Sra. María García,\n\nLe comunicamos que su hijo/a Juan García, del grado 5° sección A, registró INASISTENCIA el día lunes 15 de junio de 2026.\n\nSi la inasistencia fue justificada, le pedimos enviar la documentación correspondiente dentro de las próximas 48 horas.\n\nAtentamente,\nAdministración — Colegio Pedroni',
    de:ME, para:[CONTACTOS[3]], fecha:h(0.5), leido:true, envioPorCorreo:true, destacado:false,
    ctx:{ alumno:'Juan García', grado:'5°', seccion:'A', detalle:'Falta sin justificar — Lunes 15 Jun 2026' } },
  { id:7, carpeta:'enviados', tipo:'tardanza', asunto:'Tardanza: Ana Torres — 5°A · Lunes 15 Jun',
    cuerpo:'Estimado Sr. Carlos Torres,\n\nLe comunicamos que su hijo/a Ana Torres, del grado 5° sección A, registró TARDANZA el día lunes 15 de junio de 2026, llegando a las 08:15 hrs (15 minutos de tardanza).\n\nLe pedimos tomar las medidas necesarias para garantizar la puntualidad (inicio: 07:45 hrs).\n\nAtentamente,\nAdministración — Colegio Pedroni',
    de:ME, para:[CONTACTOS[4]], fecha:h(1), leido:true, envioPorCorreo:true, destacado:false,
    ctx:{ alumno:'Ana Torres', grado:'5°', seccion:'A', detalle:'Tardanza 15 min — llegó 08:15 hrs' } },
  { id:8, carpeta:'enviados', tipo:'tarea', asunto:'Tarea: Matemática — Ejercicios pág. 45-50 · 5°A',
    cuerpo:'Estimadas familias del grado 5° sección A,\n\nLe informamos que el Prof. Roberto Mendoza ha asignado la siguiente tarea:\n\nCURSO: Matemática\nTAREA: Resolver ejercicios páginas 45 a 50 del libro de trabajo\nFECHA DE ENTREGA: Miércoles 17 de junio de 2026\nIMPORTANTE: El estudiante debe mostrar el procedimiento completo.\n\nAtentamente,\nAdministración — Colegio Pedroni',
    de:ME, para:[CONTACTOS[3],CONTACTOS[4],CONTACTOS[5],CONTACTOS[6]], fecha:h(6), leido:true, envioPorCorreo:true, destacado:false,
    ctx:{ grado:'5°', seccion:'A', curso:'Matemática', detalle:'Ejercicios pág. 45-50 · Entrega: Mié 17 Jun' } },
  { id:9, carpeta:'enviados', tipo:'actividad', asunto:'Actividad: Feria de Ciencias — 3°A · Vie 19 Jun',
    cuerpo:'Estimadas familias del grado 3° sección A,\n\nNos complace invitarlos a la FERIA DE CIENCIAS:\n\nFecha: Viernes 19 de junio de 2026\nHora: 9:00 AM – 12:00 PM\nLugar: Patio principal\nVestimenta: Uniforme de educación física\n\nSus hijos presentarán sus proyectos de investigación. ¡Los esperamos!\n\nAtentamente,\nAdministración — Colegio Pedroni',
    de:ME, para:[CONTACTOS[5],CONTACTOS[6]], fecha:h(12), leido:true, envioPorCorreo:true, destacado:false,
    ctx:{ grado:'3°', seccion:'A', detalle:'Vie 19 Jun · 9:00 AM - 12:00 PM · Patio principal' } },
  { id:10, carpeta:'enviados', tipo:'tardanza', asunto:'Tardanza: Luis Quispe Jr. — 3°A · Vie 12 Jun',
    cuerpo:'Estimado Sr. Luis Quispe,\n\nLe comunicamos que su hijo/a Luis Quispe Jr., del grado 3° sección A, registró TARDANZA el viernes 12 de junio de 2026, llegando a las 08:20 hrs (20 min). Esta es la segunda tardanza del mes.\n\nSolicitamos su apoyo para garantizar la puntualidad.\n\nAtentamente,\nAdministración — Colegio Pedroni',
    de:ME, para:[CONTACTOS[6]], fecha:h(72), leido:true, envioPorCorreo:true, destacado:false,
    ctx:{ alumno:'Luis Quispe Jr.', grado:'3°', seccion:'A', detalle:'2da tardanza del mes — llegó 08:20 hrs' } },
];
let _nextId = 200;

// ── Component ────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
<div class="animate-fade-in flex flex-col" style="height:calc(100vh - 8.5rem); min-height:520px">

  <!-- ── Toast ── -->
  @if (toast()) {
    <div class="fixed bottom-6 right-6 z-[100] flex items-start gap-3 px-5 py-3.5 rounded-xl shadow-2xl border animate-slide-in-r max-w-sm"
      [ngClass]="toast()!.tipo==='ok' ? 'bg-white border-emerald-300' : 'bg-white border-red-300'">
      <span class="text-lg mt-0.5">{{ toast()!.tipo==='ok' ? '✅' : '🗑️' }}</span>
      <p class="text-sm text-gray-700 font-medium leading-snug flex-1">{{ toast()!.msg }}</p>
      <button (click)="toast.set(null)" class="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
    </div>
  }

  <!-- ── Header ── -->
  <div class="flex items-center justify-between mb-3 flex-shrink-0">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Mensajería Interna</h1>
      <p class="text-sm text-gray-500 mt-0.5">Comunicación en plataforma · con notificación por correo electrónico</p>
    </div>
    <div class="flex items-center gap-3">
      @if (noLeidos() > 0) {
        <span class="badge badge-indigo text-xs">{{ noLeidos() }} sin leer</span>
      }
      <button (click)="abrirCompose()" class="btn btn-primary text-sm gap-1.5">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M15.232 5.232l3.536 3.536M9 11l6-6 3.536 3.536-6 6H9v-3.536z"/>
        </svg>
        Redactar
      </button>
    </div>
  </div>

  <!-- ── 3-Panel Layout ── -->
  <div class="flex flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">

    <!-- ═══ SIDEBAR (208px) ═══════════════════════════════════════════ -->
    <aside class="w-52 border-r border-gray-100 flex flex-col bg-gray-50 flex-shrink-0">
      <div class="p-3">
        <button (click)="abrirCompose()"
          class="w-full flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15.232 5.232l3.536 3.536M9 11l6-6 3.536 3.536-6 6H9v-3.536z"/>
          </svg>
          Redactar
        </button>
      </div>
      <!-- Folders nav -->
      <nav class="px-2 space-y-0.5">
        @for (f of FOLDERS; track f.id) {
          <button class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all"
            [ngClass]="carpeta()===f.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'"
            (click)="cambiarCarpeta($any(f.id))">
            <span>{{ f.icon }}</span>
            <span class="flex-1 text-left">{{ f.label }}</span>
            @if (f.id==='entrada' && noLeidos()>0) {
              <span class="text-xs font-bold bg-indigo-600 text-white rounded-full px-1.5 py-0.5 leading-none">{{ noLeidos() }}</span>
            }
            @if (f.id==='destacados' && destacados()>0) {
              <span class="text-xs font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 leading-none">{{ destacados() }}</span>
            }
          </button>
        }
      </nav>
      <!-- Divider -->
      <div class="mx-3 my-3 border-t border-gray-200"></div>
      <!-- Quick send -->
      <div class="px-2 pb-3">
        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">Envío rápido</p>
        @for (er of ENVIOS_RAPIDOS; track er.tipo) {
          <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-transparent transition-all group"
            [ngClass]="er.hoverCls"
            (click)="abrirCompose($any(er.tipo))">
            <span class="w-2 h-2 rounded-full flex-shrink-0" [ngClass]="er.dot"></span>
            <span class="flex-1 text-left text-gray-600 group-hover:text-gray-900 text-xs">{{ er.label }}</span>
            <svg class="w-3 h-3 text-gray-300 group-hover:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        }
      </div>
      <!-- Footer -->
      <div class="mt-auto p-3 border-t border-gray-100">
        <div class="flex items-center gap-1.5 text-xs text-gray-400">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          En línea — admin@colegiopedroni
        </div>
      </div>
    </aside>

    <!-- ═══ MESSAGE LIST (272px) ══════════════════════════════════════ -->
    <div class="w-68 border-r border-gray-100 flex flex-col flex-shrink-0" style="width:272px">
      <!-- Search + filter -->
      <div class="p-3 border-b border-gray-100 space-y-2">
        <input type="text" placeholder="🔍 Buscar mensajes…"
          class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50"
          [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)">
        <div class="flex flex-wrap gap-1">
          <button class="text-xs px-2 py-0.5 rounded-full border transition-all"
            [ngClass]="filtroTipo()==='todos' ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-400'"
            (click)="filtroTipo.set('todos')">Todos</button>
          @for (t of TIPOS_LIST; track t) {
            <button class="text-xs px-2 py-0.5 rounded-full border transition-all"
              [ngClass]="filtroTipo()===t ? TIPO_CFG[t].activeCls : 'border-gray-200 text-gray-500 hover:border-gray-300'"
              (click)="filtroTipo.set($any(t))" [title]="TIPO_CFG[t].label">{{ TIPO_CFG[t].icon }}</button>
          }
        </div>
      </div>
      <!-- List -->
      <div class="flex-1 overflow-y-auto divide-y divide-gray-50">
        @for (m of mensajesFiltrados(); track m.id) {
          <div class="cursor-pointer px-3 py-3 hover:bg-gray-50 transition-colors border-l-4"
            [ngClass]="selId()===m.id ? 'bg-indigo-50 border-indigo-400' : 'border-transparent'"
            (click)="seleccionar(m.id)">
            <div class="flex items-start gap-2.5">
              <div class="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                [ngClass]="avatarBg(m.de.ini)">{{ m.de.ini }}</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between gap-1 mb-0.5">
                  <span class="text-xs truncate" [ngClass]="!m.leido ? 'font-bold text-gray-900' : 'font-medium text-gray-600'">
                    {{ m.de.id===0 ? 'Tú → '+m.para[0].nombre : m.de.nombre }}
                  </span>
                  <span class="text-xs text-gray-400 flex-shrink-0">{{ formatFecha(m.fecha) }}</span>
                </div>
                <p class="text-xs truncate mb-1" [ngClass]="!m.leido ? 'text-gray-800 font-medium' : 'text-gray-500'">{{ m.asunto }}</p>
                <div class="flex items-center gap-1 flex-wrap">
                  <span class="text-xs px-1.5 py-0.5 rounded-full font-medium border leading-tight" [ngClass]="TIPO_CFG[m.tipo].chipCls">
                    {{ TIPO_CFG[m.tipo].icon }} {{ TIPO_CFG[m.tipo].label }}
                  </span>
                  @if (m.envioPorCorreo) { <span class="text-xs text-blue-500" title="Enviado por correo">📧</span> }
                  @if (m.destacado)       { <span class="text-xs text-amber-400">★</span> }
                  @if (!m.leido)          { <span class="ml-auto w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"></span> }
                </div>
              </div>
            </div>
          </div>
        }
        @empty {
          <div class="flex flex-col items-center justify-center h-48 text-center p-4">
            <span class="text-4xl mb-2">📭</span>
            <p class="text-sm text-gray-500">No hay mensajes</p>
          </div>
        }
      </div>
    </div>

    <!-- ═══ MESSAGE DETAIL (flex-1) ══════════════════════════════════ -->
    <div class="flex-1 flex flex-col overflow-hidden">
      @if (msgSel(); as m) {

        <!-- Message header -->
        <div class="px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex-1 min-w-0">
              <h2 class="text-xl font-bold text-gray-900 mb-2 leading-tight">{{ m.asunto }}</h2>
              <div class="flex flex-wrap gap-1.5">
                <span class="text-xs px-2.5 py-1 rounded-full font-semibold border" [ngClass]="TIPO_CFG[m.tipo].chipCls">
                  {{ TIPO_CFG[m.tipo].icon }} {{ TIPO_CFG[m.tipo].label }}
                </span>
                @if (m.envioPorCorreo) {
                  <span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                    📧 Enviado por correo
                  </span>
                }
                @if (!m.leido) {
                  <span class="text-xs px-2.5 py-1 rounded-full font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200">Nuevo</span>
                }
              </div>
            </div>
            <!-- Actions -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <button class="btn btn-icon text-xl" [ngClass]="m.destacado ? 'text-amber-400' : 'text-gray-300 hover:text-amber-400'"
                title="Destacar" (click)="toggleDestacado($event, m.id)">★</button>
              @if (m.carpeta==='entrada') {
                <button class="btn btn-secondary text-xs gap-1" (click)="responder(m)">↩ Responder</button>
              }
              <button class="btn btn-icon text-gray-400 hover:text-red-500" title="Eliminar" (click)="eliminar(m.id)">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
          <!-- Meta: De / Para / Fecha -->
          <div class="space-y-1.5 text-sm">
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-10 text-right">De:</span>
              <div class="flex items-center gap-2 flex-wrap">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  [ngClass]="avatarBg(m.de.ini)">{{ m.de.ini }}</div>
                <span class="font-semibold text-gray-800">{{ m.de.nombre }}</span>
                <span class="text-xs px-1.5 py-0.5 rounded-full font-medium" [ngClass]="rolBadgeCls(m.de.rol)">{{ rolLabel(m.de.rol) }}</span>
                <span class="text-gray-400 text-xs">{{ m.de.email }}</span>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-gray-400 text-xs w-10 text-right mt-0.5">Para:</span>
              <div class="flex flex-wrap gap-1">
                @for (p of m.para; track p.id) {
                  <span class="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{{ p.nombre }}</span>
                }
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-gray-400 text-xs w-10 text-right">Fecha:</span>
              <span class="text-gray-600 text-xs">{{ formatFechaCompleta(m.fecha) }}</span>
            </div>
          </div>
        </div>

        <!-- Scrollable body -->
        <div class="flex-1 overflow-y-auto">

          <!-- Context card -->
          @if (m.ctx && (m.ctx.alumno || m.ctx.grado || m.ctx.curso || m.ctx.detalle)) {
            <div class="mx-6 mt-4 p-4 rounded-xl border" [ngClass]="ctxCardCls(m.tipo)">
              <p class="text-xs font-bold uppercase tracking-wide opacity-70 mb-2">{{ TIPO_CFG[m.tipo].icon }} Información del {{ TIPO_CFG[m.tipo].label }}</p>
              <div class="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                @if (m.ctx!.alumno) {
                  <div class="flex gap-2"><span class="opacity-60 w-16">Alumno:</span><span class="font-semibold">{{ m.ctx!.alumno }}</span></div>
                }
                @if (m.ctx!.grado) {
                  <div class="flex gap-2"><span class="opacity-60 w-16">Grado:</span><span class="font-semibold">{{ m.ctx!.grado }}{{ m.ctx!.seccion ? ' · Sec. '+m.ctx!.seccion : '' }}</span></div>
                }
                @if (m.ctx!.curso) {
                  <div class="flex gap-2"><span class="opacity-60 w-16">Curso:</span><span class="font-semibold">{{ m.ctx!.curso }}</span></div>
                }
                @if (m.ctx!.detalle) {
                  <div class="col-span-2 flex gap-2 mt-0.5"><span class="opacity-60 w-16">Detalle:</span><span class="font-semibold">{{ m.ctx!.detalle }}</span></div>
                }
              </div>
            </div>
          }

          <!-- Email evidence -->
          @if (m.envioPorCorreo) {
            <div class="mx-6 mt-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div class="flex items-center gap-2 text-blue-800 font-semibold text-sm mb-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Enviado también por correo electrónico
              </div>
              @for (p of m.para; track p.id) {
                <div class="flex items-center gap-2 text-xs text-blue-700 py-0.5">
                  <svg class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span class="font-medium">{{ p.nombre }}</span>
                  <span class="opacity-50">—</span>
                  <span>{{ p.email }}</span>
                </div>
              }
              <p class="text-xs text-blue-400 mt-2 italic">
                El destinatario recibió una copia en su buzón de correo externo al momento del envío.
              </p>
            </div>
          }

          <!-- Body -->
          <div class="px-6 py-5">
            <div class="whitespace-pre-wrap text-gray-700 text-sm leading-relaxed">{{ m.cuerpo }}</div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2 flex-shrink-0">
          @if (m.carpeta==='entrada') {
            <button class="btn btn-primary text-sm gap-1" (click)="responder(m)">↩ Responder</button>
          }
          <button class="btn btn-secondary text-sm" (click)="abrirCompose()">↪ Reenviar</button>
          <span class="flex-1"></span>
          <button class="btn btn-ghost text-sm text-red-500 hover:bg-red-50" (click)="eliminar(m.id)">Eliminar</button>
        </div>

      } @else {
        <!-- Empty state -->
        <div class="flex-1 flex flex-col items-center justify-center text-center p-10 bg-gradient-to-b from-white to-gray-50">
          <div class="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
            <svg class="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-gray-700 mb-1">Selecciona un mensaje</h3>
          <p class="text-sm text-gray-400 mb-6">Elige un mensaje de la lista o redacta uno nuevo</p>
          <div class="grid grid-cols-2 gap-3 w-full max-w-xs">
            @for (er of ENVIOS_RAPIDOS; track er.tipo) {
              <button class="p-4 rounded-xl border-2 border-dashed text-sm font-medium transition-all"
                [ngClass]="er.cardCls" (click)="abrirCompose($any(er.tipo))">
                <div class="text-2xl mb-1">{{ TIPO_CFG[er.tipo].icon }}</div>
                <div class="text-xs">{{ er.label }}</div>
              </button>
            }
          </div>
        </div>
      }
    </div>
  </div>

  <!-- ═══ COMPOSE MODAL ════════════════════════════════════════════════ -->
  @if (composeOpen()) {
    <div class="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      (click)="composeOpen.set(false)">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 class="text-lg font-bold text-gray-900">Redactar mensaje</h3>
            <p class="text-xs text-gray-500 mt-0.5">Plataforma interna · con opción de correo electrónico</p>
          </div>
          <button (click)="composeOpen.set(false)" class="text-gray-400 hover:text-gray-700 text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          <!-- Tipo -->
          <div>
            <label class="form-label">Tipo de mensaje</label>
            <div class="flex flex-wrap gap-2 mt-1">
              @for (t of TIPOS_LIST; track t) {
                <button class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-all"
                  [ngClass]="cTipo()===t ? TIPO_CFG[t].activeCls : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'"
                  (click)="onTipoChange($any(t))">
                  {{ TIPO_CFG[t].icon }} {{ TIPO_CFG[t].label }}
                </button>
              }
            </div>
          </div>

          <!-- Destinatarios -->
          <div>
            <label class="form-label">Para <span class="text-red-500">*</span>
              <span class="text-gray-400 font-normal ml-1">({{ cPara().length }} sel.)</span>
            </label>
            <div class="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl mt-1 max-h-32 overflow-y-auto bg-gray-50">
              @for (c of CONTACTOS_LIST; track c.id) {
                <button class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border-2 transition-all"
                  [ngClass]="cPara().includes(c.id) ? rolBadgeCls(c.rol)+' border-current shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'"
                  (click)="toggleDestinatario(c.id)">
                  @if (cPara().includes(c.id)) { ✓ }
                  {{ c.nombre }}
                  <span class="opacity-50">{{ rolLabel(c.rol) }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Context fields -->
          @if (cTipo()!=='general') {
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <p class="text-xs font-bold text-gray-500 uppercase tracking-wide">Datos del {{ TIPO_CFG[cTipo()].label }}</p>
              <div class="grid grid-cols-2 gap-3">
                @if (cTipo()==='inasistencia' || cTipo()==='tardanza') {
                  <div class="col-span-2">
                    <label class="form-label text-xs">Alumno/a</label>
                    <input class="form-input text-sm" placeholder="Nombre completo del alumno"
                      [ngModel]="cAlumno()" (ngModelChange)="cAlumno.set($event); actualizarAsunto()">
                  </div>
                }
                @if (cTipo()==='tarea' || cTipo()==='actividad') {
                  <div class="col-span-2">
                    <label class="form-label text-xs">{{ cTipo()==='tarea' ? 'Curso / Materia' : 'Nombre de la actividad' }}</label>
                    <input class="form-input text-sm"
                      [placeholder]="cTipo()==='tarea' ? 'Ej: Matemática, Comunicación…' : 'Ej: Feria de Ciencias…'"
                      [ngModel]="cCurso()" (ngModelChange)="cCurso.set($event); actualizarAsunto()">
                  </div>
                }
                <div>
                  <label class="form-label text-xs">Grado</label>
                  <select class="form-input text-sm" [ngModel]="cGrado()" (ngModelChange)="cGrado.set($event); actualizarAsunto()">
                    <option value="">— Seleccionar —</option>
                    @for (g of ['1°','2°','3°','4°','5°','6°']; track g) { <option [value]="g">{{ g }}</option> }
                  </select>
                </div>
                <div>
                  <label class="form-label text-xs">Sección</label>
                  <div class="flex gap-1.5 mt-0.5">
                    @for (s of ['A','B','C']; track s) {
                      <button class="flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all"
                        [ngClass]="cSeccion()===s ? 'bg-indigo-100 text-indigo-700 border-indigo-400' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'"
                        (click)="cSeccion.set(s); actualizarAsunto()">{{ s }}</button>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Asunto -->
          <div>
            <label class="form-label">Asunto</label>
            <input class="form-input text-sm mt-1" placeholder="Asunto del mensaje"
              [ngModel]="cAsunto()" (ngModelChange)="cAsunto.set($event)">
          </div>

          <!-- Cuerpo -->
          <div>
            <div class="flex items-center justify-between mb-1">
              <label class="form-label">Mensaje</label>
              @if (cTipo()!=='general') {
                <button class="text-xs text-indigo-600 hover:underline" (click)="cCuerpo.set(generarPlantilla(cTipo()))">↺ Usar plantilla</button>
              }
            </div>
            <textarea class="form-input text-sm resize-none leading-relaxed" rows="7"
              [ngModel]="cCuerpo()" (ngModelChange)="cCuerpo.set($event)"
              placeholder="Escriba el mensaje aquí…"></textarea>
          </div>

          <!-- Email toggle -->
          <div class="flex items-center gap-4 p-4 rounded-xl border-2 transition-all"
            [ngClass]="cEnviarCorreo() ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              [ngClass]="cEnviarCorreo() ? 'bg-blue-100' : 'bg-gray-200'">📧</div>
            <div class="flex-1">
              <p class="text-sm font-semibold" [ngClass]="cEnviarCorreo() ? 'text-blue-900' : 'text-gray-600'">
                Enviar también por correo electrónico
              </p>
              <p class="text-xs mt-0.5" [ngClass]="cEnviarCorreo() ? 'text-blue-600' : 'text-gray-400'">
                @if (cEnviarCorreo()) {
                  Se enviará una copia al correo externo de cada destinatario
                } @else {
                  Solo se enviará dentro de la plataforma
                }
              </p>
              @if (cEnviarCorreo() && cPara().length > 0) {
                <div class="mt-2 space-y-0.5">
                  @for (id of cPara(); track id) {
                    @let ct = contactoById(id);
                    @if (ct) {
                      <div class="flex items-center gap-1.5 text-xs text-blue-700">
                        <svg class="w-3 h-3 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                        </svg>
                        <span class="font-medium">{{ ct.nombre }}</span>
                        <span class="opacity-50">—</span>
                        <span>{{ ct.email }}</span>
                      </div>
                    }
                  }
                </div>
              }
            </div>
            <button class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0"
              [ngClass]="cEnviarCorreo() ? 'bg-blue-600' : 'bg-gray-300'"
              (click)="cEnviarCorreo.set(!cEnviarCorreo())">
              <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform"
                [ngClass]="cEnviarCorreo() ? 'translate-x-6' : 'translate-x-1'"></span>
            </button>
          </div>

        </div><!-- /body -->

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <p class="text-xs">
            @if (cEnviarCorreo() && cPara().length > 0) {
              <span class="text-blue-600 font-medium">📧 Correo a {{ cPara().length }} destinatario{{ cPara().length!==1 ? 's' : '' }}</span>
            }
          </p>
          <div class="flex gap-2">
            <button (click)="composeOpen.set(false)" class="btn btn-secondary text-sm">Cancelar</button>
            <button (click)="enviar()" [disabled]="!puedeEnviar()"
              class="btn btn-primary text-sm gap-1.5"
              [ngClass]="!puedeEnviar() ? 'opacity-40 cursor-not-allowed' : ''">
              @if (cEnviarCorreo()) {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Enviar + Correo
              } @else {
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                </svg>
                Enviar mensaje
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  }

</div>
  `,
})
export class MensajesComponent implements OnInit {
  private readonly layout = inject(LayoutService);

  // ── State ──────────────────────────────────────────────────────────────
  _mensajes  = signal<Mensaje[]>(MOCK_MSGS);
  carpeta    = signal<Carpeta>('entrada');
  selId      = signal<number | null>(null);
  busqueda   = signal('');
  filtroTipo = signal<TipoMsg | 'todos'>('todos');
  toast      = signal<{ msg: string; tipo: 'ok' | 'err' } | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  // Compose
  composeOpen   = signal(false);
  cTipo         = signal<TipoMsg>('general');
  cPara         = signal<number[]>([]);
  cAsunto       = signal('');
  cCuerpo       = signal('');
  cAlumno       = signal('');
  cGrado        = signal('');
  cSeccion      = signal('A');
  cCurso        = signal('');
  cEnviarCorreo = signal(true);

  // ── Static data ────────────────────────────────────────────────────────
  readonly CONTACTOS_LIST = CONTACTOS;
  readonly TIPOS_LIST: TipoMsg[] = ['general', 'tarea', 'inasistencia', 'tardanza', 'actividad'];
  readonly TIPO_CFG: Record<TipoMsg, { label: string; icon: string; chipCls: string; activeCls: string }> = {
    general:      { label:'General',     icon:'💬', chipCls:'bg-gray-100 text-gray-700 border-gray-200',         activeCls:'bg-gray-800 text-white border-gray-800'         },
    tarea:        { label:'Tarea',        icon:'📝', chipCls:'bg-violet-100 text-violet-700 border-violet-200',   activeCls:'bg-violet-600 text-white border-violet-600'     },
    inasistencia: { label:'Inasistencia', icon:'🔴', chipCls:'bg-red-100 text-red-700 border-red-200',            activeCls:'bg-red-600 text-white border-red-600'           },
    tardanza:     { label:'Tardanza',     icon:'⏰', chipCls:'bg-orange-100 text-orange-700 border-orange-200',   activeCls:'bg-orange-500 text-white border-orange-500'     },
    actividad:    { label:'Actividad',    icon:'🎯', chipCls:'bg-emerald-100 text-emerald-700 border-emerald-200',activeCls:'bg-emerald-600 text-white border-emerald-600'   },
  };
  readonly FOLDERS = [
    { id:'entrada',   label:'Bandeja entrada', icon:'📥' },
    { id:'enviados',  label:'Enviados',         icon:'✈️'  },
    { id:'destacados',label:'Destacados',       icon:'⭐' },
  ];
  readonly ENVIOS_RAPIDOS = [
    { tipo:'tarea'        as TipoMsg, label:'Enviar Tarea',        dot:'bg-violet-500',  hoverCls:'hover:bg-violet-50 hover:border-violet-200',  cardCls:'border-violet-300 text-violet-700 hover:bg-violet-50 bg-white'   },
    { tipo:'inasistencia' as TipoMsg, label:'Enviar Inasistencia', dot:'bg-red-500',     hoverCls:'hover:bg-red-50 hover:border-red-200',         cardCls:'border-red-300 text-red-700 hover:bg-red-50 bg-white'            },
    { tipo:'tardanza'     as TipoMsg, label:'Enviar Tardanza',     dot:'bg-orange-500',  hoverCls:'hover:bg-orange-50 hover:border-orange-200',   cardCls:'border-orange-300 text-orange-700 hover:bg-orange-50 bg-white'   },
    { tipo:'actividad'    as TipoMsg, label:'Enviar Actividad',    dot:'bg-emerald-500', hoverCls:'hover:bg-emerald-50 hover:border-emerald-200', cardCls:'border-emerald-300 text-emerald-700 hover:bg-emerald-50 bg-white' },
  ];

  // ── Computed ───────────────────────────────────────────────────────────
  noLeidos  = computed(() => this._mensajes().filter(m => m.carpeta==='entrada' && !m.leido).length);
  destacados = computed(() => this._mensajes().filter(m => m.destacado).length);
  mensajesFiltrados = computed(() => {
    let list = this.carpeta() === 'destacados'
      ? this._mensajes().filter(m => m.destacado)
      : this._mensajes().filter(m => m.carpeta === this.carpeta());
    if (this.filtroTipo() !== 'todos') list = list.filter(m => m.tipo === this.filtroTipo());
    const q = this.busqueda().toLowerCase().trim();
    if (q) list = list.filter(m =>
      m.asunto.toLowerCase().includes(q) ||
      m.de.nombre.toLowerCase().includes(q) ||
      m.cuerpo.toLowerCase().includes(q)
    );
    return list.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  });
  msgSel = computed(() => {
    const id = this.selId();
    return id !== null ? (this._mensajes().find(m => m.id === id) ?? null) : null;
  });
  puedeEnviar = computed(() => this.cPara().length > 0 && this.cCuerpo().trim().length > 0);

  // ── Lifecycle ──────────────────────────────────────────────────────────
  ngOnInit(): void { this.layout.setTitle('Mensajería Interna'); }

  // ── Actions ────────────────────────────────────────────────────────────
  cambiarCarpeta(c: Carpeta): void {
    this.carpeta.set(c); this.selId.set(null); this.filtroTipo.set('todos'); this.busqueda.set('');
  }
  seleccionar(id: number): void {
    this.selId.set(id);
    this._mensajes.update(list => list.map(m => m.id === id ? { ...m, leido: true } : m));
  }
  toggleDestacado(ev: Event, id: number): void {
    ev.stopPropagation();
    this._mensajes.update(list => list.map(m => m.id === id ? { ...m, destacado: !m.destacado } : m));
  }
  eliminar(id: number): void {
    this._mensajes.update(list => list.filter(m => m.id !== id));
    if (this.selId() === id) this.selId.set(null);
    this.mostrarToast('Mensaje eliminado', 'err');
  }
  responder(m: Mensaje): void {
    this.limpiarCompose();
    this.cPara.set([m.de.id]);
    this.cTipo.set(m.tipo);
    this.cAsunto.set(`Re: ${m.asunto.replace(/^Re: /, '')}`);
    this.cCuerpo.set(`\n\n─────────────────────\n${m.cuerpo}`);
    this.composeOpen.set(true);
  }

  // ── Compose ────────────────────────────────────────────────────────────
  abrirCompose(tipo?: TipoMsg): void {
    this.limpiarCompose();
    if (tipo) { this.cTipo.set(tipo); this.cCuerpo.set(this.generarPlantilla(tipo)); }
    this.composeOpen.set(true);
  }
  onTipoChange(tipo: TipoMsg): void {
    this.cTipo.set(tipo);
    this.cCuerpo.set(this.generarPlantilla(tipo));
    this.actualizarAsunto();
  }
  actualizarAsunto(): void {
    const t = this.cTipo();
    if (t === 'general') return;
    const alumno   = this.cAlumno() || '[Alumno]';
    const gradoSec = this.cGrado() ? `${this.cGrado()} ${this.cSeccion()}` : '';
    const cursoStr = this.cCurso() ? ` — ${this.cCurso()}` : '';
    switch (t) {
      case 'inasistencia': this.cAsunto.set(`Inasistencia: ${alumno}${gradoSec ? ' — '+gradoSec : ''} · 15 Jun 2026`); break;
      case 'tardanza':     this.cAsunto.set(`Tardanza: ${alumno}${gradoSec ? ' — '+gradoSec : ''} · 15 Jun 2026`);     break;
      case 'tarea':        this.cAsunto.set(`Tarea${cursoStr}${gradoSec ? ' — '+gradoSec : ''}`);                       break;
      case 'actividad':    this.cAsunto.set(`Actividad${cursoStr}${gradoSec ? ' — '+gradoSec : ''}`);                   break;
    }
  }
  generarPlantilla(tipo: TipoMsg): string {
    const alumno   = this.cAlumno()  || '[Alumno/a]';
    const gradoSec = this.cGrado()   ? `${this.cGrado()} sección ${this.cSeccion()}` : '[grado y sección]';
    const curso    = this.cCurso()   || '[curso]';
    switch (tipo) {
      case 'inasistencia':
        return `Estimado/a padre/madre de familia,\n\nLe comunicamos que su hijo/a ${alumno}, del grado ${gradoSec}, registró INASISTENCIA el día lunes 15 de junio de 2026.\n\nSi la inasistencia fue justificada, le pedimos enviar la documentación correspondiente dentro de las próximas 48 horas.\n\nAtentamente,\nAdministración — Colegio Pedroni`;
      case 'tardanza':
        return `Estimado/a padre/madre de familia,\n\nLe comunicamos que su hijo/a ${alumno}, del grado ${gradoSec}, registró TARDANZA el día lunes 15 de junio de 2026.\n\nLe pedimos tomar las medidas necesarias para garantizar la puntualidad (inicio: 07:45 hrs).\n\nAtentamente,\nAdministración — Colegio Pedroni`;
      case 'tarea':
        return `Estimado/a padre/madre de familia,\n\nLe informamos que se ha asignado la siguiente tarea al grado ${gradoSec}:\n\nCURSO: ${curso}\nTAREA: [descripción de la tarea]\nFECHA DE ENTREGA: [fecha]\nIMPORTANTE: [observaciones]\n\nAtentamente,\nAdministración — Colegio Pedroni`;
      case 'actividad':
        return `Estimado/a padre/madre de familia,\n\nNos complace comunicarle sobre la siguiente actividad para el grado ${gradoSec}:\n\nACTIVIDAD: [nombre]\nFECHA: [fecha]\nHORA: [hora]\nLUGAR: [lugar]\n\nAtentamente,\nAdministración — Colegio Pedroni`;
      default: return '';
    }
  }
  toggleDestinatario(id: number): void {
    this.cPara.update(ids => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id]);
  }
  contactoById(id: number): Persona | undefined { return CONTACTOS.find(c => c.id === id); }
  enviar(): void {
    if (!this.puedeEnviar()) return;
    const destinatarios = CONTACTOS.filter(c => this.cPara().includes(c.id));
    const nuevo: Mensaje = {
      id: ++_nextId,
      carpeta: 'enviados', tipo: this.cTipo(),
      asunto: this.cAsunto().trim() || `${this.TIPO_CFG[this.cTipo()].label} — 15 Jun 2026`,
      cuerpo: this.cCuerpo(), de: ME, para: destinatarios,
      fecha: new Date('2026-06-15T09:00:00'), leido: true,
      envioPorCorreo: this.cEnviarCorreo(), destacado: false,
      ctx: this.buildCtx(),
    };
    this._mensajes.update(list => [nuevo, ...list]);
    this.composeOpen.set(false);
    this.carpeta.set('enviados');
    this.selId.set(nuevo.id);
    const emails = destinatarios.map(d => d.email).join(', ');
    this.mostrarToast(
      this.cEnviarCorreo()
        ? `✓ Enviado · 📧 Correo notificado a ${destinatarios.length} destinatario${destinatarios.length!==1?'s':''} (${emails})`
        : '✓ Mensaje enviado correctamente en la plataforma',
      'ok'
    );
    this.limpiarCompose();
  }
  buildCtx(): Mensaje['ctx'] {
    if (this.cTipo() === 'general') return undefined;
    const ctx: Mensaje['ctx'] = {};
    if (this.cAlumno()) ctx.alumno  = this.cAlumno();
    if (this.cGrado())  ctx.grado   = this.cGrado();
    if (this.cSeccion())ctx.seccion = this.cSeccion();
    if (this.cCurso())  ctx.curso   = this.cCurso();
    return ctx;
  }
  limpiarCompose(): void {
    this.cTipo.set('general'); this.cPara.set([]); this.cAsunto.set('');
    this.cCuerpo.set(''); this.cAlumno.set(''); this.cGrado.set('');
    this.cSeccion.set('A'); this.cCurso.set(''); this.cEnviarCorreo.set(true);
  }

  // ── Toast ──────────────────────────────────────────────────────────────
  mostrarToast(msg: string, tipo: 'ok' | 'err'): void {
    clearTimeout(this.toastTimer);
    this.toast.set({ msg, tipo });
    this.toastTimer = setTimeout(() => this.toast.set(null), 5000);
  }

  // ── Formatters ─────────────────────────────────────────────────────────
  formatFecha(fecha: Date): string {
    const diff = NOW.getTime() - fecha.getTime();
    const min  = Math.floor(diff / 60_000);
    if (min < 60) return `hace ${min} min`;
    if (diff < 86_400_000) return `${String(fecha.getHours()).padStart(2,'0')}:${String(fecha.getMinutes()).padStart(2,'0')}`;
    if (diff < 172_800_000) return 'Ayer';
    return `${fecha.getDate()} ${['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'][fecha.getMonth()]}`;
  }
  formatFechaCompleta(fecha: Date): string {
    const dia = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][fecha.getDay()];
    const mes = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'][fecha.getMonth()];
    return `${dia}, ${fecha.getDate()} de ${mes} de ${fecha.getFullYear()} — ${String(fecha.getHours()).padStart(2,'0')}:${String(fecha.getMinutes()).padStart(2,'0')} hrs`;
  }

  // ── Styling helpers ────────────────────────────────────────────────────
  avatarBg(ini: string): string {
    const p = ['bg-indigo-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-violet-500','bg-cyan-500','bg-orange-500'];
    let hash = 0; for (const c of ini) hash += c.charCodeAt(0);
    return p[hash % p.length];
  }
  rolBadgeCls(rol: string): string {
    return ({ ADMIN:'bg-indigo-100 text-indigo-700', DOCENTE:'bg-blue-100 text-blue-700', PADRE:'bg-emerald-100 text-emerald-700', ESTUDIANTE:'bg-amber-100 text-amber-700' } as Record<string,string>)[rol] ?? 'bg-gray-100 text-gray-700';
  }
  rolLabel(rol: string): string {
    return ({ ADMIN:'Admin', DOCENTE:'Docente', PADRE:'Padre/Madre', ESTUDIANTE:'Estudiante' } as Record<string,string>)[rol] ?? rol;
  }
  ctxCardCls(tipo: TipoMsg): string {
    return ({ general:'bg-gray-50 border-gray-200 text-gray-700', tarea:'bg-violet-50 border-violet-200 text-violet-800', inasistencia:'bg-red-50 border-red-200 text-red-800', tardanza:'bg-orange-50 border-orange-200 text-orange-800', actividad:'bg-emerald-50 border-emerald-200 text-emerald-800' })[tipo];
  }
}


