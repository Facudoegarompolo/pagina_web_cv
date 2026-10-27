export function publicContent(content) {
  const c = structuredClone(content);
  for (const key of ['experience', 'education', 'skills', 'projects']) c[key] = c[key].filter(x => x.visible);
  for (const e of c.education) if (!e.certificateVisible) e.certificate = '';
  for (const p of c.projects) p.images = p.images.filter(i => i.src);
  c.contact.links = c.contact.links.filter(l => l.url && l.label);
  return c;
}
export function validatePublication(c) {
  for (const [key, label] of [['experience','Experiencia'],['education','Formación'],['skills','Habilidades'],['projects','Proyectos']]) {
    for (const item of c[key]) if (item.visible && !item.title.es && !item.title.en) throw Object.assign(new Error(`${label}: completá el nombre de los elementos visibles antes de publicar.`), {status:400});
  }
}
export function fileReferences(c) {
  const refs = new Set();
  function walk(v) { if (typeof v === 'string' && /^\/media\/[a-zA-Z0-9.-]+$/.test(v)) refs.add(v.slice(7)); else if (v && typeof v === 'object') Object.values(v).forEach(walk); }
  walk(c); return refs;
}
export function validateContent(input, db) {
  const error = message => { throw Object.assign(new Error(message), { status: 400 }); };
  const string = (v = '', max = 8000) => { if (typeof v !== 'string' || v.length > max) error('Texto inválido o demasiado largo.'); return v.trim(); };
  const bi = v => { if (!v || typeof v !== 'object') error('Falta un texto bilingüe.'); return { es: string(v.es), en: string(v.en) }; };
  const url = v => { v = string(v, 2000); if (v && !/^https?:\/\//i.test(v)) error('Los enlaces deben comenzar con https:// o http://.'); if (v) { try { const u = new URL(v); if (u.username || u.password) error('Enlace inválido.'); } catch { error('Enlace inválido.'); } } return v; };
  const file = (v, pdfOnly = false, imageOnly = false) => { v = string(v, 150); if (!v) return ''; if (!/^\/media\/[a-zA-Z0-9.-]+$/.test(v)) error('Archivo inválido.'); const f = db.prepare('SELECT mime FROM files WHERE id=?').get(v.slice(7)); if (!f || (pdfOnly && f.mime !== 'application/pdf') || (imageOnly && !f.mime.startsWith('image/'))) error('El archivo no existe o su formato no corresponde.'); return v; };
  const number = (v, min, max) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) error('Número fuera de rango.'); return v; };
  const list = (arr, fn) => { if (!Array.isArray(arr) || arr.length > 100) error('Lista inválida (máximo 100 elementos).'); return arr.map(fn); };
  const base = x => ({ id: string(x.id, 100), visible: !!x.visible, title: bi(x.title), description: bi(x.description) });
  if (!input?.profile || !input.contact) error('Contenido incompleto.');
  const p = input.profile, t = input.contact;
  const c = { profile: { name: string(p.name, 150), title: bi(p.title), intro: bi(p.intro), location: bi(p.location), photo: file(p.photo, false, true), photoAlt: bi(p.photoAlt), photoX: number(p.photoX, 0, 100), photoY: number(p.photoY, 0, 100), photoZoom: number(p.photoZoom, 1, 3) },
    experience: list(input.experience, x => ({ ...base(x), organization: bi(x.organization), dates: bi(x.dates), tasks: bi(x.tasks) })),
    education: list(input.education, x => ({ ...base(x), organization: bi(x.organization), dates: bi(x.dates), status: bi(x.status), progress: x.progress === null ? null : number(x.progress, 0, 100), certificate: file(x.certificate), certificateVisible: !!x.certificateVisible })),
    skills: list(input.skills, base),
    projects: list(input.projects, x => ({ ...base(x), featured: !!x.featured, technologies: string(x.technologies, 500), cover: file(x.cover, false, true), coverAlt: bi(x.coverAlt), images: list(x.images, m => ({ src: file(m.src, false, true), alt: bi(m.alt) })), site: url(x.site), demo: url(x.demo), repository: url(x.repository) })),
    contact: { email: string(t.email, 254), phone: string(t.phone, 40), linkedin: url(t.linkedin), github: url(t.github), links: list(t.links, l => ({ label: string(l.label, 100), url: url(l.url) })), cv: { es: file(t.cv.es, true), en: file(t.cv.en, true) } }
  };
  if (!c.profile.name) error('El nombre es obligatorio.');
  if (c.contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.contact.email)) error('Email inválido.');
  return c;
}
