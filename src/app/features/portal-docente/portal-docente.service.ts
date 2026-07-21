import { Injectable, inject, signal } from '@angular/core';

import { HttpClient, HttpParams } from '@angular/common/http';

import { Observable, catchError, finalize, map, throwError } from 'rxjs';

import { environment } from '@environments/environment';

import { AuthService } from '../../core/auth/services/auth.service';

import { DocenteDetail } from '../matricula/maestros/docentes/docentes.model';

import {

  mapMiAulaToDocenteDetail,

  PortalDocenteMiAulaResponse,

} from './portal-docente.model';



@Injectable({ providedIn: 'root' })

export class PortalDocenteService {

  private readonly http = inject(HttpClient);

  private readonly auth = inject(AuthService);

  private readonly apiBase = `${environment.apiUrl}/maestros/docentes/me`;



  readonly loading = signal(false);

  readonly loadingPerfil = signal(false);



  loadMiAula(anioEscolar?: number): Observable<PortalDocenteMiAulaResponse> {

    this.loading.set(true);

    return this.fetchMiAula(anioEscolar).pipe(

      catchError((err) => throwError(() => err)),

      finalize(() => this.loading.set(false)),

    );

  }



  loadMisDatos(anioEscolar?: number): Observable<DocenteDetail> {

    this.loadingPerfil.set(true);

    let params = new HttpParams();

    if (anioEscolar) params = params.set('anioEscolar', anioEscolar);



    return this.http.get<DocenteDetail>(`${this.apiBase}/perfil`, { params }).pipe(

      catchError(() =>

        this.fetchMiAula(anioEscolar).pipe(

          map((aula) => mapMiAulaToDocenteDetail(aula, this.auth.currentUser())),

        ),

      ),

      finalize(() => this.loadingPerfil.set(false)),

    );

  }



  private fetchMiAula(anioEscolar?: number): Observable<PortalDocenteMiAulaResponse> {

    let params = new HttpParams();

    if (anioEscolar) params = params.set('anioEscolar', anioEscolar);

    return this.http.get<PortalDocenteMiAulaResponse>(`${this.apiBase}/mi-aula`, { params });

  }

}


