import { Injectable, inject } from '@angular/core';
import { HorariosService } from '../../academico/horarios/services/horarios.service';
import { TemarioClaseItem } from '../../portal-docente/temario/temario.model';
import { ApiResource } from '../../../core/api/api.models';
import {
  cabeceraCursoUrl,
  CursoClaseEstudiante,
  primeraImagenSesion,
  SesionClaseDetalle,
} from './clases.model';

@Injectable({ providedIn: 'root' })
export class ClasesEstudianteService {
  private readonly horarios = inject(HorariosService);

  buildCursosAsignados(): CursoClaseEstudiante[] {
    const perfil = this.horarios.getPerfilEstudiante();
    const entradas = this.horarios.getEntradas(perfil);
    const map = new Map<number, CursoClaseEstudiante>();

    for (const e of entradas) {
      const curso = this.horarios.curById(e.cursoId);
      if (!curso) continue;
      const docente = this.horarios.docById(e.docenteId);

      if (!map.has(curso.id)) {
        map.set(curso.id, {
          id: curso.id,
          nombre: curso.nombre,
          area: curso.area,
          colorClass: curso.colorClass,
          dotClass: curso.dotClass,
          docenteAbrev: docente?.abrev ?? 'Docente',
          docenteNombre: docente
            ? `${docente.nombres} ${docente.apellidos}`.trim()
            : 'Docente',
          sesionesSemana: 0,
          diasSemana: [],
          imagenCabecera: cabeceraCursoUrl(curso.nombre),
        });
      }

      const item = map.get(curso.id)!;
      item.sesionesSemana++;
      if (!item.diasSemana.includes(e.dia)) {
        item.diasSemana.push(e.dia);
      }
    }

    return Array.from(map.values())
      .map(c => ({ ...c, diasSemana: [...c.diasSemana].sort((a, b) => a - b) }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  buildSesionesPorCurso(
    temario: TemarioClaseItem[],
    recursos: ApiResource[],
  ): SesionClaseDetalle[] {
    const temasLiberados = temario
      .filter(t => t.liberadoAlumno !== false)
      .sort((a, b) => a.fechaClase.localeCompare(b.fechaClase) || a.numero - b.numero);

    const fechas = [
      ...new Set(temasLiberados.map(t => t.fechaClase.slice(0, 10))),
    ].sort();

    return fechas.map((fecha, index) => {
      const temas = temasLiberados.filter(t => t.fechaClase.slice(0, 10) === fecha);
      const recursosSesion = recursos
        .filter(r => r.fechaPublicacion.slice(0, 10) === fecha)
        .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));

      const cabecera = primeraImagenSesion(temas);

      return {
        orden: index + 1,
        fechaClase: fecha,
        fechaClaseDisplay: temas[0]?.fechaClaseDisplay ?? fecha,
        temas,
        recursos: recursosSesion,
        imagenCabecera: cabecera?.url ?? null,
        imagenCabeceraAlt: cabecera?.alt ?? `Clase ${index + 1}`,
      };
    });
  }
}
