import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiCourse, ApiGrade } from '../../../../core/api/api.models';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { HorariosService } from '../../../academico/horarios/services/horarios.service';
import { PortalEstudianteService } from '../../../portal-estudiante/services/portal-estudiante.service';
import { CursoNotasEstudiante, NivelLogro, NotaItem } from '../models/nota.model';

const CURSO_STYLE: Record<string, { emoji: string; colorClass: string; dotClass: string }> = {
  Matemática: { emoji: '🔢', colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200', dotClass: 'bg-indigo-500' },
  'Comprensión Lectora': { emoji: '📖', colorClass: 'bg-blue-100 text-blue-800 border-blue-200', dotClass: 'bg-blue-500' },
  'Ciencia y Tecnología': { emoji: '🔬', colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200', dotClass: 'bg-emerald-500' },
  Comunicación: { emoji: '✍️', colorClass: 'bg-blue-100 text-blue-800 border-blue-200', dotClass: 'bg-blue-500' },
};

const DEFAULT_STYLE = { emoji: '📚', colorClass: 'bg-gray-100 text-gray-800 border-gray-200', dotClass: 'bg-gray-500' };

@Injectable({ providedIn: 'root' })
export class NotasEstudianteService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly horarios = inject(HorariosService);
  private readonly portal = inject(PortalEstudianteService);
  private readonly base = environment.apiUrl;

  private readonly _cursos = signal<CursoNotasEstudiante[]>([]);
  readonly cursos = this._cursos.asReadonly();
  readonly loading = signal(false);

  constructor() {
    if (this.auth.isAuthenticated()) {
      this.load();
    }
  }

  load(): void {
    this.loading.set(true);

    const perfil$ = this.auth.hasRole('ESTUDIANTE')
      ? this.portal.ensureLoaded()
      : of(null);

    perfil$.pipe(
      switchMap(perfil => {
        const studentId = perfil?.studentId;
        const gradesParams = studentId
          ? new HttpParams().set('studentId', String(studentId))
          : undefined;
        return forkJoin({
          grades: this.http.get<ApiGrade[]>(`${this.base}/grades`, { params: gradesParams }),
          courses: this.http.get<ApiCourse[]>(`${this.base}/courses`),
          studentId: of(studentId),
        });
      }),
      tap(({ grades, courses, studentId }) => {
        const filtered = studentId
          ? grades.filter(g => g.studentId === studentId)
          : grades;

        const byCourse = new Map<string, ApiGrade[]>();
        for (const grade of filtered) {
          const list = byCourse.get(grade.curso) ?? [];
          list.push(grade);
          byCourse.set(grade.curso, list);
        }

        const mapped = Array.from(byCourse.entries()).map(([nombre, items], index) => {
          const courseMeta = courses.find(c => c.nombre === nombre);
          const style = CURSO_STYLE[nombre] ?? DEFAULT_STYLE;
          const toItem = (g: ApiGrade): NotaItem => ({
            id: g.id,
            descripcion: g.descripcion ?? g.tipo,
            fecha: g.fechaEvaluacion.slice(0, 10),
            bimestre: g.bimestre,
            nota: g.nota,
          });
          return {
            id: courseMeta?.id ?? index + 1,
            nombre,
            area: courseMeta?.area ?? nombre,
            emoji: style.emoji,
            colorClass: style.colorClass,
            dotClass: style.dotClass,
            docenteAbrev: courseMeta?.docente ?? 'Docente',
            controlesDiarios: items.filter(i => i.tipo === 'daily').map(toItem),
            parciales: items.filter(i => i.tipo === 'partial').map(toItem),
            finales: items.filter(i => i.tipo === 'final').map(toItem),
          };
        });

        this._cursos.set(mapped);
        this.loading.set(false);
      }),
      catchError(() => {
        this.loading.set(false);
        return of(null);
      }),
    ).subscribe();
  }

  getEstudianteId(): string {
    return this.portal.getStudentIdString() || '5';
  }

  getPerfil() {
    return this.horarios.getPerfilEstudiante();
  }

  getCursos(): CursoNotasEstudiante[] {
    return this._cursos();
  }

  todasLasNotas(curso: CursoNotasEstudiante): NotaItem[] {
    return [...curso.controlesDiarios, ...curso.parciales, ...curso.finales];
  }

  notasPorBimestre(items: NotaItem[], bimestre: number | null): NotaItem[] {
    if (bimestre === null) return items;
    return items.filter((i) => i.bimestre === bimestre);
  }

  promedioItems(items: NotaItem[]): number {
    if (!items.length) return 0;
    return items.reduce((s, i) => s + i.nota, 0) / items.length;
  }

  promedioCurso(curso: CursoNotasEstudiante, bimestre: number | null = null): number {
    const items = bimestre === null
      ? this.todasLasNotas(curso)
      : [
          ...this.notasPorBimestre(curso.controlesDiarios, bimestre),
          ...this.notasPorBimestre(curso.parciales, bimestre),
          ...this.notasPorBimestre(curso.finales, bimestre),
        ];
    return this.promedioItems(items);
  }

  promedioGeneral(cursos: CursoNotasEstudiante[], bimestre: number | null = null): number {
    const proms = cursos.map((c) => this.promedioCurso(c, bimestre)).filter((p) => p > 0);
    return proms.length ? proms.reduce((s, p) => s + p, 0) / proms.length : 0;
  }

  nivelDesdeNota(nota: number): NivelLogro {
    if (nota >= 17.5) return 'AD';
    if (nota >= 14) return 'A';
    if (nota >= 11) return 'B';
    return 'C';
  }

  nivelBadge(nivel: NivelLogro): string {
    const map: Record<NivelLogro, string> = {
      AD: 'badge-indigo',
      A: 'badge-green',
      B: 'badge-yellow',
      C: 'badge-red',
    };
    return map[nivel];
  }

  notaColor(nota: number): string {
    if (nota >= 14) return 'text-emerald-600';
    if (nota >= 11) return 'text-amber-600';
    return 'text-red-600';
  }

  formatFecha(fecha: string): string {
    return format(parseISO(fecha), 'dd/MM/yyyy', { locale: es });
  }
}
