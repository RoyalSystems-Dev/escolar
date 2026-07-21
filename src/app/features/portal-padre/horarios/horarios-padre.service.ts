import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, finalize, tap, throwError } from 'rxjs';
import { environment } from '@environments/environment';
import { AuthService } from '../../../core/auth/services/auth.service';
import { HorariosService } from '../../academico/horarios/services/horarios.service';
import { Nivel, PerfilEstudiante } from '../../academico/horarios/models/horario.model';
import { HorarioContext } from '../../academico/horarios/models/horarios-admin.model';
import { HijoResumen } from '../seguimiento/seguimiento.model';

export interface ParentHorarioResponse {
  estudiante: HijoResumen;
  anioEscolar: number;
  periodos: HorarioContext['periodos'];
  cursos: HorarioContext['cursos'];
  docentes: HorarioContext['docentes'];
  blocks: HorarioContext['blocks'];
}

@Injectable({ providedIn: 'root' })
export class HorariosPadreService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly horarios = inject(HorariosService);
  private readonly base = `${environment.apiUrl}/parents`;

  readonly loadingHijos = signal(false);
  readonly loadingHorario = signal(false);
  readonly hijos = signal<HijoResumen[]>([]);
  readonly hijoSeleccionado = signal<HijoResumen | null>(null);
  readonly anioEscolar = signal(new Date().getFullYear());

  loadHijos(): Observable<HijoResumen[]> {
    this.loadingHijos.set(true);
    const params = new HttpParams().set('email', this.parentEmail());

    return this.http.get<HijoResumen[]>(`${this.base}/children`, { params }).pipe(
      tap(hijos => {
        this.hijos.set(hijos);
        const current = this.hijoSeleccionado();
        const stillValid = current && hijos.some(h => h.studentId === current.studentId);
        if (!stillValid) {
          this.hijoSeleccionado.set(hijos[0] ?? null);
        }
      }),
      catchError(err => throwError(() => err)),
      finalize(() => this.loadingHijos.set(false)),
    );
  }

  loadHorario(studentId: number): Observable<ParentHorarioResponse> {
    this.loadingHorario.set(true);
    const params = new HttpParams().set('email', this.parentEmail());

    return this.http
      .get<ParentHorarioResponse>(`${this.base}/children/${studentId}/horario`, { params })
      .pipe(
        tap(data => {
          this.anioEscolar.set(data.anioEscolar);
          const hijo = data.estudiante;
          this.hijoSeleccionado.set(hijo);
          const perfil: PerfilEstudiante = {
            nivel: hijo.nivel as Nivel,
            grado: hijo.grado,
            seccion: hijo.seccion,
            aulaLabel: hijo.aulaLabel,
          };
          this.horarios.applyParentHorario(perfil, data);
        }),
        catchError(err => {
          this.horarios.clearSchedule();
          return throwError(() => err);
        }),
        finalize(() => this.loadingHorario.set(false)),
      );
  }

  seleccionarHijo(hijo: HijoResumen): Observable<ParentHorarioResponse> {
    this.hijoSeleccionado.set(hijo);
    return this.loadHorario(hijo.studentId);
  }

  parentEmail(): string {
    return this.auth.currentUser()?.email ?? 'padre@escolar.pe';
  }
}
