const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
  about: '<circle cx="12" cy="7" r="4"/><path d="M4 22v-3a8 8 0 0 1 16 0v3z"/>',
  experience: '<rect x="2" y="7" width="20" height="15" rx="1"/><path d="M8 7V3h8v4M2 13h20M10 12v4h4v-4"/>',
  education: '<path d="m1 8 11-6 11 6-11 6zM5 11v7q7 6 14 0v-7M22 9v10"/>',
  skills: '<path d="M3 21V15h3v6M10 21V9h3v12M17 21V3h3v18"/>',
  projects: '<rect x="2" y="5" width="20" height="15" rx="1"/><path d="M2 9h20M7 13l-3 2 3 2M17 13l3 2-3 2M13 12l-2 6"/>',
  contact: '<rect x="2" y="4" width="20" height="16" rx="1"/><path d="m2 5 10 8L22 5"/>',
  download: '<path d="M12 2v13m-5-5 5 5 5-5M3 16v6h18v-6"/>',
  location: '<path d="M20 10c0 6-8 13-8 13S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  arrow: '<path d="M5 12h14m-6-6 6 6-6 6"/>'
};
const icon = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true">${icons[key] || icons.projects}</svg>`;
const labels = {
  es: { about:'Sobre mí', experience:'Experiencia', education:'Formación', skills:'Habilidades', projects:'Proyectos', contact:'Contacto', download:'Descargar CV', home:'Inicio', back:'Atrás', menu:'Menú principal', welcome:'Bienvenido a mi espacio', available:'Buscando oportunidades en IT', hello:'Hola, soy', contactMe:'Contactame', more:'Conocé mi formación', empty:'Todavía no hay contenido publicado en esta sección.', progress:'de materias aprobadas', certificate:'Ver certificado', featured:'Destacado', site:'Sitio web', demo:'Demo', repository:'Repositorio', cvMissing:'CV en español pendiente', cvFallback:'Descargar CV (EN)', preview:'VISTA PREVIA · BORRADOR', email:'Escribime', links:'Encontrame también en', minimize:'Minimizar ventana', maximize:'Ampliar o restaurar ventana', close:'Cerrar ventana', open:'Abrir portfolio', error:'No se pudo cargar el portfolio. Volvé a intentarlo.', retry:'Reintentar' },
  en: { about:'About me', experience:'Experience', education:'Education', skills:'Skills', projects:'Projects', contact:'Contact', download:'Download CV', home:'Start', back:'Back', menu:'Main menu', welcome:'Welcome to my space', available:'Looking for IT opportunities', hello:"Hi, I'm", contactMe:'Get in touch', more:'Explore my education', empty:'There is no published content in this section yet.', progress:'of subjects passed', certificate:'View certificate', featured:'Featured', site:'Website', demo:'Demo', repository:'Repository', cvMissing:'English CV pending', cvFallback:'Download CV (ES)', preview:'PREVIEW · DRAFT', email:'Email me', links:'Find me on', minimize:'Minimize window', maximize:'Maximize or restore window', close:'Close window', open:'Open portfolio', error:'Could not load the portfolio. Please try again.', retry:'Retry' }
};
let lang = 'es'; try { lang = localStorage.getItem('fg-language') === 'en' ? 'en' : 'es'; } catch {}
const params = new URLSearchParams(location.search);
if (['es','en'].includes(params.get('lang'))) lang = params.get('lang');
const staticContentURL = document.documentElement.dataset.contentUrl;
const isPreview = !staticContentURL && params.get('preview') === '1';
let content, section = 'about', phoneHome = true, minimized = false, closed = false;
const mq = matchMedia('(max-width: 800px), (max-height: 500px) and (max-width: 1000px)');
const t = key => labels[lang][key] || key;
const text = value => typeof value === 'object' && value ? value[lang] || value[lang === 'es' ? 'en' : 'es'] || '' : value || '';
const paragraphs = s => esc(text(s)).split('\n').filter(Boolean).map(p=>`<p>${p}</p>`).join('');
const link = (url, label, cls='') => `<a class="${cls}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
function cvLink(cls='button', short=false) { const selected=content.contact.cv[lang], fallback=content.contact.cv[lang==='es'?'en':'es']; return selected || fallback ? `<a class="${cls}" href="${esc(selected || fallback)}" download>${icon('download')}<span>${esc(selected ? t('download') : t('cvFallback'))}</span></a>` : `<span class="unavailable">${esc(t('cvMissing'))}</span>`; }
const sections = () => ['about','experience','education','skills',...(content.projects.length ? ['projects'] : []),'contact'];
function photo() { const p=content.profile; return p.photo ? `<div class="profile-photo"><img src="${esc(p.photo)}" alt="${esc(text(p.photoAlt))}" style="object-position:${p.photoX}% ${p.photoY}%;transform-origin:${p.photoX}% ${p.photoY}%;transform:scale(${p.photoZoom})" /></div>` : ''; }
function about() { const p=content.profile; return `<div class="about-view"><div class="eyebrow"><span class="status-dot"></span>${t('available')}</div><div class="profile-heading">${photo()}<div><p class="hello">${t('hello')}</p><h1>${esc(p.name)}<span class="cursor" aria-hidden="true">_</span></h1><p class="profession">${esc(text(p.title))}</p></div></div><div class="intro">${paragraphs(p.intro)}</div><p class="location">${icon('location')}${esc(text(p.location))}</p><div class="actions">${cvLink('button primary')}<button class="button" data-section="contact">${t('contactMe')}${icon('arrow')}</button></div><button class="text-link" data-section="education">${t('more')} <span aria-hidden="true">↗</span></button></div>`; }
function entries(type) { const arr=content[type]; return `<div class="section-heading"><span class="eyebrow">${esc(content.profile.name)}</span><h1>${t(type)}</h1></div>${arr.length ? arr.map(x=>`<article class="entry"><div class="entry-icon">${icon(type)}</div><div class="entry-content"><h2>${esc(text(x.title))}</h2>${text(x.organization)?`<p class="organization">${esc(text(x.organization))}</p>`:''}<div class="entry-meta">${text(x.dates)?`<span>${esc(text(x.dates))}</span>`:''}${text(x.status)?`<span class="tag">${esc(text(x.status))}</span>`:''}</div>${paragraphs(x.description)}${x.tasks?paragraphs(x.tasks):''}${x.progress!==null && x.progress!==undefined?`<p class="progress-label">${x.progress}% ${t('progress')}</p><progress value="${x.progress}" max="100" aria-label="${esc(t('progress'))}"></progress>`:''}${x.certificate && x.certificateVisible?link(x.certificate,`${icon('education')}${t('certificate')}`,'button small'):''}</div></article>`).join(''):`<p>${t('empty')}</p>`}<div class="section-bottom">${cvLink()}</div>`; }
function skills() { return `<div class="section-heading"><span class="eyebrow">${lang==='es'?'Herramientas e idiomas':'Tools & languages'}</span><h1>${t('skills')}</h1></div><div class="skills-grid">${content.skills.map((s,i)=>`<article class="skill-card"><span class="skill-number">${String(i+1).padStart(2,'0')}</span><h2>${esc(text(s.title))}</h2><p>${esc(text(s.description))}</p></article>`).join('')}</div>`; }
function projects() { return `<div class="section-heading"><span class="eyebrow">Portfolio</span><h1>${t('projects')}</h1></div>${[...content.projects].sort((a,b)=>Number(b.featured)-Number(a.featured)).map(p=>`<article class="project">${p.cover?`<img class="project-cover" src="${esc(p.cover)}" alt="${esc(text(p.coverAlt))}" loading="lazy">`:''}${p.featured?`<span class="tag">${t('featured')}</span>`:''}<h2>${esc(text(p.title))}</h2>${paragraphs(p.description)}<p class="technology">${esc(p.technologies)}</p><div class="project-links">${['site','demo','repository'].filter(k=>p[k]).map(k=>link(p[k],`${t(k)} ↗`)).join('')}</div>${p.images.length?`<div class="gallery">${p.images.map(i=>link(i.src,`<img src="${esc(i.src)}" alt="${esc(text(i.alt))}" loading="lazy">`)).join('')}</div>`:''}</article>`).join('')}`; }
function contact() { const c=content.contact; return `<div class="section-heading"><span class="eyebrow">${t('available')}</span><h1>${t('contactMe')}</h1></div>${c.email?`<a class="contact-email" href="mailto:${esc(c.email)}">${icon('contact')}<span>${esc(c.email)}</span>${icon('arrow')}</a>`:''}<p class="location">${icon('location')}${esc(text(content.profile.location))}</p>${c.phone?`<a class="phone-link" href="tel:${esc(c.phone.replace(/[^+0-9]/g,''))}">${esc(c.phone)}</a>`:''}<div class="contact-links"><p class="eyebrow">${t('links')}</p>${c.linkedin?link(c.linkedin,'LinkedIn ↗','contact-link'):''}${c.github?link(c.github,'GitHub ↗','contact-link'):''}${c.links.map(l=>link(l.url,`${esc(l.label)} ↗`,'contact-link')).join('')}</div><div class="section-bottom">${cvLink('button primary')}</div>`; }
function phoneMenu() { return `<div class="phone-intro">${photo()}<h1>${esc(content.profile.name)}</h1><p>${esc(text(content.profile.title))}</p></div><nav class="phone-menu" aria-label="${esc(t('menu'))}">${sections().map(s=>`<button data-section="${s}">${icon(s)}<span>${t(s)}</span></button>`).join('')}${cvLink('phone-cv',true)}</nav>`; }
function render(focus=false) {
  if (!content) return;
  document.documentElement.lang=lang; document.title=`${content.profile.name} · CV & Portfolio`;
  document.querySelectorAll('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  document.querySelectorAll('[data-label]').forEach(e=>e.textContent=t(e.dataset.label));
  $('.skip-link').textContent=lang==='es'?'Saltar al contenido':'Skip to content';
  $('.languages').setAttribute('aria-label',lang==='es'?'Idioma':'Language');
  $('#sidebar').setAttribute('aria-label',lang==='es'?'Secciones':'Sections');
  $('.monogram').setAttribute('aria-label',`${content.profile.name}, ${t('home')}`);
  for (const action of ['minimize','maximize','close']) $(`[data-action="${action}"]`).setAttribute('aria-label',t(action));
  $('#sidebar').innerHTML=sections().map(s=>`<button data-section="${s}" class="${s===section?'active':''}" ${s===section?'aria-current="page"':''}>${icon(s)}<span>${t(s)}</span></button>`).join('');
  $('#window-title').innerHTML=`${icon(section)} <span>${t(section)}</span><span class="window-path"> / facundo</span>`;
  $('#task-tab').innerHTML=`${icon(section)}<span>${t(section)}</span>`;
  $('#task-tab').hidden=closed; $('#task-language').textContent=lang.toUpperCase();
  const menu=mq.matches && phoneHome;
  $('.device-screen').classList.toggle('show-menu',menu);
  $('#window').hidden=!mq.matches && (minimized || closed);
  $('#desktop-home').hidden=mq.matches || (!minimized && !closed);
  $('#desktop-home').innerHTML=sections().map(s=>`<button class="desktop-shortcut" data-section="${s}">${icon(s)}<span>${t(s)}</span></button>`).join('');
  $('#main-content').innerHTML=menu?phoneMenu():section==='about'?about():section==='skills'?skills():section==='contact'?contact():section==='projects'?projects():entries(section);
  $('#back-button').hidden=menu; $('#back-button').textContent=`← ${t('back')}`;
  $('#phone-caption').textContent=menu?t('menu'):t(section);
  $('#preview-banner').hidden=!isPreview; $('#preview-banner').textContent=t('preview');
  if(focus) { $('#main-content').scrollTop=0; $('#main-content').focus({preventScroll:true}); }
}
document.addEventListener('click',e=>{
  const target=e.target.closest('button'); if(!target)return;
  if(target.dataset.lang) { lang=target.dataset.lang; try {localStorage.setItem('fg-language',lang);}catch{} render(); }
  if(target.dataset.section) {section=target.dataset.section;phoneHome=false;minimized=closed=false;render(true);}
  switch(target.dataset.action) {
    case 'minimize': minimized=true;render();$('#task-tab').focus();break;
    case 'maximize': $('#window').classList.toggle('maximized');target.setAttribute('aria-pressed',String($('#window').classList.contains('maximized')));break;
    case 'close': closed=true;section='about';render();$('.desktop-shortcut')?.focus();break;
    case 'restore': minimized=closed=false;render(true);break;
    case 'home': section='about';minimized=closed=false;render(true);break;
    case 'back': phoneHome=true;render(true);break;
    case 'retry': load();break;
  }
});
mq.addEventListener('change',()=>render());
function clock(){ $('#clock').textContent=new Date().toLocaleTimeString(lang,{hour:'2-digit',minute:'2-digit',hour12:false}); } clock();setInterval(clock,60000);
async function load(){try {const r=await fetch(staticContentURL ? new URL(staticContentURL,import.meta.url) : `/api/content${isPreview?'?preview=1':''}`);if(!r.ok)throw Error();content=(await r.json()).content;render();}catch{$('#main-content').innerHTML=`<p role="alert">${t('error')}</p><button class="button" data-action="retry">${t('retry')}</button>`;}}
load();
