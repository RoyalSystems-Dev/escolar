export function isoToDisplay(iso: string | null | undefined): string {
  if (!iso) return '';
  const value = iso.slice(0, 10);
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function displayToIso(display: string): string {
  const trimmed = display.trim();
  if (!trimmed) return new Date().toISOString().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const [d, m, y] = trimmed.split('/');
  if (!d || !m || !y) return trimmed;
  return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}
