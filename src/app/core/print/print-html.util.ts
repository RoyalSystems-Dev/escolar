export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const PRINT_DOCUMENT_BASE_STYLES = `
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; margin: 24px; color: #111; background: #fff; }
  h1 { font-size: 18px; margin: 0 0 6px; }
  h2 { font-size: 14px; margin: 16px 0 6px; }
  .meta { font-size: 12px; color: #555; margin: 0 0 12px; }
  .empty { font-size: 12px; color: #777; font-style: italic; }
  table { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; vertical-align: top; text-align: left; }
  th { background: #f3f4f6; font-weight: 600; }
  td.empty { color: #999; text-align: center; }
  tr.receso td { background: #f9fafb; color: #666; font-style: italic; }
  ul { margin: 4px 0 0; padding-left: 18px; font-size: 11px; }
  .block { break-inside: avoid; page-break-inside: avoid; margin-bottom: 20px; }
  @media print {
    body { margin: 12px; }
    @page { margin: 12mm; }
  }
`;

export function wrapPrintDocumentHtml(
  titulo: string,
  contenido: string,
  extraStyles = '',
): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(titulo)}</title>
  <style>${PRINT_DOCUMENT_BASE_STYLES}${extraStyles}</style>
</head>
<body>${contenido}</body>
</html>`;
}

export function writeHtmlToIframe(iframe: HTMLIFrameElement, html: string): boolean {
  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) return false;
  doc.open();
  doc.write(html);
  doc.close();
  return true;
}

export function printIframe(iframe: HTMLIFrameElement): boolean {
  const win = iframe.contentWindow;
  if (!win) return false;
  win.focus();
  win.print();
  return true;
}
