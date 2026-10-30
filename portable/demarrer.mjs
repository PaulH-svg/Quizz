import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { spawn } from 'node:child_process';

const root = await realpath(fileURLToPath(new URL('./web/', import.meta.url)));
const port = 4317;
const address = `http://127.0.0.1:${port}`;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon' };
const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  try {
    const pathname = decodeURIComponent(new URL(req.url, address).pathname);
    const candidate = path.resolve(root, pathname === '/' ? 'index.html' : `.${pathname}`);
    if (candidate !== root && !candidate.startsWith(root + path.sep)) throw Error('Not found');
    const resolved = await realpath(candidate);
    if (!resolved.startsWith(root + path.sep) || !(await stat(resolved)).isFile()) throw Error('Not found');
    const body = await readFile(resolved);
    res.writeHead(200, { 'Content-Type': types[path.extname(resolved)] || 'application/octet-stream', 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Fichier introuvable.');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `Le port ${port} est déjà utilisé. Pour lancer la nouvelle édition, arrêtez l’ancien lanceur (Ctrl+C dans sa fenêtre), puis relancez ce dossier. Si un autre programme utilise ce port, fermez-le avant de réessayer.`
    : `Impossible de démarrer Minuit : ${error.message}`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`\n  MINUIT — ÉDITION 02 — 50 questions\n\n  Ouvrez ${address} dans votre navigateur.\n  Gardez cette fenêtre ouverte pendant la soirée.\n  Pour arrêter : Ctrl+C ou fermez cette fenêtre.\n`);
  if (!process.argv.includes('--sans-navigateur')) {
    const [command, args] = process.platform === 'win32'
      ? ['cmd.exe', ['/d', '/c', 'start', '', address]]
      : process.platform === 'darwin' ? ['open', [address]] : ['xdg-open', [address]];
    const browser = spawn(command, args, { stdio: 'ignore', detached: true });
    browser.on('error', () => console.log(`Ouvrez manuellement ${address}.`));
    browser.unref();
  }
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
