import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seed } from './lib/seed.mjs';
import { publicContent, fileReferences, validateContent, validatePublication } from './lib/content.mjs';

const root = fileURLToPath(new URL('.', import.meta.url));
process.umask(0o077);
const data = resolve(process.env.DATA_DIR || join(root, 'data'));
mkdirSync(join(data, 'uploads'), { recursive: true, mode: 0o700 });
const db = new DatabaseSync(join(data, 'portfolio.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS content (kind TEXT PRIMARY KEY, json TEXT NOT NULL, updated TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS login_limits (ip TEXT PRIMARY KEY, count INTEGER NOT NULL, until INTEGER NOT NULL);`);
const now = () => new Date().toISOString();
if (!db.prepare('SELECT kind FROM content LIMIT 1').get()) {
  const initial = structuredClone(seed);
  for (const lang of ['en', 'es']) {
    const id = `cv-original-${lang}.pdf`, path = join(data, 'uploads', id);
    if (existsSync(path)) { db.prepare('INSERT OR IGNORE INTO files VALUES (?,?,?,?)').run(id, `CV_Facundo_Garompolo_${lang.toUpperCase()}.pdf`, 'application/pdf', statSync(path).size); initial.contact.cv[lang] = `/media/${id}`; }
  }
  for (const kind of ['draft', 'published']) db.prepare('INSERT INTO content VALUES (?,?,?,1)').run(kind, JSON.stringify(initial), now());
}
const getContent = kind => { const r = db.prepare('SELECT * FROM content WHERE kind=?').get(kind); return { content: JSON.parse(r.json), updated: r.updated, revision: r.revision }; };
const hash = s => createHash('sha256').update(s).digest('hex');
const derive = promisify(scrypt);
const host = process.env.HOST || '127.0.0.1', port = Number(process.env.PORT || 3000);
const origin = process.env.PUBLIC_ORIGIN || `http://localhost:${port}`;
const production = process.env.NODE_ENV === 'production';
if (production && !origin.startsWith('https://')) throw new Error('Producción requiere PUBLIC_ORIGIN=https://tu-dominio');
const localOrigins = new Set([origin, ...(!production ? [`http://localhost:${port}`, `http://127.0.0.1:${port}`] : [])]);
const hosts = new Set([...localOrigins].map(o => new URL(o).host));
const setupAllowed = req => !production && host === '127.0.0.1' && ['127.0.0.1', '::ffff:127.0.0.1', '::1'].includes(req.socket.remoteAddress);
const json = (res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); };
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
async function body(req, limit = 512 * 1024) { const chunks = []; let length = 0; for await (const chunk of req) { length += chunk.length; if (length > limit) fail(413, 'Archivo o contenido demasiado grande.'); chunks.push(chunk); } return Buffer.concat(chunks); }
async function readJson(req) { try { return JSON.parse((await body(req)).toString()); } catch (e) { if (e.status) throw e; fail(400, 'JSON inválido.'); } }
function session(req) { const token = req.headers.cookie?.split(';').map(x => x.trim()).find(x => x.startsWith('fg_session='))?.slice(11); return token ? db.prepare('SELECT * FROM sessions WHERE token=? AND expires>?').get(hash(token), Date.now()) : null; }
function auth(req, write = false) { const s = session(req); if (!s) fail(401, 'Iniciá sesión para continuar.'); if (write && req.headers['x-csrf-token'] !== s.csrf) fail(403, 'La sesión no es válida. Recargá el panel.'); return s; }
function sendFile(res, path, mime, name, cache = 'no-cache') { if (!existsSync(path)) fail(404, 'Archivo no encontrado.'); res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': cache, ...(name ? { 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(name)}` } : {}) }); res.end(readFileSync(path)); }
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob:; font-src 'self'; connect-src 'self'; frame-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'none'; form-action 'self'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (production) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  try {
    if (!hosts.has(req.headers.host)) fail(403, 'Host no permitido.');
    const u = new URL(req.url, origin), path = u.pathname;
    const write = !['GET', 'HEAD'].includes(req.method);
    if (write && !localOrigins.has(req.headers.origin)) fail(403, 'Origen no permitido.');
    if (path === '/api/content' && req.method === 'GET') { const preview = u.searchParams.get('preview') === '1'; if (preview) auth(req); const c = getContent(preview ? 'draft' : 'published'); return json(res, 200, { ...c, content: publicContent(c.content) }); }
    if (path === '/api/session' && req.method === 'GET') { const s = session(req); return json(res, 200, { authenticated: !!s, csrf: s?.csrf, needsSetup: !db.prepare('SELECT id FROM admin').get() && setupAllowed(req) }); }
    if (['/api/setup', '/api/login'].includes(path) && req.method === 'POST') {
      const ip = req.socket.remoteAddress; const limit = db.prepare('SELECT * FROM login_limits WHERE ip=?').get(ip);
      if (limit && limit.until > Date.now() && limit.count >= 10) fail(429, 'Demasiados intentos. Esperá 15 minutos.');
      db.prepare('INSERT INTO login_limits VALUES (?,1,?) ON CONFLICT(ip) DO UPDATE SET count=CASE WHEN until<? THEN 1 ELSE count+1 END, until=CASE WHEN until<? THEN excluded.until ELSE until END').run(ip, Date.now()+900000, Date.now(), Date.now());
      const { password } = await readJson(req);
      if (typeof password !== 'string' || password.length < 12 || password.length > 200) fail(400, 'Usá una contraseña de entre 12 y 200 caracteres.');
      let user = db.prepare('SELECT * FROM admin WHERE id=1').get();
      if (path === '/api/setup') {
        if (user || !setupAllowed(req)) fail(403, 'La configuración inicial no está disponible.');
        const salt = randomBytes(16).toString('hex'), value = (await derive(password, salt, 64)).toString('hex');
        if (db.prepare('SELECT id FROM admin').get()) fail(409, 'Ya existe una cuenta.');
        db.prepare('INSERT INTO admin VALUES (1,?,?)').run(salt, value); user = { salt, hash: value };
      }
      const candidate = await derive(password, user?.salt || 'not-configured', 64);
      if (!user || !timingSafeEqual(candidate, Buffer.from(user.hash, 'hex'))) fail(401, 'Contraseña incorrecta.');
      db.prepare('DELETE FROM login_limits WHERE ip=?').run(ip);
      db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
      const token = randomBytes(32).toString('hex'), csrf = randomBytes(32).toString('hex');
      db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash(token), csrf, Date.now()+8*3600000);
      res.setHeader('Set-Cookie', `fg_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${origin.startsWith('https:') ? '; Secure' : ''}`);
      return json(res, 200, { authenticated: true, csrf });
    }
    if (path === '/api/logout' && req.method === 'POST') { const s = auth(req, true); db.prepare('DELETE FROM sessions WHERE token=?').run(s.token); res.setHeader('Set-Cookie', 'fg_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return json(res, 200, { ok: true }); }
    if (path === '/api/admin/content' && req.method === 'GET') { auth(req); return json(res, 200, { ...getContent('draft'), published: getContent('published').updated }); }
    if (path === '/api/admin/content' && req.method === 'PUT') {
      auth(req, true); const b = await readJson(req); const c = validateContent(b.content, db), updated = now();
      const result = db.prepare("UPDATE content SET json=?,updated=?,revision=revision+1 WHERE kind='draft' AND revision=?").run(JSON.stringify(c), updated, b.revision);
      if (!result.changes) fail(409, 'El borrador cambió en otra pestaña. Copiá tus cambios antes de recargar.');
      return json(res, 200, { updated, revision: b.revision+1 });
    }
    if (path === '/api/admin/publish' && req.method === 'POST') {
      auth(req, true); const b = await readJson(req); const updated = now();
      validatePublication(getContent('draft').content);
      const result = db.prepare("UPDATE content SET json=(SELECT json FROM content WHERE kind='draft'),updated=?,revision=revision+1 WHERE kind='published' AND (SELECT revision FROM content WHERE kind='draft')=?").run(updated, b.revision);
      if (!result.changes) fail(409, 'El borrador cambió. Recargá antes de publicar.'); return json(res, 200, { updated });
    }
    if (path === '/api/admin/upload' && req.method === 'POST') {
      auth(req, true); const bytes = await body(req, 8*1024*1024); let mime, ext;
      if (bytes.subarray(0, 5).toString() === '%PDF-') { mime = 'application/pdf'; ext = 'pdf'; }
      else if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) { mime='image/png'; ext='png'; }
      else if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) { mime='image/jpeg'; ext='jpg'; }
      else if (bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP') { mime='image/webp'; ext='webp'; }
      else fail(400, 'Solo se aceptan PDF e imágenes JPG, PNG o WebP.');
      const id = `${randomBytes(16).toString('hex')}.${ext}`, name = decodeURIComponent(req.headers['x-file-name'] || `archivo.${ext}`).slice(0,200);
      writeFileSync(join(data,'uploads',id),bytes,{ mode:0o600 }); db.prepare('INSERT INTO files VALUES (?,?,?,?)').run(id,name,mime,bytes.length);
      return json(res,201,{ url:`/media/${id}`,name,mime });
    }
    if (path.startsWith('/media/') && req.method === 'GET') { const id=path.slice(7); if (!/^[a-zA-Z0-9.-]+$/.test(id)) fail(404,'Archivo no encontrado.'); const f=db.prepare('SELECT * FROM files WHERE id=?').get(id); if (!f || (!session(req) && !fileReferences(publicContent(getContent('published').content)).has(id))) fail(404,'Archivo no encontrado.'); return sendFile(res,join(data,'uploads',id),f.mime,f.name,'private, no-store'); }
    if (path.startsWith('/api/')) fail(404,'Ruta no encontrada.');
    if (req.method !== 'GET' && req.method !== 'HEAD') fail(405,'Método no permitido.');
    const file = path==='/' ? 'index.html' : path==='/admin' || path==='/admin/' ? 'admin.html' : decodeURIComponent(path).slice(1);
    const full = resolve(root,'public',file); if (!full.startsWith(resolve(root,'public')+'/') || !types[extname(full)] || !existsSync(full) || !statSync(full).isFile()) fail(404,'Página no encontrada.');
    return sendFile(res,full,types[extname(full)],null,file.startsWith('assets/')?'public, max-age=86400':'no-cache');
  } catch(e) { if (!res.headersSent) json(res,e.status || 500,{error:e.status?e.message:'Ocurrió un error. Volvé a intentarlo.'}); else res.end(); if (!e.status) console.error(e); }
});
server.requestTimeout=30000; server.headersTimeout=10000;
server.listen(port,host,()=>console.log(`Portfolio local: http://localhost:${port}\nPanel: http://localhost:${port}/admin`));
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>{db.close(); process.exit(0);}));
