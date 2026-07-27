export type TipoDocumentoIdentidad = 'DNI' | 'CE' | 'Pasaporte' | 'PTP' | 'Otro';

export const TIPOS_DOCUMENTO_IDENTIDAD: { value: TipoDocumentoIdentidad; label: string }[] = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'Carné de extranjería (CE)' },
  { value: 'Pasaporte', label: 'Pasaporte' },
  { value: 'PTP', label: 'PTP' },
  { value: 'Otro', label: 'Otro' },
];

export function labelNumeroDocumento(tipo: TipoDocumentoIdentidad): string {
  switch (tipo) {
    case 'DNI':
      return 'N° DNI';
    case 'CE':
      return 'N° CE';
    case 'Pasaporte':
      return 'N° pasaporte';
    default:
      return 'N° documento';
  }
}

export function placeholderNumeroDocumento(tipo: TipoDocumentoIdentidad): string {
  switch (tipo) {
    case 'DNI':
      return '00000000';
    case 'CE':
      return '001234567';
    case 'Pasaporte':
      return 'ABC123456';
    default:
      return 'Número de documento';
  }
}

export function maxLengthNumeroDocumento(tipo: TipoDocumentoIdentidad): number {
  switch (tipo) {
    case 'DNI':
      return 8;
    case 'CE':
      return 12;
    default:
      return 20;
  }
}

export function validarNumeroDocumento(
  tipo: TipoDocumentoIdentidad,
  numero: string,
): string | null {
  const n = numero.trim();
  if (!n) return 'Ingresa el número de documento.';

  switch (tipo) {
    case 'DNI':
      if (!/^\d{8}$/.test(n)) return 'El DNI debe tener exactamente 8 dígitos.';
      break;
    case 'CE':
      if (!/^[A-Za-z0-9]{9,12}$/.test(n)) {
        return 'El CE debe tener entre 9 y 12 caracteres alfanuméricos.';
      }
      break;
    case 'Pasaporte':
      if (n.length < 6 || n.length > 20) {
        return 'El pasaporte debe tener entre 6 y 20 caracteres.';
      }
      break;
    default:
      if (n.length < 4 || n.length > 20) {
        return 'El número de documento debe tener entre 4 y 20 caracteres.';
      }
  }

  return null;
}

export function validarCelular(celular: string, requerido = false): string | null {
  const n = celular.trim().replace(/\s/g, '');
  if (!n) return requerido ? 'Ingresa el celular de contacto.' : null;
  if (!/^9\d{8}$/.test(n)) return 'El celular debe tener 9 dígitos y comenzar con 9.';
  return null;
}

export function validarEmail(email: string): string | null {
  const value = email.trim();
  if (!value) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'El correo electrónico no es válido.';
  return null;
}
