// Small local vector illustrations, with text labels supplied by the UI.
const svg = (body, color = '#75d9d0') => `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="2" y="2" width="60" height="60" rx="12" fill="${color}" fill-opacity=".13"/>${body}</svg>`;
export function skillArtwork(title) {
  const name = title.toLowerCase();
  if (name.includes('java')) return svg('<path d="M19 29h26v13c0 7-26 7-26 0z" fill="#dce9ed"/><path d="M45 31h5c8 0 6 11-5 11M14 51h38" stroke="#b7ced8" stroke-width="3"/><path d="M27 24c-8-8 10-8 3-17m8 17c-6-6 9-9 4-15" stroke="#ed906b" stroke-width="3" stroke-linecap="round"/>', '#eb966f');
  if (name.includes('python')) return svg('<path d="M15 21c0-9 25-9 25 0v13H24v7H10c-5 0-5-20 5-20z" fill="#5097cf"/><path d="M49 43c0 9-25 9-25 0V30h16v-7h14c5 0 5 20-5 20z" fill="#f3d46d"/><circle cx="22" cy="20" r="2" fill="#fff"/><circle cx="42" cy="44" r="2" fill="#fff"/>', '#76acdb');
  if (name.includes('nosql')) return svg('<path d="M32 12v39M14 29l18-17 18 17M14 29l18 22 18-22" stroke="#81c89a" stroke-width="3"/><g fill="#9bdfac"><circle cx="32" cy="12" r="6"/><circle cx="14" cy="29" r="6"/><circle cx="50" cy="29" r="6"/><circle cx="32" cy="51" r="6"/></g>', '#81c89a');
  if (name.includes('sql')) return svg('<path d="M14 20v24c0 12 36 12 36 0V20" fill="#427e9d" stroke="#9ed5e8" stroke-width="2"/><ellipse cx="32" cy="20" rx="18" ry="8" fill="#8ac1d5"/><path d="M14 31c0 10 36 10 36 0m-36 11c0 10 36 10 36 0" stroke="#b5e1eb" stroke-width="2"/>', '#8ac1d5');
  if (/word|excel|office/.test(name)) return svg('<path d="M24 10h24l7 7v37H24z" fill="#76bf9c"/><path d="M30 22h19m-19 8h19m-19 8h19m-9-16v24" stroke="#dbf7e6" stroke-width="2"/><rect x="8" y="18" width="28" height="30" rx="3" fill="#3b78bc"/><path d="m13 27 4 14 5-11 5 11 4-14" stroke="#fff" stroke-width="2.5"/>', '#75b9c4');
  if (/español|spanish|inglés|english/.test(name)) { const text = /español|spanish/.test(name) ? 'ES' : 'EN'; return svg(`<path d="M12 14h40v29H29L17 53V43h-5z" fill="#d8bf82"/><text x="32" y="35" text-anchor="middle" fill="#3d3729" font-size="18" font-family="Arial,sans-serif" font-weight="bold">${text}</text>`, '#dbc38e'); }
  return svg('<path d="m22 20-12 12 12 12m20-24 12 12-12 12m-6-28-8 32" stroke="#89dcd3" stroke-width="4" stroke-linejoin="round"/>');
}

export function contactArtwork(type) {
  if (type === 'linkedin') return svg('<rect x="12" y="12" width="40" height="40" rx="3" fill="#317dbc"/><circle cx="22" cy="23" r="3" fill="white"/><path d="M19 29h6v17h-6zm10 0h6v2c7-6 12-2 12 5v10h-6V36c0-5-6-5-6 0v10h-6z" fill="white"/>', '#72b6ec');
  if (type === 'phone') return svg('<path d="M17 12h11l3 13-7 4c4 7 7 10 13 12l4-7 12 4v10c-1 12-23 2-33-10C9 24 8 13 17 12z" fill="#93d4a6"/>', '#93d4a6');
  if (type === 'email') return svg('<rect x="10" y="17" width="44" height="31" rx="3" fill="#d5dceb"/><path d="m11 19 21 16 21-16M11 47l15-15m27 15L38 32" stroke="#6688b2" stroke-width="2.5"/>', '#a6c4e9');
  return svg('<circle cx="32" cy="32" r="21" stroke="#b4c6dc" stroke-width="3"/><path d="M11 32h42M32 11c-15 10-15 32 0 42 15-10 15-32 0-42z" stroke="#b4c6dc" stroke-width="2"/>', '#b4c6dc');
}
