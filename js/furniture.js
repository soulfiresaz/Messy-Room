// Furniture: ready-made pieces, how they're built from parts, and their drawings.
// Same flat style as the stickers: soft colors, dark rounded outlines.
//
// A storage piece is built from columns of parts:
//   piece = { id, kind, style, color, label, w, h, d, cols: [ { id, w, cells: [cell] } ] }
//   cell  = { id, type: 'drawer' | 'open' | 'cupboard', h, insert, binColor, shelves, hinge, spots }
// w and h are sizes "by eye" (about one unit per hand width), d is how deep it is on the map.
// Every space that can hold things has its own id, so what's kept there stays put
// when other parts change.
const Furniture = (() => {
  const INK = '#3a2a2a';
  const U = 36;          // pixels per unit in the front view
  const P = 8;           // gap between parts

  const COLORS = ['#ffb3d1', '#ff8fa3', '#ffd27a', '#ffd54a', '#7fd8c0', '#8fd3ff', '#9db8ff', '#b9a2ff', '#f4ead8', '#ffffff', '#c98b5a', '#8a6a5a', '#9aa7b8', '#4a4a5a'];
  const BIN_COLORS = ['#ff9fb8', '#8fd3ff', '#ffd54a', '#b9a2ff', '#7fd8c0', '#f4ead8', '#9aa7b8'];

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function shade(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    const f = c => Math.max(0, Math.min(255, Math.round(a < 0 ? c * (1 + a) : c + (255 - c) * a)));
    return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(x => x.toString(16).padStart(2, '0')).join('');
  }

  const line = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const rect = (x, y, w, h, fill, rx = 6, lw = 3, extra = '') =>
    `<rect x="${x}" y="${y}" width="${Math.max(0, w)}" height="${Math.max(0, h)}" rx="${rx}" fill="${fill}" ${line(lw)} ${extra}/>`;
  const knob = (x, y, c) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${shade(c, -0.35)}" ${line(2)}/>`;
  const svg = (w, h, inner, cls = '') =>
    `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  // ---------- Building pieces ----------

  const cell = (type, h = 1, extra = {}) => {
    const c = { id: uid(), type, h, ...extra };
    if (type === 'open' && !c.insert) c.insert = 'empty';
    if (type === 'cupboard') {
      if (c.shelves == null) c.shelves = 1;
      c.spots = c.spots || Array.from({ length: c.shelves + 1 }, () => ({ id: uid() }));
    }
    return c;
  };
  const col = (cells, w = 1) => ({ id: uid(), w, cells });
  const drawers = n => Array.from({ length: n }, () => cell('drawer'));
  const opens = (n, inserts = []) => Array.from({ length: n }, (_, i) => {
    const ins = inserts[i] || 'empty';
    return cell('open', 1, { insert: ins, binColor: BIN_COLORS[i % 4] });
  });

  const base = (kind, style, color, w, h, d, extra = {}) => ({ id: uid(), kind, style, color, label: '', w, h, d, ...extra });

  // Cubbies laid out in a grid, filled with a mix of bins and sorters to start.
  function cubbyGrid(cols, rows) {
    const pattern = ['bin', 'empty', 'sorter', 'bin', 'empty', 'bin', 'empty', 'empty'];
    let k = 0;
    return Array.from({ length: cols }, () => col(Array.from({ length: rows }, () => {
      const ins = pattern[k % pattern.length];
      return cell('open', 1, { insert: ins, binColor: BIN_COLORS[k++ % 4] });
    })));
  }

  const CATALOG = [
    // Beds
    { key: 'twin', group: 'beds', make: () => base('bed', 'bed', '#8fd3ff', 3, 3, 5.5, { bed: 'twin' }) },
    { key: 'bunk', group: 'beds', make: () => base('bed', 'bed', '#ffb3d1', 6, 6, 3, { bed: 'bunk' }) },
    { key: 'loft', group: 'beds', make: () => base('bed', 'bed', '#ffb3d1', 6, 6, 3, { bed: 'loft' }) },
    { key: 'queen', group: 'beds', make: () => base('bed', 'bed', '#b9a2ff', 4.5, 3, 6, { bed: 'queen' }) },
    { key: 'king', group: 'beds', make: () => base('bed', 'bed', '#7fd8c0', 5.5, 3, 6, { bed: 'king' }) },
    // Dressers
    { key: 'dresser4', group: 'dressers', make: () => base('dresser', 'wood', '#ffb3d1', 3.4, 4.6, 1.5, { cols: [col(drawers(4))] }) },
    { key: 'wide4', group: 'dressers', make: () => base('dresser', 'wood', '#8fd3ff', 6, 4.6, 1.5, { cols: [col(drawers(4))] }) },
    { key: 'wide5', group: 'dressers', make: () => base('dresser', 'wood', '#8fd3ff', 6, 5.6, 1.5, { cols: [col(drawers(5))] }) },
    { key: 'tall6', group: 'dressers', make: () => base('dresser', 'wood', '#ffb3d1', 3, 7, 1.5, { cols: [col(drawers(6))] }) },
    { key: 'wide2x3', group: 'dressers', make: () => base('dresser', 'wood', '#8fd3ff', 6, 4.6, 1.5, { cols: [col(drawers(3)), col(drawers(3))] }) },
    {
      key: 'cupboard2', group: 'dressers', make: () => base('dresser', 'wood', '#ffd27a', 5.8, 4.2, 1.5, {
        cols: [col([cell('drawer', 0.8), cell('cupboard', 2.4, { hinge: 'l' })]), col([cell('drawer', 0.8), cell('cupboard', 2.4, { hinge: 'r' })])],
      }),
    },
    {
      key: 'long', group: 'dressers', make: () => base('dresser', 'wood', '#7fd8c0', 10.5, 4.2, 1.6, {
        cols: [col(drawers(3), 1), col([cell('cupboard', 1, { hinge: 'l' })], 1.4), col(drawers(3), 1)],
      }),
    },
    // Side tables
    { key: 'side1', group: 'tables', make: () => base('table', 'wood', '#b9a2ff', 2.6, 3, 1.2, { cols: [col([cell('drawer', 1), cell('open', 1.6)])] }) },
    { key: 'side2', group: 'tables', make: () => base('table', 'wood', '#7fd8c0', 2.6, 3.4, 1.2, { cols: [col(drawers(2))] }) },
    // Drawer containers (the small plastic kind)
    { key: 'tower3', group: 'containers', make: () => base('tower', 'plastic', '#ff9fb8', 2, 3.6, 1.2, { cols: [col(drawers(3))] }) },
    { key: 'tower4', group: 'containers', make: () => base('tower', 'plastic', '#8fd3ff', 2, 4.7, 1.2, { cols: [col(drawers(4))] }) },
    { key: 'tower5', group: 'containers', make: () => base('tower', 'plastic', '#b9a2ff', 2, 5.8, 1.2, { cols: [col(drawers(5))] }) },
    // Cubbies
    { key: 'cubby2x4', group: 'cubbies', make: () => base('cubby', 'cube', '#f4ead8', 3.2, 6.2, 1.2, { cols: cubbyGrid(2, 4) }) },
    { key: 'cubby4x3', group: 'cubbies', make: () => base('cubby', 'cube', '#f4ead8', 6.2, 4.7, 1.2, { cols: cubbyGrid(4, 3) }) },
    { key: 'cubby4x4', group: 'cubbies', make: () => base('cubby', 'cube', '#f4ead8', 6.2, 6.2, 1.2, { cols: cubbyGrid(4, 4) }) },
    // Shelves
    { key: 'bookshelf', group: 'shelves', make: () => base('bookshelf', 'cube', '#c98b5a', 3.4, 7, 1, { cols: [col(opens(5))] }) },
    { key: 'wallShort', group: 'shelves', make: () => base('wallshelf', 'wallshelf', '#7fd8c0', 3.4, 1.4, 0.6, { spot: { id: uid() } }) },
    { key: 'wallLong', group: 'shelves', make: () => base('wallshelf', 'wallshelf', '#ff9fb8', 6.5, 1.4, 0.6, { spot: { id: uid() } }) },
    // Closet
    {
      key: 'closet', group: 'closet', make: () => base('closet', 'closet', '#e9dcc6', 10, 13, 2, {
        shelves: [{ id: uid() }], rods: 'high', rodSpots: [{ id: uid() }, { id: uid() }], floor: { id: uid() },
      }),
    },
    // Seats
    { key: 'chair', group: 'seats', make: () => base('seat', 'seat', '#8fd3ff', 2.2, 3.6, 1.4, { seat: 'chair' }) },
    { key: 'beanbag', group: 'seats', make: () => base('seat', 'seat', '#b9a2ff', 3, 2.4, 2.4, { seat: 'beanbag' }) },
    { key: 'floorchair', group: 'seats', make: () => base('seat', 'seat', '#ff9fb8', 2.8, 2.4, 2, { seat: 'floorchair' }) },
  ];

  const GROUPS = [
    { key: 'beds', icon: '🛏️', label: 'Beds' },
    { key: 'dressers', icon: '🗄️', label: 'Dressers' },
    { key: 'tables', icon: '🪑', label: 'Side tables' },
    { key: 'containers', icon: '📦', label: 'Drawer containers' },
    { key: 'cubbies', icon: '🔲', label: 'Cubbies' },
    { key: 'shelves', icon: '📚', label: 'Shelves' },
    { key: 'closet', icon: '👕', label: 'Closet' },
    { key: 'seats', icon: '💺', label: 'Seats' },
  ];

  function make(key) {
    const entry = CATALOG.find(c => c.key === key);
    return entry ? entry.make() : null;
  }

  // Pieces made from columns of parts can have their parts changed.
  const hasParts = p => Array.isArray(p.cols);
  // Pieces that can stand on a closet floor.
  const fitsInCloset = p => hasParts(p);

  // ---------- Spaces (where things are kept) ----------

  // Every space in a piece, so later stages can assign what it holds and who owns it.
  function spacesOf(p) {
    if (hasParts(p)) {
      return p.cols.flatMap(c => c.cells.flatMap(x => x.type === 'cupboard' ? x.spots : [x]));
    }
    if (p.kind === 'wallshelf') return [p.spot];
    if (p.kind === 'closet') return [...p.shelves, ...p.rodSpots.slice(0, p.rods === 'two' ? 2 : 1), p.floor];
    return [];
  }

  // A space is "used" once something is assigned to it or someone owns it.
  const spaceUsed = s => !!s && ((s.holds && s.holds.length > 0) || (s.owners && s.owners.length > 0));
  const cellUsed = c => (c.type === 'cupboard' ? c.spots.some(spaceUsed) : spaceUsed(c));

  // ---------- Front view drawings ----------

  // Size of the drawing for a piece, in pixels, including tops, legs and wheels.
  function frontBox(p) {
    if (p.kind === 'closet') return closetBox(p);
    const w = p.w * U, h = p.h * U;
    if (p.style === 'wood') return { W: w + 24, H: h + 40, ox: 12, oy: 18 };
    if (p.style === 'plastic') return { W: w + 8, H: h + 24, ox: 4, oy: 4 };
    if (p.style === 'wallshelf') return { W: w + 8, H: h + 8, ox: 4, oy: 4 };
    return { W: w + 8, H: h + 8, ox: 4, oy: 4 };
  }

  // Lays out columns and parts inside the body of a storage piece.
  function layout(p, x, y, w, h) {
    const totalW = p.cols.reduce((a, c) => a + c.w, 0);
    const innerW = w - P * (p.cols.length + 1);
    let cx = x + P;
    return p.cols.map((c, ci) => {
      const cw = innerW * c.w / totalW;
      const totalH = c.cells.reduce((a, k) => a + k.h, 0);
      const innerH = h - P * (c.cells.length + 1);
      let cy = y + P;
      const cells = c.cells.map(k => {
        const ch = innerH * k.h / totalH;
        const box = { cell: k, x: cx, y: cy, w: cw, h: ch, ci };
        cy += ch + P;
        return box;
      });
      const out = { col: c, x: cx, w: cw, cells };
      cx += cw + P;
      return out;
    });
  }

  function binArt(x, y, w, h, c) {
    const hw = Math.min(26, w * 0.4);
    return rect(x + 4, y + h * 0.12, w - 8, h * 0.86, c, 6) +
      `<rect x="${x + w / 2 - hw / 2}" y="${y + h * 0.3}" width="${hw}" height="${Math.max(6, h * 0.14)}" rx="${Math.max(3, h * 0.07)}" fill="${shade(c, -0.4)}"/>`;
  }

  function sorterArt(x, y, w, h) {
    let o = '';
    const th = (h - 8) / 3;
    for (let i = 0; i < 3; i++) {
      const ty = y + 4 + i * th;
      o += `<rect x="${x + 8}" y="${ty + th * 0.3}" width="${w - 16}" height="${th * 0.4}" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.4"/>`;
      o += `<rect x="${x + 4}" y="${ty + th * 0.52}" width="${w - 8}" height="${th * 0.42}" rx="3" fill="#9aa7b8" stroke="${INK}" stroke-width="2"/>`;
    }
    return o;
  }

  // One part on the front of a piece.
  function partArt(p, b, state = {}) {
    const k = b.cell, c = p.color;
    const front = shade(c, 0.14);
    const hole = shade(c, -0.45);
    let o = '';
    if (k.type === 'drawer') {
      if (p.style === 'plastic') {
        o += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="5" fill="${c}" fill-opacity=".6" ${line(2)}/>`;
        const hw = Math.min(30, b.w * 0.4);
        o += rect(b.x + b.w / 2 - hw / 2, b.y + Math.min(8, b.h * 0.2), hw, 7, '#fff', 3.5, 1.6);
      } else {
        o += rect(b.x, b.y, b.w, b.h, front, 6);
        if (b.w > 150) o += knob(b.x + b.w * 0.3, b.y + b.h / 2, c) + knob(b.x + b.w * 0.7, b.y + b.h / 2, c);
        else o += knob(b.x + b.w / 2, b.y + b.h / 2, c);
      }
    } else if (k.type === 'open') {
      o += rect(b.x, b.y, b.w, b.h, hole, 4, 2);
      if (k.insert === 'bin') o += binArt(b.x, b.y, b.w, b.h, k.binColor || BIN_COLORS[0]);
      if (k.insert === 'sorter') o += sorterArt(b.x, b.y, b.w, b.h);
    } else if (k.type === 'cupboard') {
      o += rect(b.x, b.y, b.w, b.h, front, 6);
      const kx = k.hinge === 'r' ? b.x + 13 : b.x + b.w - 13;
      o += knob(kx, b.y + b.h / 2, c);
    }
    const sel = state.selected === k.id
      ? `<rect x="${b.x - 4}" y="${b.y - 4}" width="${b.w + 8}" height="${b.h + 8}" rx="9" fill="none" stroke="#3a86ff" stroke-width="5" stroke-dasharray="10 6"/>`
      : '';
    if (!state.interactive) return o + sel;
    return `<g class="fpart" data-act="part" data-id="${k.id}" role="button" aria-label="Open">` +
      `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" fill="transparent"/>${o}</g>${sel}`;
  }

  function storageArt(p, state) {
    const { ox, oy } = frontBox(p);
    const w = p.w * U, h = p.h * U, c = p.color;
    let o = '';
    if (p.style === 'wood') {
      const legC = shade(c, -0.3);
      o += rect(ox + 8, oy + h - 2, 10, 16, legC, 3) + rect(ox + w - 18, oy + h - 2, 10, 16, legC, 3);
      o += rect(ox, oy, w, h, c, 8);
      o += rect(ox - 6, oy - 12, w + 12, 15, shade(c, 0.28), 6);
    } else if (p.style === 'plastic') {
      o += `<circle cx="${ox + 14}" cy="${oy + h + 8}" r="7" fill="#9aa7b8" ${line(2)}/><circle cx="${ox + w - 14}" cy="${oy + h + 8}" r="7" fill="#9aa7b8" ${line(2)}/>`;
      o += rect(ox, oy, w, h, '#eef1f5', 8);
    } else {
      o += rect(ox, oy, w, h, c, 8);
    }
    layout(p, ox, oy, w, h).forEach(colBox => colBox.cells.forEach(b => { o += partArt(p, b, state); }));
    return o;
  }

  function bedArt(p) {
    const { ox, oy } = frontBox(p);
    const w = p.w * U, h = p.h * U, c = p.color;
    const frame = '#d9c4a2';
    const one = (x, y, bw, bh, pillows) => {
      let o = rect(x, y, bw, bh * 0.55, frame, 10);                         // headboard
      o += rect(x - 4, y + bh * 0.45, bw + 8, bh * 0.4, '#fff', 10);        // mattress
      const pw = (bw - 24 - (pillows - 1) * 10) / pillows;
      for (let i = 0; i < pillows; i++) o += rect(x + 12 + i * (pw + 10), y + bh * 0.3, pw, bh * 0.22, '#fffaf0', 12, 2);
      o += `<path d="M${x - 4} ${y + bh * 0.58} L${x + bw + 4} ${y + bh * 0.58} L${x + bw + 4} ${y + bh * 0.78} Q${x + bw + 4} ${y + bh * 0.86} ${x + bw - 6} ${y + bh * 0.86} L${x + 6} ${y + bh * 0.86} Q${x - 4} ${y + bh * 0.86} ${x - 4} ${y + bh * 0.78} Z" fill="${c}" ${line(2.5)}/>`;
      o += `<path d="M${x} ${y + bh * 0.64} L${x + bw} ${y + bh * 0.64}" stroke="${shade(c, 0.45)}" stroke-width="5"/>`;
      o += rect(x + 2, y + bh * 0.85, 10, bh * 0.15, shade(frame, -0.25), 3) + rect(x + bw - 12, y + bh * 0.85, 10, bh * 0.15, shade(frame, -0.25), 3);
      return o;
    };
    if (p.bed === 'bunk') {
      // Seen from the side: two beds stacked, a rail on top and a ladder.
      let o = rect(ox, oy, 12, h, '#c9cfd8', 4) + rect(ox + w - 12, oy, 12, h, '#c9cfd8', 4);
      const level = (y) => rect(ox + 20, y - 10, w * 0.2, 22, '#fffaf0', 10, 2) + rect(ox + 12, y, w - 24, 22, '#fff', 6, 2) +
        rect(ox + w * 0.3, y - 2, w * 0.66 - 12, 24, c, 6, 2) + rect(ox, y + 22, w, 15, '#c9cfd8', 4);
      const top = oy + 34, low = oy + h * 0.68;
      o += rect(ox + 12, top - 28, w * 0.6, 9, '#c9cfd8', 4, 2);
      [0.2, 0.4, 0.6].forEach(f => { o += rect(ox + w * f, top - 20, 7, 20, '#c9cfd8', 2, 2); });
      o += level(top) + level(low);
      const lx = ox + w - 56;
      o += rect(lx, top + 37, 8, low - top - 37, '#c9cfd8', 3, 2);
      for (let i = 0; i < 3; i++) o += rect(lx + 8, top + 58 + i * (low - top - 60) / 3, 34, 7, '#c9cfd8', 3, 2);
      return o;
    }
    if (p.bed === 'loft') {
      let o = rect(ox, oy, 12, h, '#c9cfd8', 4) + rect(ox + w - 12, oy, 12, h, '#c9cfd8', 4);
      const top = oy + 34;
      o += rect(ox + 12, top - 28, w * 0.6, 9, '#c9cfd8', 4, 2);
      [0.2, 0.4, 0.6].forEach(f => { o += rect(ox + w * f, top - 20, 7, 20, '#c9cfd8', 2, 2); });
      o += rect(ox + 20, top - 10, w * 0.2, 22, '#fffaf0', 10, 2) + rect(ox + 12, top, w - 24, 22, '#fff', 6, 2);
      o += rect(ox + w * 0.3, top - 2, w * 0.66 - 12, 24, '#8fd3ff', 6, 2);
      o += rect(ox, top + 22, w, 15, '#c9cfd8', 4);
      const lx = ox + w - 56;
      o += rect(lx, top + 37, 8, oy + h - top - 37, '#c9cfd8', 3, 2);
      for (let i = 0; i < 4; i++) o += rect(lx + 8, top + 62 + i * (h - 90) / 4.5, 34, 7, '#c9cfd8', 3, 2);
      // Couch underneath (folds down into a bed)
      const cx = ox + 24, cw = w - 100, fy = oy + h;
      o += rect(cx + 10, fy - 90, cw - 20, 48, c, 12) + rect(cx + 10, fy - 46, cw - 20, 28, shade(c, 0.25), 10);
      o += rect(cx, fy - 70, 22, 54, shade(c, -0.08), 10) + rect(cx + cw - 22, fy - 70, 22, 54, shade(c, -0.08), 10);
      o += rect(cx + 34, fy - 80, 32, 28, '#ffd54a', 9, 2);
      o += rect(cx + 8, fy - 16, 8, 14, shade(c, -0.35), 3, 2) + rect(cx + cw - 16, fy - 16, 8, 14, shade(c, -0.35), 3, 2);
      return o;
    }
    return one(ox + 4, oy, w - 8, h, p.bed === 'twin' ? 1 : 2);
  }

  function seatArt(p) {
    const { ox, oy } = frontBox(p);
    const w = p.w * U, h = p.h * U, c = p.color;
    if (p.seat === 'chair') {
      return rect(ox + w * 0.1, oy, w * 0.8, h * 0.5, c, 10) + rect(ox, oy + h * 0.48, w, h * 0.12, shade(c, 0.22), 5) +
        rect(ox + w * 0.06, oy + h * 0.6, 9, h * 0.4, shade(c, -0.3), 3) + rect(ox + w * 0.94 - 9, oy + h * 0.6, 9, h * 0.4, shade(c, -0.3), 3);
    }
    if (p.seat === 'beanbag') {
      const x = ox, y = oy;
      return `<path d="M${x + 2} ${y + h * 0.82} C${x - 4} ${y + h * 0.25} ${x + w * 0.3} ${y - 4} ${x + w * 0.55} ${y + 6} C${x + w * 0.8} ${y + h * 0.15} ${x + w + 2} ${y + h * 0.45} ${x + w - 2} ${y + h * 0.82} C${x + w - 6} ${y + h} ${x + 6} ${y + h} ${x + 2} ${y + h * 0.82}Z" fill="${c}" ${line()}/>` +
        `<path d="M${x + w * 0.22} ${y + h * 0.6} Q${x + w * 0.5} ${y + h * 0.48} ${x + w * 0.78} ${y + h * 0.6}" stroke="${shade(c, -0.3)}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    }
    return `<path d="M${ox + w * 0.16} ${oy} L${ox + w * 0.8} ${oy} Q${ox + w * 0.86} ${oy} ${ox + w * 0.86} ${oy + 8} L${ox + w * 0.88} ${oy + h * 0.72} L${ox + w * 0.12} ${oy + h * 0.72} L${ox + w * 0.08} ${oy + 8} Q${ox + w * 0.08} ${oy} ${ox + w * 0.16} ${oy}Z" fill="${c}" ${line()}/>` +
      rect(ox, oy + h * 0.66, w, h * 0.32, shade(c, 0.22), 12);
  }

  function wallshelfArt(p, state) {
    const { ox, oy } = frontBox(p);
    const w = p.w * U, h = p.h * U, c = p.color;
    const y = oy + h * 0.3;
    let o = rect(ox, y, w, 14, c, 5);
    o += `<path d="M${ox + 14} ${y + 14} l0 ${h * 0.45} l20 ${-h * 0.45}" fill="${shade(c, -0.25)}" ${line()}/>`;
    o += `<path d="M${ox + w - 14} ${y + 14} l0 ${h * 0.45} l-20 ${-h * 0.45}" fill="${shade(c, -0.25)}" ${line()}/>`;
    if (!state.interactive) return o;
    return `<g class="fpart" data-act="part" data-id="${p.spot.id}" role="button" aria-label="Open"><rect x="${ox}" y="${oy}" width="${w}" height="${y - oy + 14}" fill="transparent"/>${o}</g>`;
  }

  // ---------- Closet ----------

  const CLOSET_FLOOR = 3.6;   // units of floor height under the high rod's clothes

  function closetInner(p, inside, addInside) {
    // The closet grows on its own to fit what stands on its floor (and the ➕ next to it).
    const need = inside.reduce((a, q) => a + frontBox(q).W + 14, 40) + (addInside ? 80 : 0);
    return { w: Math.max(p.w * U, need), h: p.h * U };
  }

  function closetBox(p, inside = [], addInside = false) {
    const { w, h } = closetInner(p, inside, addInside);
    return { W: w + 8, H: h + 8, ox: 4, oy: 4 };
  }

  function hanger(x, y, c, kind, s = 1) {
    const L = line(2.4);
    let o = `<path d="M${x} ${y - 6 * s} q0 -8 6 -8" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    if (kind === 'dress') {
      o += `<path d="M${x - 10 * s} ${y} L${x + 10 * s} ${y} L${x + 6 * s} ${y + 20 * s} L${x + 20 * s} ${y + 60 * s} L${x - 20 * s} ${y + 60 * s} L${x - 6 * s} ${y + 20 * s} Z" fill="${c}" ${L}/>`;
    } else {
      o += `<path d="M${x - 12 * s} ${y} L${x + 12 * s} ${y} L${x + 20 * s} ${y + 12 * s} L${x + 14 * s} ${y + 18 * s} L${x + 12 * s} ${y + 15 * s} L${x + 12 * s} ${y + 46 * s} L${x - 12 * s} ${y + 46 * s} L${x - 12 * s} ${y + 15 * s} L${x - 14 * s} ${y + 18 * s} L${x - 20 * s} ${y + 12 * s} Z" fill="${c}" ${L}/>`;
    }
    return o;
  }

  // Where the shelves, rods and floor sit inside a closet (heights in units, like real closets).
  function closetLayout(p, inside, addInside) {
    const { w, h } = closetInner(p, inside, addInside);
    const ox = 4, oy = 4, pad = 16;
    const x0 = ox + pad, x1 = ox + w - pad;
    const floorY = oy + h - pad;
    const shelves = p.shelves.map((s, i) => ({ spot: s, y: oy + pad + U * 1.4 + i * U * 1.3 }));
    const topY = shelves.length ? shelves[shelves.length - 1].y + 12 : oy + pad;
    const rods = [];
    if (p.rods === 'two') {
      rods.push({ spot: p.rodSpots[0], y: topY + U * 0.6, s: 1.3 });
      rods.push({ spot: p.rodSpots[1], y: topY + U * 0.6 + (floorY - topY) * 0.45, s: 1.3 });
    } else if (p.rods === 'low') {
      rods.push({ spot: p.rodSpots[0], y: floorY - U * 7, s: 1.5 });
    } else {
      rods.push({ spot: p.rodSpots[0], y: topY + U * 0.6, s: 1.6 });
    }
    return { ox, oy, w, h, x0, x1, floorY, shelves, rods };
  }

  function closetArt(p, inside, state) {
    const L = closetLayout(p, inside, state.addInside);
    const { ox, oy, w, h, x0, x1, floorY } = L;
    const wrap = (spotId, hit, art) => state.interactive
      ? `<g class="fpart" data-act="part" data-id="${spotId}" role="button" aria-label="Open">${hit}${art}</g>`
      : art;
    let o = rect(ox, oy, w, h, p.color, 10) + rect(ox + 16, oy + 16, w - 32, h - 32, '#fffaf0', 4, 2);
    L.shelves.forEach(s => {
      o += wrap(s.spot.id, `<rect x="${x0}" y="${s.y - 40}" width="${x1 - x0}" height="52" fill="transparent"/>`,
        rect(x0, s.y, x1 - x0, 12, shade(p.color, -0.12), 4));
    });
    const cl = ['#ff9fb8', '#8fd3ff', '#ffd54a', '#b9a2ff', '#7fd8c0'];
    L.rods.forEach((r, ri) => {
      let art = rect(x0 + 10, r.y, x1 - x0 - 20, 8, '#b8b8c8', 4, 2);
      const step = 46 * r.s;
      const n = Math.max(2, Math.floor((x1 - x0 - 40) / step));
      for (let i = 0; i < n; i++) {
        if (i % 6 === 4) continue;   // a little gap, like real clothes
        art += hanger(x0 + 30 + i * step, r.y + 16, cl[(i + ri * 2) % cl.length], i % 4 === 1 ? 'dress' : 'shirt', r.s);
      }
      o += wrap(r.spot.id, `<rect x="${x0}" y="${r.y - 10}" width="${x1 - x0}" height="${70 * r.s + 20}" fill="transparent"/>`, art);
    });
    // Floor: furniture standing in the closet, then the floor itself for shoes and bins.
    o += wrap(p.floor.id, `<rect x="${x0}" y="${floorY - 40}" width="${x1 - x0}" height="40" fill="transparent"/>`,
      `<path d="M${x0} ${floorY} L${x1} ${floorY}" stroke="${shade(p.color, -0.3)}" stroke-width="4"/>`);
    let fx = x0 + 10;
    inside.forEach(q => {
      const box = frontBox(q);
      const s = 1;
      const art = render(q, { bare: true });
      const y = floorY - box.H * s;
      const g = `<svg x="${fx}" y="${y}" width="${box.W * s}" height="${box.H * s}" viewBox="0 0 ${box.W} ${box.H}">${art}</svg>`;
      o += state.interactive
        ? `<g class="fpart" data-act="open-piece" data-id="${q.id}" role="button" aria-label="Open">${g}</g>`
        : g;
      fx += box.W * s + 14;
    });
    if (state.interactive && state.addInside) {
      const bx = fx + 34;
      o += `<g class="fpart add-in" data-act="closet-add" role="button" aria-label="Add furniture to the closet">` +
        `<circle cx="${bx}" cy="${floorY - 34}" r="26" fill="#ffd54a" ${line()}/>` +
        `<path d="M${bx - 11} ${floorY - 34} h22 M${bx} ${floorY - 45} v22" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></g>`;
    }
    return o;
  }

  // ---------- Public drawing ----------

  // state: { interactive, selected, inside (pieces in a closet), addInside, bare }
  function render(p, state = {}) {
    const inside = state.inside || [];
    const box = p.kind === 'closet' ? closetBox(p, inside, state.addInside) : frontBox(p);
    let art;
    if (p.kind === 'closet') art = closetArt(p, inside, state);
    else if (p.kind === 'bed') art = bedArt(p);
    else if (p.kind === 'seat') art = seatArt(p);
    else if (p.kind === 'wallshelf') art = wallshelfArt(p, state);
    else art = storageArt(p, state);
    if (state.bare) return art;
    return svg(box.W, box.H, art, 'furn-svg');
  }

  // ---------- Inside views (a part opened up) ----------

  function findCell(p, id) {
    if (!hasParts(p)) return null;
    for (const c of p.cols) for (const k of c.cells) {
      if (k.id === id) return k;
      if (k.type === 'cupboard' && k.spots.some(s => s.id === id)) return k;
    }
    return null;
  }

  // A big picture of one part, opened, showing the space(s) inside.
  function renderInside(p, partId) {
    const c = p.color;
    const empty = '#fffaf0';
    if (p.kind === 'wallshelf') {
      return svg(360, 200, rect(20, 140, 320, 18, c, 6) +
        `<path d="M44 158 l0 34 l26 -34" fill="${shade(c, -0.25)}" ${line()}/><path d="M316 158 l0 34 l-26 -34" fill="${shade(c, -0.25)}" ${line()}/>` +
        `<rect x="30" y="30" width="300" height="104" rx="14" fill="${empty}" stroke="#d8c8b4" stroke-width="3" stroke-dasharray="10 8"/>`, 'inside-svg');
    }
    if (p.kind === 'closet') {
      const isShelf = p.shelves.some(s => s.id === partId);
      const isRod = p.rodSpots.some(s => s.id === partId);
      if (isShelf) {
        return svg(360, 200, rect(20, 140, 320, 18, shade(p.color, -0.12), 6) +
          `<rect x="30" y="30" width="300" height="104" rx="14" fill="${empty}" stroke="#d8c8b4" stroke-width="3" stroke-dasharray="10 8"/>`, 'inside-svg');
      }
      if (isRod) {
        let o = rect(20, 30, 320, 12, '#b8b8c8', 6, 2.5);
        ['#ff9fb8', '#8fd3ff', '#ffd54a', '#b9a2ff', '#7fd8c0'].forEach((col, i) => { o += hanger(60 + i * 60, 56, col, i === 1 ? 'dress' : 'shirt', 1.2); });
        return svg(360, 160, o, 'inside-svg');
      }
      return svg(360, 160, `<rect x="30" y="20" width="300" height="104" rx="14" fill="${empty}" stroke="#d8c8b4" stroke-width="3" stroke-dasharray="10 8"/>` +
        `<path d="M20 130 L340 130" stroke="${shade(p.color, -0.3)}" stroke-width="6" stroke-linecap="round"/>`, 'inside-svg');
    }
    const k = findCell(p, partId);
    if (!k) return '';
    if (k.type === 'drawer') {
      // Pulled out and seen from a little above: the tray, then the drawer front.
      const front = p.style === 'plastic' ? c : shade(c, 0.14);
      return svg(360, 240,
        `<path d="M50 30 L310 30 L340 150 L20 150 Z" fill="${shade(c, -0.12)}" ${line()}/>` +
        `<path d="M66 44 L294 44 L318 140 L42 140 Z" fill="${empty}" ${line(2)}/>` +
        rect(14, 150, 332, 70, front, 10) +
        (p.style === 'plastic' ? rect(150, 162, 60, 12, '#fff', 6, 2) : knob(180, 185, c)), 'inside-svg');
    }
    if (k.type === 'open') {
      let o = rect(30, 20, 300, 220, shade(c, -0.45), 10);
      if (k.insert === 'bin') o += binArt(60, 50, 240, 190, k.binColor || BIN_COLORS[0]);
      else if (k.insert === 'sorter') o += sorterArt(46, 40, 268, 190);
      else o += `<rect x="60" y="50" width="240" height="160" rx="14" fill="${empty}" opacity=".9" stroke="#d8c8b4" stroke-width="3" stroke-dasharray="10 8"/>`;
      return svg(360, 260, o, 'inside-svg');
    }
    // Cupboard: the door swings open and each shelf spot shows.
    const n = k.spots.length;
    const H = 90 * n + 40;
    let o = rect(70, 20, 220, H - 40, shade(c, -0.45), 6);
    const sh = (H - 40) / n;
    for (let i = 1; i < n; i++) o += rect(70, 20 + i * sh - 5, 220, 10, shade(c, 0.2), 3, 2);
    k.spots.forEach((s, i) => {
      o += `<rect x="86" y="${32 + i * sh}" width="188" height="${sh - 26}" rx="10" fill="${empty}" opacity=".9" stroke="#d8c8b4" stroke-width="3" stroke-dasharray="10 8"/>`;
    });
    o += k.hinge === 'r'
      ? `<path d="M290 20 L340 36 L340 ${H - 36} L290 ${H - 20} Z" fill="${shade(c, 0.14)}" ${line()}/>`
      : `<path d="M70 20 L20 36 L20 ${H - 36} L70 ${H - 20} Z" fill="${shade(c, 0.14)}" ${line()}/>`;
    return svg(360, H, o, 'inside-svg');
  }

  // Small pictures used on the "change the parts" buttons.
  function partIcon(type, insert) {
    const c = '#f4ead8';
    const shape = type === 'drawer' ? { x: 4, y: 18, w: 52, h: 24 } : type === 'cupboard' ? { x: 14, y: 4, w: 32, h: 52 } : { x: 6, y: 6, w: 48, h: 48 };
    const b = { cell: { id: 'x', type, insert: insert || 'empty', binColor: '#8fd3ff', hinge: 'l' }, ...shape };
    return svg(60, 60, partArt({ color: type === 'open' ? c : '#ffd27a', style: 'wood' }, b, {}), 'icon-svg');
  }

  function rodIcon(kind) {
    let o = rect(4, 4, 52, 52, '#e9dcc6', 6, 2) + rect(10, 10, 40, 40, '#fffaf0', 3, 1.5);
    const rod = (y, s) => `<path d="M14 ${y} L46 ${y}" stroke="#8a8aa0" stroke-width="3" stroke-linecap="round"/>` +
      [20, 30, 40].map(x => `<rect x="${x - 4}" y="${y + 2}" width="8" height="${12 * s}" rx="2" fill="#ff9fb8" stroke="${INK}" stroke-width="1.2"/>`).join('');
    if (kind === 'two') o += rod(16, 1) + rod(34, 1);
    else if (kind === 'low') o += rod(28, 1.1);
    else o += rod(16, 1.6);
    return svg(60, 60, o, 'icon-svg');
  }

  return {
    COLORS, BIN_COLORS, CATALOG, GROUPS,
    make, render, renderInside, partIcon, rodIcon,
    hasParts, fitsInCloset, spacesOf, spaceUsed, cellUsed, findCell,
    cell, col, uid, shade,
  };
})();
