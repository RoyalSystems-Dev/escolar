import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { environment } from '@environments/environment';
import {
  DEFAULT_GRADING_CONFIG,
  GradingConfig,
  EscalaLogroConfig,
  nivelFromNota,
  nivelBadge,
  promedioColor,
} from './grading-config.model';

@Injectable({ providedIn: 'root' })
export class GradingConfigService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/grading-config`;

  readonly config = signal<GradingConfig>(DEFAULT_GRADING_CONFIG);
  readonly loaded = signal(false);

  load(): Observable<GradingConfig> {
    return this.http.get<GradingConfig>(this.base).pipe(
      tap((cfg) => {
        this.config.set(cfg);
        this.loaded.set(true);
      }),
      catchError(() => {
        this.config.set(DEFAULT_GRADING_CONFIG);
        this.loaded.set(true);
        return of(DEFAULT_GRADING_CONFIG);
      }),
    );
  }

  reset(): void {
    this.config.set(DEFAULT_GRADING_CONFIG);
    this.loaded.set(false);
  }

  usesNumeric(): boolean {
    return this.config().usesNumeric;
  }

  usesCompetencias(): boolean {
    return this.config().usesCompetencias;
  }

  notaMinima(): number {
    return this.config().notaMinima;
  }

  notaMaxima(): number {
    return this.config().notaMaxima;
  }

  periodosCount(): number {
    return this.config().periodosCount;
  }

  escala(): EscalaLogroConfig {
    return this.config().escalaLogro;
  }

  nivelDeNota(nota: number): string {
    return nivelFromNota(nota, this.escala());
  }

  badgeNivel(nivel: string | null): string {
    return nivelBadge(nivel);
  }

  colorPromedio(nota: number | null): string {
    return promedioColor(nota, this.config());
  }

  esAprobado(nota: number): boolean {
    return nota >= this.notaMinima();
  }

  labelSistema(): string {
    const s = this.config().sistemaEval;
    if (s === 'literal') return 'Por competencias';
    if (s === 'mixto') return 'Mixto';
    return 'Numérico';
  }
}
