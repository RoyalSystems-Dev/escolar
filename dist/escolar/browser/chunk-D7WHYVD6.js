function o(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}var r=`
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
`;function i(t,e,n=""){return`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${o(t)}</title>
  <style>${r}${n}</style>
</head>
<body>${e}</body>
</html>`}function a(t,e){let n=t.contentDocument??t.contentWindow?.document;return n?(n.open(),n.write(e),n.close(),!0):!1}function l(t){let e=t.contentWindow;return e?(e.focus(),e.print(),!0):!1}export{o as a,i as b,a as c,l as d};
