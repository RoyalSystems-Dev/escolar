import net from 'node:net';

const host = process.env['ESCOLAR_API_HOST'] ?? '127.0.0.1';
const port = Number(process.env['ESCOLAR_API_PORT'] ?? 3000);

function portOpen() {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(2000);
    socket.on('connect', () => done(true));
    socket.on('timeout', () => done(false));
    socket.on('error', () => done(false));
  });
}

const up = await portOpen();
if (!up) {
  console.warn(
    `\n[escolar] API no responde en ${host}:${port}. ` +
      `Inicie escolar-backend antes de usar login o datos en la UI. ` +
      `El proxy dev devolverá 503 en /api hasta que el backend esté activo.\n`,
  );
}
