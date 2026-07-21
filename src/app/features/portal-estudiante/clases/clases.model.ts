import { ApiResource } from '../../../core/api/api.models';
import {
  TemarioClaseItem,
  temarioImagenUrl,
} from '../../portal-docente/temario/temario.model';

export interface CursoClaseEstudiante {
  id: number;
  nombre: string;
  area: string;
  colorClass: string;
  dotClass: string;
  docenteAbrev: string;
  docenteNombre: string;
  sesionesSemana: number;
  diasSemana: number[];
  imagenCabecera: string;
}

/** Sesión de clase en orden cronológico (por fecha). */
export interface SesionClaseDetalle {
  orden: number;
  fechaClase: string;
  fechaClaseDisplay: string;
  temas: TemarioClaseItem[];
  recursos: ApiResource[];
  imagenCabecera: string | null;
  imagenCabeceraAlt: string;
}

const CURSO_CABECERA: Record<string, string> = {
  Matemática:
    'https://placehold.co/800x240/e8eaf6/3949ab?text=Matem%C3%A1tica&font=roboto',
  Comunicación:
    'https://placehold.co/800x240/e3f2fd/1565c0?text=Comunicaci%C3%B3n&font=roboto',
  'Comprensión Lectora':
    'https://placehold.co/800x240/e1f5fe/0277bd?text=Comprensi%C3%B3n+Lectora&font=roboto',
  'Producción de Textos':
    'https://placehold.co/800x240/e1f5fe/0288d1?text=Producci%C3%B3n+de+Textos&font=roboto',
  'Prod. de Textos':
    'https://placehold.co/800x240/e1f5fe/0288d1?text=Producci%C3%B3n+de+Textos&font=roboto',
  'Ciencia y Tecnología':
    'https://placehold.co/800x240/e8f5e9/2e7d32?text=Ciencia+y+Tecnolog%C3%ADa&font=roboto',
  Inglés:
    'https://placehold.co/800x240/e0f7fa/00838f?text=Ingl%C3%A9s&font=roboto',
  'Arte y Cultura':
    'https://placehold.co/800x240/fce4ec/c2185b?text=Arte+y+Cultura&font=roboto',
  'Educación Física':
    'https://placehold.co/800x240/f1f8e9/558b2f?text=Educaci%C3%B3n+F%C3%ADsica&font=roboto',
  'Historia del Perú':
    'https://placehold.co/800x240/fff8e1/f57f17?text=Historia+del+Per%C3%BA&font=roboto',
  'Ed. Religiosa':
    'https://placehold.co/800x240/ede7f6/512da8?text=Ed.+Religiosa&font=roboto',
  'Personal Social':
    'https://placehold.co/800x240/e8f5e9/388e3c?text=Personal+Social&font=roboto',
};

const CABECERA_DEFAULT =
  'https://placehold.co/800x240/f3f4f6/6b7280?text=Clase&font=roboto';

export function cabeceraCursoUrl(nombre: string): string {
  return CURSO_CABECERA[nombre.trim()] ?? CABECERA_DEFAULT;
}

export function primeraImagenSesion(
  temas: TemarioClaseItem[],
): { url: string; alt: string } | null {
  for (const tema of temas) {
    const img = tema.imagenesClase?.[0];
    if (!img) continue;
    return {
      url: temarioImagenUrl(img),
      alt: img.leyenda?.trim() || img.nombre?.trim() || tema.titulo,
    };
  }
  return null;
}

export function sesionKey(fecha: string): string {
  return fecha.slice(0, 10);
}
