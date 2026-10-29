// Read-only Wi-Fi preview. Authentication and editing remain on localhost.
import http from 'node:http';
import { networkInterfaces } from 'node:os';

const interfaces = networkInterfaces();
const addresses = Object.entries(interfaces).flatMap(([name, entries]) =>
  entries.filter(x => x.family === 'IPv4' && !x.internal && /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(x.address)).map(x => ({ name, address: x.address }))
);
const address = process.env.LAN_HOST || addresses.find(x => x.name === 'en0')?.address || addresses[0]?.address;
if (!address) throw new Error('Conectá la computadora al Wi-Fi y volvé a ejecutar npm run preview:lan.');
const port = Number(process.env.LAN_PORT || 3001);
const upstreamPort = Number(process.env.PORT || 3000);
const authority = `${address}:${port}`;
const allowed = new Set(['/', '/app.js', '/desktop.js', '/artwork.js', '/style.css', '/monochrome.css', '/favicon.svg', '/api/content']);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${authority}`);
  const publicFile = /^\/assets\/[a-zA-Z0-9.-]+$/.test(url.pathname) || /^\/media\/[a-zA-Z0-9.-]+$/.test(url.pathname);
  if (req.headers.host !== authority || !['GET', 'HEAD'].includes(req.method) || (!allowed.has(url.pathname) && !publicFile) || url.searchParams.has('preview')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Esta dirección solo muestra el portfolio público. Usá localhost:3000/admin en la computadora para editar.');
  }
  // Intentionally omit cookies, forwarded headers and query parameters.
  const upstream = http.request({ hostname: '127.0.0.1', port: upstreamPort, path: url.pathname, method: req.method, headers: { Host: `localhost:${upstreamPort}` } }, response => {
    const headers = { ...response.headers };
    delete headers['set-cookie'];
    res.writeHead(response.statusCode, headers);
    response.pipe(res);
  });
  upstream.setTimeout(10000, () => upstream.destroy());
  upstream.on('error', () => {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Iniciá primero el portfolio con npm start en otra terminal.');
  });
  upstream.end();
});
server.requestTimeout = 15000;
server.headersTimeout = 10000;
server.listen(port, address, () => console.log(`Vista para el celular: http://${authority}\nConectá ambos dispositivos al mismo Wi-Fi. Panel privado: http://localhost:${upstreamPort}/admin`));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
