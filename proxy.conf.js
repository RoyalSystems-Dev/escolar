/**
 * Proxy dev: /api y /uploads → backend (:3000).
 * Si el API no está arriba, responde 503 JSON en lugar de inundar la terminal con ECONNREFUSED.
 */
const target = process.env['ESCOLAR_API_URL'] ?? 'http://localhost:3000';

function onProxyError(_err, req, res) {
  if (res.writeHead && !res.headersSent) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        statusCode: 503,
        message:
          'API no disponible. Inicie escolar-backend en http://localhost:3000 (puerto 3000).',
        path: req.url,
      }),
    );
  }
}

/** @type {import('http-proxy-middleware').Options[]} */
const common = {
  target,
  secure: false,
  changeOrigin: true,
  logLevel: 'silent',
  configure: (proxy) => {
    proxy.on('error', onProxyError);
  },
};

module.exports = [
  { context: ['/api'], ...common },
  { context: ['/uploads'], ...common },
];
