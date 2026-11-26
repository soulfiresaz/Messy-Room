// Recolorable item drawings on a 60 x 60 grid. Each has a body (filled with the chosen
// color and pattern) and details on top (outlines, buttons, laces).
const ItemArt = (() => {
  const INK = '#3a2a2a';
  const L = (w = 2.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  function shade(h, a) { const n = parseInt(h.slice(1), 16); const f = c => Math.max(0, Math.min(255, Math.round(a < 0 ? c * (1 + a) : c + (255 - c) * a))); return '#' + [n >> 16, n >> 8 & 255, n & 255].map(f).map(x => x.toString(16).padStart(2, '0')).join(''); }

  // body: one or more path strings; details(c): drawn on top.
  const ART = {
    shirts: { color: '#8fd3ff', body: ['M18 8 L24 6 Q30 11 36 6 L42 8 L54 18 L47 27 L42 23 L42 54 L18 54 L18 23 L13 27 L6 18 Z'],
      details: c => `<path d="M24 6 Q30 13 36 6" fill="none" ${L(2)}/>` },
    pants: { color: '#4f7fc0', body: ['M15 6 L45 6 L48 54 L34 54 L30 22 L26 54 L12 54 Z'],
      details: c => `<path d="M15 12 L45 12" ${L(2)}/><circle cx="30" cy="9" r="1.6" fill="${INK}"/><path d="M30 12 L30 22" ${L(1.6)}/>` },
    shorts: { color: '#5fc0e0', body: ['M12 10 L48 10 L52 44 L34 46 L30 26 L26 46 L8 44 Z'],
      details: c => `<path d="M12 16 L48 16" ${L(2)}/><path d="M27 16 q3 5 6 0" fill="none" ${L(1.6)}/>` },
    dresses: { color: '#5b7fe0', body: ['M22 6 L26 6 L28 14 L32 14 L34 6 L38 6 L38 20 L50 54 L10 54 L22 20 Z'],
      details: c => `<path d="M22 22 L38 22" stroke="${shade(c, -0.25)}" stroke-width="3"/>` },
    pajamas: { color: '#b9a2ff', body: ['M14 8 L24 4 Q30 10 36 4 L46 8 L54 22 L46 26 L44 22 L44 30 L16 30 L16 22 L14 26 L6 22 Z', 'M17 32 L43 32 L45 56 L33 56 L30 40 L27 56 L15 56 Z'],
      details: c => `<g fill="${INK}"><circle cx="30" cy="14" r="1.3"/><circle cx="30" cy="21" r="1.3"/></g>` },
    socks: { color: '#ff9fb8', body: ['M8 6 L20 6 L20 34 L30 42 Q34 50 26 52 L12 50 Q6 48 8 40 Z', 'M32 6 L44 6 L44 34 L54 42 Q58 50 50 52 L36 50 Q30 48 32 40 Z'],
      details: c => `<path d="M8 12 L20 12 M32 12 L44 12" stroke="#fff" stroke-width="3"/>` },
    underwear: { color: '#8fd3ff', body: ['M8 16 L52 16 L50 26 Q38 30 34 46 L26 46 Q22 30 10 26 Z'],
      details: c => `<path d="M8 21 L52 21" stroke="${shade(c, -0.25)}" stroke-width="3"/>` },
    jackets: { color: '#3d6fa8', body: ['M18 6 L26 4 L30 12 L34 4 L42 6 L54 18 L48 30 L44 26 L44 56 L16 56 L16 26 L12 30 L6 18 Z'],
      details: c => `<path d="M30 12 L30 56" ${L(2)}/><g fill="#e0b050"><circle cx="34" cy="22" r="1.8"/><circle cx="34" cy="32" r="1.8"/><circle cx="34" cy="42" r="1.8"/></g><path d="M26 4 L30 12 L22 16 Z M34 4 L30 12 L38 16 Z" fill="${shade(c, -0.2)}" ${L(1.6)}/>` },
    coats: { color: '#e05a6a', body: ['M20 10 Q20 2 30 2 Q40 2 40 10 L44 12 L54 22 L52 48 L46 48 L46 30 L46 56 L14 56 L14 30 L14 48 L8 48 L6 22 L16 12 Z'],
      details: c => `<path d="M22 12 Q22 6 30 6 Q38 6 38 12 Q34 16 30 16 Q26 16 22 12 Z" fill="#f3ebe0" ${L(1.8)}/><path d="M30 16 L30 56" ${L(2)}/><path d="M14 30 Q30 34 46 30 M14 43 Q30 47 46 43" fill="none" stroke="${shade(c, -0.25)}" stroke-width="2.4"/><path d="M9 34 L52 34" stroke="none"/><path d="M8 40 L14 40 M46 40 L52 40" stroke="${shade(c, -0.25)}" stroke-width="2.4"/><rect x="28.5" y="20" width="3" height="4" rx="1" fill="#d8d8e0" ${L(1)}/>` },
    scarves: { color: '#ffb84a', body: ['M28 28 L36 28 L32 54 L22 52 Z', 'M32 28 L40 28 L48 50 L38 53 Z', 'M10 18 a20 10 0 1 0 40 0 a20 10 0 1 0 -40 0 Z M18 17 a12 5 0 1 0 24 0 a12 5 0 1 0 -24 0 Z', 'M26 22 Q32 20 38 22 L37 30 Q32 32 27 30 Z'],
      details: c => `<path d="M23 52 l-1 5 M27 53 v5 M31 54 l1 5 M39 53 l-1 5 M43 52 v5 M47 50 l1 5" ${L(2)}/>` },
    hats: { color: '#4f8fe0', body: ['M10 38 Q10 12 32 12 Q52 12 52 36 Z', 'M46 34 Q58 34 58 40 L36 42 Q38 36 46 34 Z'],
      details: c => `<circle cx="31" cy="12" r="2.5" fill="${shade(c, -0.3)}"/><path d="M31 14 Q24 24 22 37" fill="none" stroke="${shade(c, -0.25)}" stroke-width="1.6"/>` },
    shoes: { color: '#4fb0f0', body: ['M6 38 Q6 26 14 24 L26 24 Q32 32 44 34 Q56 36 56 44 L56 48 L6 48 Z'],
      details: c => `<path d="M6 44 L56 44" stroke="#fff" stroke-width="4"/><path d="M18 27 L22 31 M22 25 L26 30 M26 26 L30 31" ${L(1.6)}/>` },
    stuffies: { color: '#c98b5a', body: ['M11.5 14 a6.5 6.5 0 1 0 13.0 0 a6.5 6.5 0 1 0 -13.0 0 Z', 'M35.5 14 a6.5 6.5 0 1 0 13.0 0 a6.5 6.5 0 1 0 -13.0 0 Z', 'M15 46 a15 11 0 1 0 30 0 a15 11 0 1 0 -30 0 Z', 'M16 26 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0 Z'],
      details: c => `<circle cx="18" cy="14" r="3" fill="${shade(c, 0.35)}"/><circle cx="42" cy="14" r="3" fill="${shade(c, 0.35)}"/><g fill="${INK}"><circle cx="24.5" cy="24" r="2"/><circle cx="35.5" cy="24" r="2"/></g><ellipse cx="30" cy="31" rx="6.5" ry="4.5" fill="${shade(c, 0.45)}"/><circle cx="30" cy="29.5" r="2" fill="${INK}"/><ellipse cx="30" cy="47" rx="7" ry="5" fill="${shade(c, 0.3)}"/>` },
    purse: { color: '#c9634a', body: ['M10 26 L50 26 L46 54 L14 54 Z'],
      details: c => `<path d="M20 26 Q20 10 30 10 Q40 10 40 26" fill="none" ${L(3)}/><rect x="26" y="32" width="8" height="6" rx="1.5" fill="#e0b050" ${L(1.4)}/>` },
    backpacks: { color: '#e8655a', body: ['M14 16 Q14 8 30 8 Q46 8 46 16 L48 54 L12 54 Z'],
      details: c => `<path d="M24 8 Q24 2 30 2 Q36 2 36 8" fill="none" ${L(2.4)}/><rect x="18" y="32" width="24" height="16" rx="5" fill="${shade(c, -0.15)}" ${L(2)}/><path d="M18 38 L42 38" ${L(1.4)}/>` },
    blankets: { color: '#7fd8c0', body: ['M6 14 L54 14 L54 48 L6 48 Z'],
      details: c => `<path d="M8 48 l-2 5 M16 48 l-1 5 M24 48 v5 M32 48 v5 M40 48 l1 5 M48 48 l2 5" ${L(2)}/>` },
  };

  const PATTERNS = ['none', 'stripes', 'dots', 'flowers', 'hearts', 'stars'];

  function patternDef(id, kind, c) {
    const light = '#ffffff';
    if (kind === 'stripes') return `<pattern id="${id}" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="8" height="8" fill="${c}"/><rect width="3.5" height="8" fill="${light}" opacity=".75"/></pattern>`;
    if (kind === 'dots') return `<pattern id="${id}" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="${c}"/><circle cx="4.5" cy="4.5" r="1.9" fill="${light}"/></pattern>`;
    if (kind === 'flowers') return `<pattern id="${id}" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="${c}"/><g transform="translate(7 7)">${[0, 72, 144, 216, 288].map(a => `<ellipse cy="-2.6" rx="1.6" ry="2.4" fill="${light}" transform="rotate(${a})"/>`).join('')}<circle r="1.4" fill="#ffd54a"/></g></pattern>`;
    if (kind === 'hearts') return `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${c}"/><path d="M6 9 C1.5 6 2.5 2.5 6 4.5 C9.5 2.5 10.5 6 6 9Z" fill="${light}"/></pattern>`;
    if (kind === 'stars') return `<pattern id="${id}" width="12" height="12" patternUnits="userSpaceOnUse"><rect width="12" height="12" fill="${c}"/><path d="M6 2.5 l1 2.3 2.5 .2 -1.9 1.6 .6 2.4 -2.2 -1.3 -2.2 1.3 .6 -2.4 -1.9 -1.6 2.5 -.2z" fill="${light}"/></pattern>`;
    return '';
  }

  let n = 0;
  // The drawing's inner markup (60 x 60 grid).
  function inner(key, color, pattern = 'none') {
    const a = ART[key];
    if (!a) return '';
    const c = color || a.color;
    const id = `pt${++n}`;
    const def = pattern && pattern !== 'none' ? `<defs>${patternDef(id, pattern, c)}</defs>` : '';
    const fill = def ? `url(#${id})` : c;
    return def + a.body.map(d => `<path d="${d}" fill="${fill}" fill-rule="evenodd" ${L()}/>`).join('') + a.details(c);
  }

  const svg = (key, color, pattern) => `<svg viewBox="0 0 60 60">${inner(key, color, pattern)}</svg>`;

  return { ART, PATTERNS, inner, svg, has: key => !!ART[key] };
})();
