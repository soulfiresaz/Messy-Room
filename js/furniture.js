// Furniture: ready-made pieces, how they're built from parts, and their drawings.
// Same flat style as the stickers: soft colors, dark rounded outlines.
//
// A storage piece is built from columns of parts:
//   piece = { id, kind, style, color, label, w, h, d, cols: [ { id, w, cells: [cell] } ] }
//   cell  = { id, type: 'drawer' | 'open' | 'cupboard', h, insert, binColor, count, shelves, hinge, spots }
//   An open cubby can be empty (books fit here), hold a bin, a paper sorter (each tray is a space)
//   or a small box of paper drawers (each drawer is a space).
// w and h are sizes "by eye" (about one unit per hand width), d is how deep it is on the map.
// Every space that can hold things has its own id, so what's kept there stays put
// when other parts change.
const Furniture = (() => {
  const INK = '#3a2a2a';
  const U = 36;          // pixels per unit in the front view
  const P = 8;           // gap between parts

  const COLORS = ['#ffb3d1', '#ff8fa3', '#ffd27a', '#ffd54a', '#7fd8c0', '#8fd3ff', '#9db8ff', '#b9a2ff', '#f4ead8', '#ffffff', '#c98b5a', '#8a6a5a', '#9aa7b8', '#4a4a5a'];
  const BIN_COLORS = ['#ff9fb8', '#8fd3ff', '#ffd54a', '#b9a2ff', '#7fd8c0', '#ffffff', '#f4ead8', '#9aa7b8', '#3d4a45'];

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
    if (type === 'open') setInsert(c, c.insert || 'empty', c.count);
    if (type === 'cupboard') {
      if (c.shelves == null) c.shelves = 1;
      c.spots = c.spots || Array.from({ length: c.shelves + 1 }, () => ({ id: uid() }));
    }
    return c;
  };
  // Inserts with their own little spaces: sorter trays or paper drawers.
  const INSERT_COUNTS = { sorter: [5, 2, 8], drawers: [3, 1, 5] };   // [start, fewest, most]

  function setInsert(c, insert, count) {
    c.insert = insert;
    const range = INSERT_COUNTS[insert];
    if (!range) { delete c.spots; delete c.count; return c; }
    const n = Math.max(range[1], Math.min(range[2], count || range[0]));
    c.count = n;
    const spots = (c.spots || []).slice(0, n);
    while (spots.length < n) spots.push({ id: uid() });
    c.spots = spots;
    return c;
  }

  const col = (cells, w = 1) => ({ id: uid(), w, cells });
  const drawers = n => Array.from({ length: n }, () => cell('drawer'));
  const opens = (n, inserts = []) => Array.from({ length: n }, (_, i) => {
    const ins = inserts[i] || 'empty';
    return cell('open', 1, { insert: ins, binColor: BIN_COLORS[i % 4] });
  });

  // One section of a closet: one high rod, one low rod, two rods, or a stack of shelves.
  // It keeps two rod spaces and its shelf spaces, so switching back and forth keeps their ids.
  function section(kind = 'high', w = 5) {
    return { id: uid(), kind, w, rods: [{ id: uid() }, { id: uid() }], shelves: Array.from({ length: kind === 'shelves' ? 4 : 0 }, () => ({ id: uid() })) };
  }

  // Closets saved before sections existed had one set of rods for the whole closet.
  function fixCloset(p) {
    if (p.kind !== 'closet') return p;
    if (!p.doors) p.doors = 'bifold';
    if (!p.doorColor) p.doorColor = '#ffffff';
    if (p.sections) return p;
    p.sections = [{ id: uid(), kind: p.rods || 'high', w: p.w, rods: p.rodSpots || [{ id: uid() }, { id: uid() }], shelves: [] }];
    delete p.rods; delete p.rodSpots;
    return p;
  }

  // The spaces a closet section is using right now.
  function sectionSpaces(sec) {
    if (sec.kind === 'shelves') return sec.shelves;
    return sec.rods.slice(0, sec.kind === 'two' ? 2 : 1);
  }

  const base = (kind, style, color, w, h, d, extra = {}) => ({ id: uid(), kind, style, color, label: '', w, h, d, ...extra });

  // Cubbies laid out in a grid, filled with a mix to start (row by row, top to bottom).
  // The 4 x 4 starts like a real one: sorters, paper drawers and bins up top, books below.
  const CUBBY_FILL = {
    4: ['sorter', 'sorter', 'bin', 'bin', 'drawers', 'drawers', 'bin', 'bin', 'bin', 'empty', 'empty', 'empty', 'empty', 'empty', 'bin', 'empty'],
    other: ['bin', 'sorter', 'empty', 'bin', 'drawers', 'empty', 'bin', 'empty'],
  };

  function cubbyGrid(cols, rows) {
    const fill = cols === 4 && rows === 4 ? CUBBY_FILL[4] : CUBBY_FILL.other;
    return Array.from({ length: cols }, (_, c) => col(Array.from({ length: rows }, (_, r) => {
      const i = r * cols + c;
      const ins = fill[i % fill.length];
      return cell('open', 1, { insert: ins, binColor: ins === 'drawers' ? '#3d4a45' : BIN_COLORS[i % 5] });
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
    { key: 'cubby2x4', group: 'cubbies', make: () => base('cubby', 'cube', '#f4ead8', 4.4, 8.3, 1.2, { cols: cubbyGrid(2, 4) }) },
    { key: 'cubby4x3', group: 'cubbies', make: () => base('cubby', 'cube', '#f4ead8', 8.3, 6.3, 1.2, { cols: cubbyGrid(4, 3) }) },
    { key: 'cubby4x4', group: 'cubbies', make: () => base('cubby', 'cube', '#f4ead8', 8.3, 8.3, 1.2, { cols: cubbyGrid(4, 4) }) },
    // Shelves
    { key: 'bookshelf', group: 'shelves', make: () => base('bookshelf', 'cube', '#c98b5a', 4.4, 11, 1, { cols: [col(opens(5))] }) },
    { key: 'wallShort', group: 'shelves', make: () => base('wallshelf', 'wallshelf', '#7fd8c0', 3.4, 1.4, 0.6, { spot: { id: uid() } }) },
    { key: 'wallLong', group: 'shelves', make: () => base('wallshelf', 'wallshelf', '#ff9fb8', 6.5, 1.4, 0.6, { spot: { id: uid() } }) },
    // Closets: built from sections side by side, with a top shelf across.
    { key: 'closet', group: 'closet', make: () => base('closet', 'closet', '#e9dcc6', 10, 13, 2, { shelves: [{ id: uid() }], sections: [section('high', 10)], floor: { id: uid() } }) },
    {
      key: 'closetHalf', group: 'closet', make: () => base('closet', 'closet', '#e9dcc6', 10, 13, 2, {
        shelves: [{ id: uid() }], sections: [section('high', 5), section('two', 5)], floor: { id: uid() },
      }),
    },
    {
      key: 'closetMiddle', group: 'closet', make: () => base('closet', 'closet', '#e9dcc6', 16, 13, 2.2, {
        shelves: [{ id: uid() }], sections: [section('high', 6), section('shelves', 4), section('high', 6)], floor: { id: uid() },
      }),
    },
    {
      key: 'closetDouble', group: 'closet', make: () => base('closet', 'closet', '#e9dcc6', 18, 13, 2.2, {
        shelves: [{ id: uid() }], sections: [section('high', 9), section('two', 9)], floor: { id: uid() },
      }),
    },
    // Seats
    { key: 'wire', group: 'shelves', make: () => base('wire', 'wire', '#c9cfd8', 5, 9, 2, { cols: [col(opens(5))] }) },
    { key: 'recliner', group: 'seats', make: () => base('seat', 'seat', '#8fd3ff', 4.8, 3.4, 5.4, { seat: 'recliner' }) },
    { key: 'hamperRound', group: 'baskets', make: () => container('hamperRound', '#ffffff') },
    { key: 'hamperRect', group: 'baskets', make: () => container('hamperRect', '#b9a2ff') },
    { key: 'basket', group: 'baskets', make: () => container('basket', '#d9b98a') },
    { key: 'bag', group: 'baskets', make: () => container('bag', '#7fd8c0') },
    { key: 'box', group: 'baskets', make: () => container('box', '#c9a57a') },
    { key: 'trashKitchen', group: 'trash', make: () => container('trashKitchen', '#d5dbe3') },
    { key: 'trashRect', group: 'trash', make: () => container('trashRect', '#7fd8c0') },
    { key: 'trashRound', group: 'trash', make: () => container('trashRound', '#ff9fb8') },
    { key: 'recycle', group: 'trash', make: () => container('recycle', '#4f8fe0') },
    { key: 'hookSingle', group: 'hooks', where: 'both', make: () => hooks('single', 1, '#c9cfd8') },
    { key: 'hookDouble', group: 'hooks', where: 'both', make: () => hooks('double', 1, '#c9cfd8') },
    { key: 'hookWall', group: 'hooks', make: () => hooks('wall', 2, '#c98b5a') },
    { key: 'beltRack', group: 'hooks', make: () => hooks('rack', 6, '#c98b5a') },
    { key: 'wallSorter', group: 'hooks', make: () => base('wallsorter', 'wallsorter', '#7fd8c0', 4.2, 4.2, 0.6, { slots: ids(3), keys: ids(4) }) },
    { key: 'pockets', group: 'door', where: 'door', make: () => sizePockets(base('pockets', 'pockets', '#f4ead8', 0, 0, 0.4, { cols: 4, rows: 6 })) },
    { key: 'hookOverdoor', group: 'door', where: 'door', make: () => hooks('overdoor', 3, '#c9cfd8') },
    { key: 'chair', group: 'seats', make: () => base('seat', 'seat', '#8fd3ff', 2.2, 3.6, 1.4, { seat: 'chair' }) },
    { key: 'beanbag', group: 'seats', make: () => base('seat', 'seat', '#b9a2ff', 3, 2.4, 2.4, { seat: 'beanbag' }) },
    { key: 'floorchair', group: 'seats', make: () => base('seat', 'seat', '#ff9fb8', 2.8, 2.4, 2, { seat: 'floorchair' }) },
  ];

  function container(sub, color) {
    const [w, h] = CONTAINER_SIZE[sub];
    return base('container', 'container', color, w, h, 2, { sub, spot: { id: uid() } });
  }

  function hooks(sub, count, color) {
    return sizeHooks(base('hooks', 'hooks', color, 1, 1.6, 0.6, { sub, count }));
  }

  const GROUPS = [
    { key: 'beds', icon: '🛏️', label: 'Beds' },
    { key: 'dressers', icon: '🗄️', label: 'Dressers' },
    { key: 'tables', icon: '🪑', label: 'Side tables' },
    { key: 'containers', icon: '📦', label: 'Drawer containers' },
    { key: 'cubbies', icon: '🔲', label: 'Cubbies' },
    { key: 'shelves', icon: '📚', label: 'Shelves' },
    { key: 'closet', icon: '👕', label: 'Closets' },
    { key: 'seats', icon: '💺', label: 'Seats' },
    { key: 'baskets', icon: '🧺', label: 'Hampers, baskets and boxes' },
    { key: 'trash', icon: '🗑️', label: 'Trash cans' },
    { key: 'hooks', icon: '🪝', label: 'Hooks and wall pieces' },
    { key: 'door', icon: '🚪', label: 'On a door' },
  ];

  function make(key) {
    const entry = CATALOG.find(c => c.key === key);
    return entry ? entry.make() : null;
  }

  // Pieces made from columns of parts can have their parts changed.
  const hasParts = p => Array.isArray(p.cols);
  // Pieces that can stand on a closet floor.
  const fitsInCloset = p => hasParts(p) || p.kind === 'container';

  // ---------- Spaces (where things are kept) ----------

  // Every space in a piece, so later stages can assign what it holds and who owns it.
  function spacesOf(p) {
    if (hasParts(p)) {
      return [...p.cols.flatMap(c => c.cells.flatMap(x => (x.spots && x.spots.length) ? x.spots : [x])), ...(p.top ? [p.top] : [])];
    }
    if (p.kind === 'wallshelf' || p.kind === 'container') return [p.spot];
    if (p.kind === 'pockets') return p.pockets;
    if (p.kind === 'hooks') return p.hooks;
    if (p.kind === 'wallsorter') return [...p.slots, ...p.keys];
    if (p.kind === 'closet') { fixCloset(p); return [...p.shelves, ...p.sections.flatMap(sectionSpaces), p.floor]; }
    return [];
  }

  // A space is "used" once something is assigned to it or someone owns it.
  const spaceUsed = s => !!s && ((s.holds && s.holds.length > 0) || (s.owners && s.owners.length > 0));
  const cellUsed = c => spaceUsed(c) || (c.spots || []).some(spaceUsed);

  // ---------- Front view drawings ----------

  // Size of the drawing for a piece, in pixels, including tops, legs and wheels.
  // Hooks and pocket organizers can be made bigger or smaller as a whole (p.hs).
  const scaleOf = p => ((p.kind === 'hooks' || p.kind === 'pockets') && p.hs ? p.hs : 1);

  function frontBox(p) {
    const b = baseBox(p), k = scaleOf(p);
    return k === 1 ? b : { W: b.W * k, H: b.H * k, ox: b.ox * k, oy: b.oy * k };
  }

  function baseBox(p) {
    if (p.kind === 'closet') return closetBox(p);
    const w = p.w * U, h = p.h * U;
    if (p.style === 'wood') return { W: w + 24, H: h + 40, ox: 12, oy: 18 };
    if (p.style === 'plastic') return { W: w + 8, H: h + (p.wheels === false ? 20 : 36), ox: 4, oy: 16 };
    if (p.style === 'cube') return { W: w + 8, H: h + 20, ox: 4, oy: 16 };
    if (p.style === 'wire') return { W: w + 16, H: h + 24, ox: 8, oy: 12 };
    if (p.kind === 'pockets') return { W: w + 8, H: h + 32, ox: 4, oy: 28 };
    if (p.kind === 'hooks') return { W: w + 8, H: h + (p.sub === 'overdoor' ? 30 : 8), ox: 4, oy: p.sub === 'overdoor' ? 24 : 4 };
    if (p.kind === 'container') return { W: w + 16, H: h + (p.sub === 'basket' ? 30 : 12), ox: 8, oy: p.sub === 'basket' ? 24 : 6 };
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

  // A clear paper sorter with little stacked trays.
  function sorterArt(x, y, w, h, n = 5) {
    let o = `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${h - 6}" rx="4" fill="#eef4f8" fill-opacity=".6" stroke="${INK}" stroke-width="1.6"/>`;
    const th = (h - 10) / n;
    for (let i = 0; i < n; i++) {
      const ty = y + 6 + i * th;
      o += `<rect x="${x + 9}" y="${ty + th * 0.25}" width="${w - 18}" height="${th * 0.4}" rx="1.5" fill="#fff" stroke="${INK}" stroke-width="1"/>`;
      o += `<rect x="${x + 6}" y="${ty + th * 0.62}" width="${w - 12}" height="${Math.max(3, th * 0.3)}" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.6"/>`;
    }
    return o;
  }

  // A small box of paper drawers with round finger holes.
  function drawerBoxArt(x, y, w, h, n = 3, c = '#3d4a45') {
    const bx = x + 3, by = y + h * 0.08, bw = w - 6, bh = h * 0.9;
    let o = rect(bx, by, bw, bh, c, 4, 2);
    const dh = bh / n;
    const ring = shade(c, 0.6);
    for (let i = 0; i < n; i++) {
      const dy = by + i * dh;
      if (i) o += `<path d="M${bx} ${dy} L${bx + bw} ${dy}" stroke="${INK}" stroke-width="1.6"/>`;
      o += `<circle cx="${bx + bw / 2}" cy="${dy + dh / 2}" r="${Math.max(2.5, Math.min(7, dh * 0.2))}" fill="${shade(c, -0.3)}" stroke="${ring}" stroke-width="1.8"/>`;
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
      if (k.insert === 'sorter') o += sorterArt(b.x, b.y, b.w, b.h, k.count);
      if (k.insert === 'drawers') o += drawerBoxArt(b.x, b.y, b.w, b.h, k.count, k.binColor);
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
      if (p.wheels !== false) o += `<circle cx="${ox + 14}" cy="${oy + h + 8}" r="7" fill="#9aa7b8" ${line(2)}/><circle cx="${ox + w - 14}" cy="${oy + h + 8}" r="7" fill="#9aa7b8" ${line(2)}/>`;
      o += rect(ox, oy, w, h, '#eef1f5', 8);
    } else {
      o += rect(ox, oy, w, h, c, 8);
    }
    layout(p, ox, oy, w, h).forEach(colBox => colBox.cells.forEach(b => { o += partArt(p, b, state); }));
    if (state.interactive && p.top) {
      o = `<g class="fpart" data-act="part" data-id="${p.top.id}" role="button" aria-label="The top"><rect x="${ox - 6}" y="${oy - 16}" width="${w + 12}" height="20" fill="transparent"/></g>` + o;
    }
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
    if (p.seat === 'recliner') {
      const s = w / 175;
      const X = v => ox + v * s, Y = v => oy + h - (122 - v) * s;
      return `<path d="M${X(20)} ${Y(0)} Q${X(10)} ${Y(0)} ${X(10)} ${Y(12)} L${X(18)} ${Y(92)} L${X(70)} ${Y(92)} L${X(62)} ${Y(10)} Q${X(60)} ${Y(0)} ${X(48)} ${Y(0)} Z" fill="${c}" ${line()}/>` +
        rect(X(12), Y(80), 110 * s, 26 * s, shade(c, 0.2), 12) +
        `<path d="M${X(118)} ${Y(82)} L${X(170)} ${Y(70)} L${X(174)} ${Y(92)} L${X(122)} ${Y(104)} Z" fill="${shade(c, 0.1)}" ${line()}/>` +
        rect(X(0), Y(50), 24 * s, 50 * s, shade(c, -0.08), 10) + rect(X(100), Y(50), 24 * s, 50 * s, shade(c, -0.08), 10) +
        rect(X(18), Y(106), 12 * s, 16 * s, '#8a6a5a', 3, 2) + rect(X(96), Y(106), 12 * s, 16 * s, '#8a6a5a', 3, 2);
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

  function closetInner(p, inside, addInside) {
    // The closet grows on its own to fit what stands on its floor (and the ➕ next to it).
    const need = inside.reduce((a, q) => a + frontBox(q).W + 14, 40) + (addInside ? 80 : 0);
    const w = fixCloset(p).sections.reduce((a, x) => a + x.w, 0);
    return { w: Math.max(w * U, need), h: p.h * U };
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

  // Where the top shelves, sections, rods and floor sit inside a closet (heights in units, like real closets).
  function closetLayout(p, inside, addInside) {
    fixCloset(p);
    const { w, h } = closetInner(p, inside, addInside);
    const ox = 4, oy = 4, pad = 16, DIV = 12;
    const x0 = ox + pad, x1 = ox + w - pad;
    const floorY = oy + h - pad;
    const shelves = p.shelves.map((s, i) => ({ spot: s, y: oy + pad + U * 1.4 + i * U * 1.3 }));
    const topY = shelves.length ? shelves[shelves.length - 1].y + 12 : oy + pad;
    const total = p.sections.reduce((a, x) => a + x.w, 0);
    const usable = x1 - x0 - DIV * (p.sections.length - 1);
    let sx = x0;
    const sections = p.sections.map(sec => {
      const sw = usable * sec.w / total;
      const out = { sec, x0: sx, x1: sx + sw, rods: [], shelves: [] };
      if (sec.kind === 'two') {
        out.rods.push({ spot: sec.rods[0], y: topY + U * 0.6, s: 1.3 });
        out.rods.push({ spot: sec.rods[1], y: topY + U * 0.6 + (floorY - topY) * 0.45, s: 1.3 });
      } else if (sec.kind === 'low') {
        out.rods.push({ spot: sec.rods[0], y: floorY - U * 7, s: 1.5 });
      } else if (sec.kind === 'shelves') {
        const n = sec.shelves.length;
        const gap = (floorY - topY) / (n + 1);
        out.shelves = sec.shelves.map((spot, i) => ({ spot, y: topY + gap * (i + 1) - 6 }));
      } else {
        out.rods.push({ spot: sec.rods[0], y: topY + U * 0.6, s: 1.6 });
      }
      sx += sw + DIV;
      return out;
    });
    return { ox, oy, w, h, x0, x1, floorY, topY, shelves, sections, DIV };
  }

  function closetArt(p, inside, state) {
    const L = closetLayout(p, inside, state.addInside);
    const { ox, oy, w, h, x0, x1, floorY, topY } = L;
    const picking = state.interactive && state.pickSection;
    const wrap = (spotId, hit, art) => state.interactive && !picking
      ? `<g class="fpart" data-act="part" data-id="${spotId}" role="button" aria-label="Open">${hit}${art}</g>`
      : art;
    let o = rect(ox, oy, w, h, p.color, 10) + rect(ox + 16, oy + 16, w - 32, h - 32, '#fffaf0', 4, 2);
    L.shelves.forEach(s => {
      o += wrap(s.spot.id, `<rect x="${x0}" y="${s.y - 40}" width="${x1 - x0}" height="52" fill="transparent"/>`,
        rect(x0, s.y, x1 - x0, 12, shade(p.color, -0.12), 4));
    });
    // Dividers between sections
    L.sections.slice(1).forEach(S => {
      o += rect(S.x0 - L.DIV, topY, L.DIV, floorY - topY, shade(p.color, -0.08), 3, 2);
    });
    const cl = ['#ff9fb8', '#8fd3ff', '#ffd54a', '#b9a2ff', '#7fd8c0'];
    L.sections.forEach((S, si) => {
      let secArt = '';
      S.rods.forEach((r, ri) => {
        let art = rect(S.x0 + 6, r.y, S.x1 - S.x0 - 12, 8, '#b8b8c8', 4, 2);
        const step = 46 * r.s;
        const n = Math.max(1, Math.floor((S.x1 - S.x0 - 30) / step));
        for (let i = 0; i < n; i++) {
          if (i % 6 === 4) continue;   // a little gap, like real clothes
          art += hanger(S.x0 + 24 * r.s + i * step, r.y + 16, cl[(i + ri * 2 + si) % cl.length], i % 4 === 1 ? 'dress' : 'shirt', r.s);
        }
        secArt += wrap(r.spot.id, `<rect x="${S.x0}" y="${r.y - 10}" width="${S.x1 - S.x0}" height="${70 * r.s + 20}" fill="transparent"/>`, art);
      });
      S.shelves.forEach(sh => {
        secArt += wrap(sh.spot.id, `<rect x="${S.x0}" y="${sh.y - 44}" width="${S.x1 - S.x0}" height="56" fill="transparent"/>`,
          rect(S.x0, sh.y, S.x1 - S.x0, 12, shade(p.color, -0.12), 4));
      });
      if (picking) {
        const sel = state.selected === S.sec.id
          ? `<rect x="${S.x0 - 4}" y="${topY + 2}" width="${S.x1 - S.x0 + 8}" height="${floorY - topY - 4}" rx="10" fill="#3a86ff" fill-opacity=".08" stroke="#3a86ff" stroke-width="5" stroke-dasharray="12 7"/>`
          : '';
        secArt = `<g class="fpart" data-act="part" data-id="${S.sec.id}" role="button" aria-label="Pick this section">` +
          `<rect x="${S.x0}" y="${topY}" width="${S.x1 - S.x0}" height="${floorY - topY}" fill="transparent"/>${secArt}</g>${sel}`;
      }
      o += secArt;
    });
    // Floor: furniture standing in the closet, then the floor itself for shoes and bins.
    o += wrap(p.floor.id, `<rect x="${x0}" y="${floorY - 40}" width="${x1 - x0}" height="40" fill="transparent"/>`,
      `<path d="M${x0} ${floorY} L${x1} ${floorY}" stroke="${shade(p.color, -0.3)}" stroke-width="4"/>`);
    let fx = x0 + 10;
    inside.forEach(q => {
      const box = frontBox(q);
      const art = render(q, { bare: true });
      const g = `<svg x="${fx}" y="${floorY - box.H}" width="${box.W}" height="${box.H}" viewBox="0 0 ${box.W} ${box.H}">${art}</svg>`;
      o += state.interactive && !picking
        ? `<g class="fpart" data-act="open-piece" data-id="${q.id}" role="button" aria-label="Open">${g}</g>`
        : (picking ? `<g opacity=".35" pointer-events="none">${g}</g>` : g);
      fx += box.W + 14;
    });
    if (state.interactive && state.addInside && !picking) {
      const bx = fx + 34;
      o += `<g class="fpart add-in" data-act="closet-add" role="button" aria-label="Add furniture to the closet">` +
        `<circle cx="${bx}" cy="${floorY - 34}" r="26" fill="#ffd54a" ${line()}/>` +
        `<path d="M${bx - 11} ${floorY - 34} h22 M${bx} ${floorY - 45} v22" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></g>`;
    }
    return o;
  }

  // ---------- Pocket organizers, hooks, wall sorters, hampers and baskets ----------

  const ids = n => Array.from({ length: n }, () => ({ id: uid() }));

  // Pocket organizer: sized by its pockets (about 0.8 units across and 1.3 down each).
  function sizePockets(p) {
    p.w = Math.round((p.cols * 0.8 + 0.3) * 10) / 10;
    p.h = Math.round((p.rows * 1.3 + 0.3) * 10) / 10;
    const n = p.cols * p.rows;
    const keep = (p.pockets || []).slice(0, n);
    while (keep.length < n) keep.push({ id: uid() });
    p.pockets = keep;
    return p;
  }

  // Hooks: single, double, a set over a door, a belt rack, or wall hooks for bags and aprons.
  const HOOK_SPACING = { single: 1, double: 1.3, overdoor: 0.95, rack: 0.8, wall: 1.7 };
  function sizeHooks(p) {
    const n = p.sub === 'single' || p.sub === 'double' ? 1 : p.count;
    p.count = n;
    p.w = Math.round((n * HOOK_SPACING[p.sub] + (n > 1 ? 0.4 : 0.2)) * 10) / 10;
    p.h = p.sub === 'rack' ? 2.8 : p.sub === 'wall' ? 2 : 1.6;
    const keep = (p.hooks || []).slice(0, n);
    while (keep.length < n) keep.push({ id: uid() });
    p.hooks = keep;
    return p;
  }

  const CONTAINER_SIZE = {
    hamperRound: [2.8, 3.6, 2.8, 2.8], hamperRect: [3.2, 3.6, 3.2, 2.2], basket: [3, 2, 2.6, 1.8], bag: [2.4, 2.8, 2.2, 1.2], box: [3, 2, 2.6, 2],
    trashKitchen: [3.2, 5.4, 3, 2.2], trashRect: [2.6, 2.8, 2.2, 1.5], trashRound: [2.8, 3.6, 2.6, 2.6], recycle: [3, 4.4, 2.8, 2.2],
  };

  // Three white arrows chasing each other around a triangle.
  function recycleMark(cx, cy, s, c = '#fff') {
    const r = 13 * s;
    const V = [-90, 30, 150].map(a => [cx + r * Math.cos(a * Math.PI / 180), cy + r * Math.sin(a * Math.PI / 180)]);
    let o = '';
    for (let i = 0; i < 3; i++) {
      const [x1, y1] = V[i], [x2, y2] = V[(i + 1) % 3];
      const P = t => [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
      const [ax, ay] = P(0.18), [bx, by] = P(0.72);
      const ang = Math.atan2(y2 - y1, x2 - x1), h = 5 * s;
      const l = [bx - h * Math.cos(ang - 0.6), by - h * Math.sin(ang - 0.6)];
      const rr = [bx - h * Math.cos(ang + 0.6), by - h * Math.sin(ang + 0.6)];
      o += `<path d="M${ax} ${ay} L${bx} ${by}" stroke="${c}" stroke-width="${2.6 * s}" stroke-linecap="round"/>`;
      o += `<path d="M${l[0]} ${l[1]} L${bx + 1.5 * s * Math.cos(ang)} ${by + 1.5 * s * Math.sin(ang)} L${rr[0]} ${rr[1]} Z" fill="${c}" stroke="${c}" stroke-width="${1.2 * s}" stroke-linejoin="round"/>`;
    }
    return o;
  }

  function pocketArt(x, y, pw, ph) {
    return `<path d="M${x} ${y + ph * 0.22} L${x + pw} ${y + ph * 0.22} L${x + pw - 2} ${y + ph} L${x + 2} ${y + ph} Z" fill="#eaf6ff" fill-opacity=".9" ${line(1.6)}/>` +
      `<path d="M${x + 3} ${y + ph * 0.22 + 3} L${x + pw - 3} ${y + ph * 0.22 + 3}" stroke="#fff" stroke-width="2" opacity=".8"/>`;
  }

  function overHooks(x, y, w, c = '#9aa7b8') {
    return [0.25, 0.75].map(f => `<path d="M${x + w * f - 6} ${y + 6} L${x + w * f - 6} ${y - 12} Q${x + w * f - 6} ${y - 20} ${x + w * f} ${y - 20} Q${x + w * f + 6} ${y - 20} ${x + w * f + 6} ${y - 12} L${x + w * f + 6} ${y - 6}" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round"/>`).join('');
  }

  const tap = (state, id, hit, art) => state.interactive
    ? `<g class="fpart" data-act="part" data-id="${id}" role="button" aria-label="Open">${hit}${art}</g>` : art;

  function pocketsArt(p, state) {
    const { ox, oy } = baseBox(p);
    const w = p.w * U, h = p.h * U, gap = 5;
    const pw = (w - gap * (p.cols + 1)) / p.cols, ph = (h - gap * (p.rows + 1)) / p.rows;
    let o = overHooks(ox, oy, w) + rect(ox, oy, w, h, p.color, 6, 2.5);
    p.pockets.forEach((s, i) => {
      const r = Math.floor(i / p.cols), k = i % p.cols;
      const px = ox + gap + k * (pw + gap), py = oy + gap + r * (ph + gap);
      o += tap(state, s.id, `<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="transparent"/>`, pocketArt(px, py, pw, ph));
    });
    return o;
  }

  function hookShape(x, y, s, c, double) {
    const path = `M${x} ${y + 4 * s} L${x} ${y + 16 * s} Q${x} ${y + 26 * s} ${x + 9 * s} ${y + 24 * s} L${x + 11 * s} ${y + 18 * s}`;
    let o = `<circle cx="${x}" cy="${y}" r="${5 * s}" fill="${c}" ${line(1.6)}/>` +
      `<path d="${path}" fill="none" stroke="${INK}" stroke-width="${4 * s}" stroke-linecap="round"/><path d="${path}" fill="none" stroke="${c}" stroke-width="${2 * s}" stroke-linecap="round"/>`;
    if (double) {
      const p2 = `M${x} ${y + 8 * s} Q${x - 12 * s} ${y + 10 * s} ${x - 11 * s} ${y + 20 * s}`;
      o += `<path d="${p2}" fill="none" stroke="${INK}" stroke-width="${4 * s}" stroke-linecap="round"/><path d="${p2}" fill="none" stroke="${c}" stroke-width="${2 * s}" stroke-linecap="round"/>`;
    }
    return o;
  }

  function hooksArt(p, state) {
    const { ox, oy } = baseBox(p);
    const w = p.w * U, h = p.h * U, metal = '#9aa7b8', brass = '#d9b14a';
    const step = HOOK_SPACING[p.sub] * U;
    let o = '';
    const s = p.sub === 'rack' ? 0.9 : 1.2;
    if (p.sub === 'overdoor') {
      o += `<path d="M${ox + 6} ${oy - 16} L${ox + w - 6} ${oy - 16} M${ox + 6} ${oy - 16} L${ox + 6} ${oy - 2} M${ox + w - 6} ${oy - 16} L${ox + w - 6} ${oy - 2}" fill="none" stroke="${metal}" stroke-width="5" stroke-linecap="round"/>`;
      o += rect(ox, oy - 4, w, 14, p.color, 5, 2);
    } else if (p.sub === 'rack' || p.sub === 'wall') {
      o += rect(ox, oy, w, 18, p.color, 6, 2.5);
    } else {
      o += `<circle cx="${ox + w / 2}" cy="${oy + 12}" r="11" fill="${p.color}" ${line(2)}/>`;
    }
    p.hooks.forEach((hk, i) => {
      const hx = p.sub === 'single' || p.sub === 'double' ? ox + w / 2 : ox + 0.2 * U + step * (i + 0.5);
      const hy = p.sub === 'single' || p.sub === 'double' ? oy + 12 : oy + 10;
      o += tap(state, hk.id, `<rect x="${hx - step / 2}" y="${oy}" width="${step}" height="${h}" fill="transparent"/>`,
        hookShape(hx, hy, s, p.sub === 'wall' ? brass : metal, p.sub === 'double' || p.sub === 'wall'));
    });
    return o;
  }

  function wallsorterArt(p, state) {
    const { ox, oy } = frontBox(p);
    const w = p.w * U, h = p.h * U;
    let o = rect(ox, oy, w, h, p.color, 8, 2.5);
    const sh = (h * 0.72) / p.slots.length;
    p.slots.forEach((sl, i) => {
      const sy = oy + 10 + i * sh;
      o += tap(state, sl.id, `<rect x="${ox}" y="${sy}" width="${w}" height="${sh}" fill="transparent"/>`,
        `<rect x="${ox + 16}" y="${sy + sh * 0.25}" width="${w - 32}" height="${sh * 0.45}" rx="2" fill="#fff" stroke="${INK}" stroke-width="1.2"/>` +
        rect(ox + 10, sy + sh * 0.45, w - 20, sh * 0.5, shade(p.color, -0.12), 4, 2));
    });
    const by = oy + h * 0.8;
    o += rect(ox + 10, by, w - 20, 10, shade(p.color, -0.2), 4, 2);
    const kstep = (w - 20) / p.keys.length;
    p.keys.forEach((k, i) => {
      const kx = ox + 10 + kstep * (i + 0.5);
      o += tap(state, k.id, `<rect x="${kx - kstep / 2}" y="${by - 4}" width="${kstep}" height="${h * 0.22}" fill="transparent"/>`, hookShape(kx, by + 4, 0.7, '#d9b14a'));
    });
    return o;
  }

  function containerArt(p, x, y, w, h) {
    const c = p.color;
    let o = '';
    if (p.sub === 'hamperRound') {
      o += `<path d="M${x} ${y + h * 0.1} L${x + w * 0.1} ${y + h * 0.95} Q${x + w / 2} ${y + h * 1.04} ${x + w * 0.9} ${y + h * 0.95} L${x + w} ${y + h * 0.1} Z" fill="${c}" ${line()}/>`;
      o += `<ellipse cx="${x + w / 2}" cy="${y + h * 0.1}" rx="${w / 2}" ry="${h * 0.09}" fill="${shade(c, -0.25)}" ${line()}/>`;
      for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) o += `<ellipse cx="${x + w * (0.2 + k * 0.15)}" cy="${y + h * (0.32 + r * 0.15)}" rx="${w * 0.035}" ry="${h * 0.04}" fill="${shade(c, -0.2)}"/>`;
    } else if (p.sub === 'hamperRect') {
      o += rect(x, y + h * 0.08, w, h * 0.92, c, 10) + rect(x - 4, y, w + 8, h * 0.15, shade(c, -0.12), 8);
      for (let r = 0; r < 5; r++) o += `<path d="M${x + 8} ${y + h * (0.3 + r * 0.13)} L${x + w - 8} ${y + h * (0.3 + r * 0.13)}" stroke="${shade(c, -0.18)}" stroke-width="3"/>`;
    } else if (p.sub === 'basket') {
      o += `<path d="M${x} ${y + h * 0.25} L${x + w * 0.08} ${y + h} L${x + w * 0.92} ${y + h} L${x + w} ${y + h * 0.25} Z" fill="${c}" ${line()}/>`;
      for (let r = 0; r < 3; r++) o += `<path d="M${x + 6} ${y + h * (0.45 + r * 0.18)} L${x + w - 6} ${y + h * (0.45 + r * 0.18)}" stroke="${shade(c, -0.2)}" stroke-width="4"/>`;
      o += rect(x - 3, y + h * 0.18, w + 6, h * 0.13, shade(c, 0.15), 6, 2.5);
      o += `<path d="M${x + w * 0.25} ${y + h * 0.2} Q${x + w / 2} ${y - h * 0.35} ${x + w * 0.75} ${y + h * 0.2}" fill="none" stroke="${INK}" stroke-width="7"/><path d="M${x + w * 0.25} ${y + h * 0.2} Q${x + w / 2} ${y - h * 0.35} ${x + w * 0.75} ${y + h * 0.2}" fill="none" stroke="${shade(c, 0.1)}" stroke-width="3"/>`;
    } else if (p.sub === 'bag') {
      o += `<path d="M${x + w * 0.25} ${y + h * 0.28} Q${x + w * 0.25} ${y} ${x + w / 2} ${y} Q${x + w * 0.75} ${y} ${x + w * 0.75} ${y + h * 0.28}" fill="none" ${line(4)}/>`;
      o += `<path d="M${x + 4} ${y + h * 0.26} L${x + w - 4} ${y + h * 0.26} L${x + w} ${y + h} L${x} ${y + h} Z" fill="${c}" ${line()}/>`;
    } else if (p.sub === 'trashKitchen') {
      o += rect(x + w * 0.06, y + h * 0.12, w * 0.88, h * 0.8, c, 12);
      o += `<path d="M${x} ${y + h * 0.13} Q${x + w / 2} ${y - h * 0.03} ${x + w} ${y + h * 0.13} Z" fill="${shade(c, -0.12)}" ${line()}/>`;
      o += rect(x + w * 0.38, y, w * 0.24, h * 0.04, shade(c, -0.3), 4, 2);
      o += rect(x + w * 0.25, y + h * 0.9, w * 0.5, h * 0.08, '#9aa7b8', 5, 2.5);
      o += `<path d="M${x + w * 0.18} ${y + h * 0.25} L${x + w * 0.18} ${y + h * 0.78} M${x + w * 0.82} ${y + h * 0.25} L${x + w * 0.82} ${y + h * 0.78}" stroke="${shade(c, 0.35)}" stroke-width="5" stroke-linecap="round"/>`;
    } else if (p.sub === 'trashRect') {
      o += `<path d="M${x + 4} ${y + h * 0.1} L${x + w - 4} ${y + h * 0.1} L${x + w - 10} ${y + h} L${x + 10} ${y + h} Z" fill="${c}" ${line()}/>`;
      o += rect(x, y, w, h * 0.15, shade(c, -0.15), 6) + rect(x + w * 0.33, y + h * 0.2, w * 0.34, h * 0.07, shade(c, -0.35), 4, 2);
    } else if (p.sub === 'trashRound') {
      o += `<path d="M${x} ${y + h * 0.07} L${x + w * 0.09} ${y + h * 0.95} Q${x + w / 2} ${y + h * 1.03} ${x + w * 0.91} ${y + h * 0.95} L${x + w} ${y + h * 0.07} Z" fill="${c}" ${line()}/>`;
      o += `<ellipse cx="${x + w / 2}" cy="${y + h * 0.07}" rx="${w / 2}" ry="${h * 0.075}" fill="${shade(c, -0.3)}" ${line()}/>`;
      o += `<path d="M${x + w * 0.11} ${y + h * 0.27} Q${x + w / 2} ${y + h * 0.35} ${x + w * 0.89} ${y + h * 0.27}" fill="none" stroke="${shade(c, 0.3)}" stroke-width="5"/>`;
    } else if (p.sub === 'recycle') {
      o += rect(x + 2, y + h * 0.11, w - 4, h * 0.89, c, 10) + rect(x - 2, y, w + 4, h * 0.14, shade(c, -0.15), 8);
      o += rect(x + w * 0.3, y + h * 0.035, w * 0.4, h * 0.05, shade(c, -0.4), 4, 2);
      o += recycleMark(x + w / 2, y + h * 0.58, Math.min(w, h) / 46);
    } else {
      o += rect(x, y + h * 0.2, w, h * 0.8, c, 4) + rect(x - 4, y, w + 8, h * 0.28, shade(c, -0.08), 4) + rect(x + w * 0.36, y + h * 0.5, w * 0.28, h * 0.18, '#fff', 3, 1.6);
    }
    return o;
  }

  function wireArt(p, state) {
    const { ox, oy } = frontBox(p);
    const w = p.w * U, h = p.h * U, post = '#b8c0cc';
    let o = rect(ox, oy, 10, h, post, 4, 2) + rect(ox + w - 10, oy, 10, h, post, 4, 2);
    o += `<circle cx="${ox + 5}" cy="${oy + h + 5}" r="5" fill="#9aa7b8" ${line(1.6)}/><circle cx="${ox + w - 5}" cy="${oy + h + 5}" r="5" fill="#9aa7b8" ${line(1.6)}/>`;
    const cells = p.cols[0].cells;
    const ch = h / cells.length;
    cells.forEach((k, i) => {
      const sy = oy + (i + 1) * ch - 10;
      let art = rect(ox - 4, sy, w + 8, 10, '#d5dbe3', 3, 2);
      for (let g = 1; g < 12; g++) art += `<path d="M${ox - 4 + g * (w + 8) / 12} ${sy} L${ox - 4 + g * (w + 8) / 12} ${sy + 10}" stroke="${INK}" stroke-width="1" opacity=".5"/>`;
      if (k.insert === 'bin') art += binArt(ox + 18, sy - ch * 0.75, Math.min(ch, w * 0.4), ch * 0.75, k.binColor || BIN_COLORS[0]);
      const hit = `<rect x="${ox}" y="${sy - ch + 10}" width="${w}" height="${ch}" fill="transparent"/>`;
      o += state.interactive ? `<g class="fpart" data-act="part" data-id="${k.id}" role="button" aria-label="Open">${hit}${art}</g>` : art;
      if (state.selected === k.id) o += `<rect x="${ox - 6}" y="${sy - ch + 8}" width="${w + 12}" height="${ch + 6}" rx="8" fill="none" stroke="#3a86ff" stroke-width="5" stroke-dasharray="10 6"/>`;
    });
    return o;
  }

  // ---------- Closet doors (the outside of a closet) ----------
  // folding (bifold), curtain, sliding, one regular door, or none.

  const DOOR_KINDS = ['bifold', 'curtain', 'sliding', 'swing', 'none'];

  function doorPanel(x, y, w, h, c) {
    return rect(x, y, w, h, c, 3, 2.5) +
      `<rect x="${x + w * 0.14}" y="${y + h * 0.05}" width="${w * 0.72}" height="${h * 0.4}" rx="3" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".3"/>` +
      `<rect x="${x + w * 0.14}" y="${y + h * 0.52}" width="${w * 0.72}" height="${h * 0.42}" rx="3" fill="none" stroke="${INK}" stroke-width="1.6" opacity=".3"/>`;
  }

  function doorsArt(kind, x, y, w, h, c) {
    let o = '';
    if (kind === 'bifold') {
      const pw = w / 4;
      for (let i = 0; i < 4; i++) o += doorPanel(x + i * pw, y, pw, h, shade(c, i % 2 ? 0 : 0.05));
      o += `<circle cx="${x + 2 * pw - 12}" cy="${y + h * 0.48}" r="5" fill="${shade(c, -0.35)}" ${line(2)}/><circle cx="${x + 2 * pw + 12}" cy="${y + h * 0.48}" r="5" fill="${shade(c, -0.35)}" ${line(2)}/>`;
    } else if (kind === 'curtain') {
      o += rect(x - 6, y - 4, w + 12, 8, '#b8b8c8', 4, 2);
      const n = Math.max(5, Math.round(w / 28)), fw = w / n;
      let d = `M${x} ${y + 4} L${x + w} ${y + 4} L${x + w} ${y + h - 8}`;
      for (let i = n; i > 0; i--) { const xx = x + i * fw; d += ` Q${xx - fw / 2} ${y + h + 4} ${xx - fw} ${y + h - 8}`; }
      o += `<path d="${d} Z" fill="${c}" ${line(2.5)}/>`;
      for (let i = 1; i < n; i++) o += `<path d="M${x + i * fw} ${y + 10} L${x + i * fw} ${y + h - 14}" stroke="${shade(c, -0.18)}" stroke-width="3" stroke-linecap="round"/>`;
      for (let i = 0; i < n; i++) o += `<circle cx="${x + i * fw + fw / 2}" cy="${y}" r="4" fill="#fff" ${line(1.6)}/>`;
    } else if (kind === 'sliding') {
      const pw = w * 0.54;
      o += doorPanel(x, y, pw, h, shade(c, 0.05)) + doorPanel(x + w - pw, y + 4, pw, h - 4, c);
      o += rect(x + pw - 24, y + h * 0.42, 8, 46, shade(c, -0.3), 3, 1.6) + rect(x + w - pw + 16, y + h * 0.42, 8, 46, shade(c, -0.3), 3, 1.6);
    } else if (kind === 'swing') {
      const dw = Math.min(w, 5 * U), dx = x + (w - dw) / 2;
      o += rect(x, y, w, h, '#e9dcc6', 2, 0);
      o += doorPanel(dx, y, dw, h, c) + `<circle cx="${dx + dw - 16}" cy="${y + h * 0.5}" r="6" fill="#d9b14a" ${line(2)}/>`;
    }
    return o;
  }

  // Things hanging on the outside of a closet's doors (or a room door), left to right along the top.
  function hungArt(hung, x0, y0, x1, state) {
    let o = '';
    let fx = x0 + 14;
    hung.forEach(q => {
      const box = frontBox(q);
      const g = `<svg x="${fx}" y="${y0}" width="${box.W}" height="${box.H}" viewBox="0 0 ${box.W} ${box.H}">${render(q, { bare: true })}</svg>`;
      o += state.interactive ? `<g class="fpart" data-act="open-piece" data-id="${q.id}" role="button" aria-label="Open">${g}</g>` : g;
      fx += box.W + 14;
    });
    if (state.interactive && state.addHang) {
      const bx = Math.min(fx + 34, x1 - 34);
      o += `<g class="fpart add-in" data-act="hang-add" role="button" aria-label="Hang something here">` +
        `<circle cx="${bx}" cy="${y0 + 40}" r="26" fill="#ffd54a" ${line()}/>` +
        `<path d="M${bx - 11} ${y0 + 40} h22 M${bx} ${y0 + 29} v22" stroke="${INK}" stroke-width="5" stroke-linecap="round"/></g>`;
    }
    return o;
  }

  function closetOutsideArt(p, inside, state) {
    const { w, h } = closetInner(p, inside, state.addInside);
    const ox = 4, oy = 4;
    let o = rect(ox, oy, w, h, p.color, 10);
    o += doorsArt(p.doors, ox + 16, oy + 16, w - 32, h - 32, p.doorColor || '#ffffff');
    o += hungArt(state.hung || [], ox + 16, oy + 34, ox + w - 16, state);
    return o;
  }

  // A room door seen from the front, with whatever hangs on it.
  function renderDoor(item, hung, state = {}) {
    const need = hung.reduce((a, q) => a + frontBox(q).W + 14, 40) + (state.addHang ? 80 : 0);
    const dw = Math.max(5 * U, need), dh = 11.5 * U;
    const W = dw + 40, H = dh + 30;
    let o = rect(4, 4, W - 8, H - 4, '#e9dcc6', 8);
    o += doorPanel(20, 20, dw, dh, item.color || '#ffffff');
    o += `<circle cx="${20 + dw - 18}" cy="${20 + dh * 0.5}" r="7" fill="#d9b14a" ${line(2)}/>`;
    o += hungArt(hung, 20, 30, 20 + dw, state);
    return svg(W, H, o, 'furn-svg');
  }

  // Small pictures for choosing a closet's doors.
  function doorIcon(kind) {
    let o = rect(4, 4, 52, 52, '#e9dcc6', 6, 2);
    if (kind === 'none') {
      o += rect(9, 9, 42, 42, '#fffaf0', 3, 1.5) + `<path d="M13 18 H47" stroke="#8a8aa0" stroke-width="3" stroke-linecap="round"/>` +
        [18, 26, 34, 42].map(x => `<rect x="${x - 3}" y="20" width="6" height="14" rx="1.5" fill="#ff9fb8" stroke="${INK}" stroke-width="1"/>`).join('');
      return svg(60, 60, o, 'icon-svg');
    }
    o += doorsArt(kind, 9, 10, 42, 42, kind === 'curtain' ? '#b9a2ff' : '#ffffff').replace(/stroke-width="2\.5"/g, 'stroke-width="1.6"').replace(/stroke-width="3"/g, 'stroke-width="1.6"');
    return svg(60, 60, o, 'icon-svg');
  }

  // The front edge of a closet on the map shows its doors.
  function closetDoorTop(kind, x, y, W) {
    if (kind === 'bifold') {
      let d = `M${x} ${y}`;
      const n = Math.max(4, Math.round(W / 30)) * 2;
      for (let i = 1; i <= n; i++) d += ` L${x + i * W / n} ${y + (i % 2 ? 12 : 0)}`;
      return `<path d="${d}" fill="none" stroke="#c98b5a" stroke-width="5" stroke-linejoin="round"/>`;
    }
    if (kind === 'curtain') {
      const n = Math.max(5, Math.round(W / 26));
      let d = `M${x} ${y + 3}`;
      for (let i = 0; i < n; i++) d += ` q${W / n / 2} 10 ${W / n} 0`;
      return `<path d="${d}" fill="none" stroke="#9f86f0" stroke-width="5"/>`;
    }
    if (kind === 'sliding') {
      return rect(x, y - 4, W * 0.54, 7, '#c98b5a', 2, 2) + rect(x + W * 0.46, y + 4, W * 0.54, 7, '#c98b5a', 2, 2);
    }
    if (kind === 'swing') {
      const dw = Math.min(W * 0.6, 5 * 20), dx = x + (W - dw) / 2;
      return `<path d="${`M${dx} ${y} L${dx} ${y + dw} A${dw} ${dw} 0 0 0 ${dx + dw} ${y}`}" fill="#ffffff55" stroke="${INK}" stroke-width="2" stroke-dasharray="7 6"/>` +
        rect(dx - 4, y, 8, dw, '#c98b5a', 3, 2);
    }
    return '';
  }

  // ---------- Public drawing ----------

  // state: { interactive, selected, inside (pieces in a closet), addInside, bare }
  // Pieces saved by older versions get the newer layout (closet sections, sorter trays).
  function fixPiece(p) {
    fixCloset(p);
    if (hasParts(p) && !p.top) p.top = { id: uid() };
    if (hasParts(p)) p.cols.forEach(c => c.cells.forEach(k => {
      if (k.type === 'open' && INSERT_COUNTS[k.insert] && !k.spots) setInsert(k, k.insert);
    }));
    return p;
  }

  function render(p, state = {}) {
    fixPiece(p);
    const inside = state.inside || [];
    const box = p.kind === 'closet' ? closetBox(p, inside, state.addInside) : frontBox(p);
    let art;
    if (p.kind === 'closet') art = state.outside && p.doors !== 'none' ? closetOutsideArt(p, inside, state) : closetArt(p, inside, state);
    else if (p.kind === 'bed') art = bedArt(p);
    else if (p.kind === 'seat') art = seatArt(p);
    else if (p.kind === 'wallshelf') art = wallshelfArt(p, state);
    else if (p.kind === 'pockets') art = pocketsArt(p, state);
    else if (p.kind === 'hooks') art = hooksArt(p, state);
    else if (p.kind === 'wallsorter') art = wallsorterArt(p, state);
    else if (p.kind === 'container') {
      const { ox, oy } = frontBox(p);
      art = tap(state, p.spot.id, `<rect x="${ox}" y="${oy}" width="${p.w * U}" height="${p.h * U}" fill="transparent"/>`, containerArt(p, ox, oy, p.w * U, p.h * U));
    } else if (p.style === 'wire') art = wireArt(p, state);
    else art = storageArt(p, state);
    const k = scaleOf(p);
    if (k !== 1) art = `<g transform="scale(${k})">${art}</g>`;
    if (state.bare) return art;
    return svg(box.W, box.H, art, 'furn-svg');
  }

  // ---------- Inside views (a part opened up) ----------

  function findCell(p, id) {
    if (!hasParts(p)) return null;
    for (const c of p.cols) for (const k of c.cells) {
      if (k.id === id) return k;
      if (k.spots && k.spots.some(s => s.id === id)) return k;
    }
    return null;
  }

  // A big picture of one part, opened, showing the space(s) inside.
  function renderInside(p, partId) {
    const c = p.color;
    const empty = '#fffaf0';
    const dashed = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${empty}" stroke="#d8c8b4" stroke-width="3" stroke-dasharray="10 8"/>`;
    if (p.top && partId === p.top.id) {
      return svg(360, 200, dashed(30, 20, 300, 110) + rect(10, 136, 340, 22, shade(c, 0.28), 8) + rect(24, 158, 312, 30, c, 6), 'inside-svg');
    }
    if (p.kind === 'pockets') {
      return svg(360, 260, overHooks(60, 30, 240) + rect(60, 30, 240, 220, p.color, 10) + pocketArt(90, 50, 180, 190) + dashed(110, 110, 140, 110), 'inside-svg');
    }
    if (p.kind === 'hooks' || (p.kind === 'wallsorter' && p.keys.some(k => k.id === partId))) {
      return svg(360, 260, hookShape(180, 40, 3, p.kind === 'wallsorter' || p.sub === 'wall' ? '#d9b14a' : '#9aa7b8', p.sub === 'double' || p.sub === 'wall') + dashed(90, 130, 180, 110), 'inside-svg');
    }
    if (p.kind === 'wallsorter') {
      return svg(360, 220, rect(20, 20, 320, 180, p.color, 12) + `<rect x="50" y="40" width="260" height="90" rx="4" fill="#fff" stroke="${INK}" stroke-width="1.6"/>` + rect(36, 110, 288, 70, shade(p.color, -0.12), 8) + dashed(70, 50, 220, 60), 'inside-svg');
    }
    if (p.kind === 'container') {
      return svg(360, 280, containerArt(p, 60, p.sub === 'basket' ? 90 : 40, 240, p.sub === 'basket' ? 170 : 230) + dashed(110, p.sub === 'basket' ? 150 : 110, 140, 90), 'inside-svg');
    }
    if (p.kind === 'wallshelf') {
      return svg(360, 200, rect(20, 140, 320, 18, c, 6) +
        `<path d="M44 158 l0 34 l26 -34" fill="${shade(c, -0.25)}" ${line()}/><path d="M316 158 l0 34 l-26 -34" fill="${shade(c, -0.25)}" ${line()}/>` +
        `<rect x="30" y="30" width="300" height="104" rx="14" fill="${empty}" stroke="#d8c8b4" stroke-width="3" stroke-dasharray="10 8"/>`, 'inside-svg');
    }
    if (p.kind === 'closet') {
      fixCloset(p);
      const isShelf = p.shelves.some(s => s.id === partId) || p.sections.some(x => x.kind === 'shelves' && x.shelves.some(s => s.id === partId));
      const isRod = p.sections.some(x => x.kind !== 'shelves' && x.rods.some(s => s.id === partId));
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
      else if (k.insert === 'sorter') o += sorterArt(46, 30, 268, 206, k.count);
      else if (k.insert === 'drawers') o += drawerBoxArt(50, 30, 260, 210, k.count, k.binColor);
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
    const b = { cell: { id: 'x', type, insert: insert || 'empty', binColor: insert === 'drawers' ? '#3d4a45' : '#8fd3ff', count: insert === 'drawers' ? 3 : 5, hinge: 'l' }, ...shape };
    return svg(60, 60, partArt({ color: type === 'open' ? c : '#ffd27a', style: 'wood' }, b, {}), 'icon-svg');
  }

  // Small pictures for a closet section's setup.
  function sectionIcon(kind) {
    let o = rect(4, 4, 52, 52, '#e9dcc6', 6, 2) + rect(10, 10, 40, 40, '#fffaf0', 3, 1.5);
    const rod = (y, s) => `<path d="M14 ${y} L46 ${y}" stroke="#8a8aa0" stroke-width="3" stroke-linecap="round"/>` +
      [20, 30, 40].map(x => `<rect x="${x - 4}" y="${y + 2}" width="8" height="${12 * s}" rx="2" fill="#ff9fb8" stroke="${INK}" stroke-width="1.2"/>`).join('');
    if (kind === 'two') o += rod(16, 1) + rod(34, 1);
    else if (kind === 'low') o += rod(28, 1.1);
    else if (kind === 'shelves') o += [18, 27, 36, 45].map(y => `<rect x="12" y="${y}" width="36" height="3.5" rx="1.5" fill="#c9b08a"/>`).join('');
    else o += rod(16, 1.6);
    return svg(60, 60, o, 'icon-svg');
  }

  function findSection(p, id) {
    return p.kind === 'closet' ? (fixCloset(p).sections.find(x => x.id === id) || null) : null;
  }

  // ---------- From above (the map) ----------
  // Furniture is 3-D: a tall skinny dresser has a narrow top, but it's still a full drawer deep.
  // Sizes are in the same units as the front view (about 7 inches each), so pieces match each other.

  const DEPTH = { dresser: 2.6, table: 2.3, tower: 2.1, cubby: 2.3, bookshelf: 1.7, wallshelf: 1.2, closet: 3.6, wire: 2, hooks: 0.6, wallsorter: 0.6, pockets: 0.4 };
  const BED_SIZE = { twin: [5.6, 10.8], bunk: [5.8, 11.2], loft: [5.8, 11.2], queen: [8.6, 11.6], king: [11, 11.6] };
  const SEAT_FRONT_W = { chair: 2.2, beanbag: 3, floorchair: 2.8, recliner: 4.8 };
  const SEAT_SIZE = { chair: [2.6, 2.8], beanbag: [4.2, 4.2], floorchair: [3, 3.6], recliner: [3.8, 5.6] };

  // Width and depth of a piece seen from above, in units.
  function footprint(p) {
    if (p.kind === 'bed') {
      const [w, d] = BED_SIZE[p.bed] || BED_SIZE.twin;
      const f = p.w / (BED_FRONT_W[p.bed] || p.w);
      // Twin, queen and king are seen from the foot (width); bunk and loft from the side (length).
      return p.bed === 'bunk' || p.bed === 'loft' ? { w: w * (p.bw || 1), d: p.depth || d * f } : { w: w * f, d: p.depth || d };
    }
    if (p.kind === 'seat') {
      // Made bigger or smaller on its page: the top on the map grows with it.
      const [w, d] = SEAT_SIZE[p.seat] || SEAT_SIZE.chair;
      const f = p.w / (SEAT_FRONT_W[p.seat] || p.w);
      return { w: w * f, d: p.depth || d * f };
    }
    if (p.kind === 'closet') return { w: fixCloset(p).sections.reduce((a, x) => a + x.w, 0), d: p.depth || DEPTH.closet };
    if (p.kind === 'container') { const z = CONTAINER_SIZE[p.sub]; const f = p.w / z[0]; return { w: z[2] * f, d: p.depth || z[3] * f }; }
    return { w: p.w * scaleOf(p), d: p.depth || DEPTH[p.kind] || 2.2 };
  }

  // Beds come in set sizes (twin, queen...); seats stay as they are.
  const canStretch = () => true;
  const canDeepen = p => !['pockets', 'hooks', 'wallshelf'].includes(p.kind);
  const BED_FRONT_W = { twin: 3, bunk: 6, loft: 6, queen: 4.5, king: 5.5 };

  // Make a piece wider or narrower, by eye. A closet stretches every section.
  function setWidth(p, w) {
    if (!canStretch(p)) return;
    w = Math.round(Math.max(1.5, Math.min(40, w)) * 10) / 10;
    if (p.kind === 'hooks' || p.kind === 'pockets') {
      p.hs = Math.round(Math.max(0.5, Math.min(2.5, w / p.w)) * 100) / 100;
      return;
    }
    if (p.kind === 'bed' || p.kind === 'seat' || p.kind === 'container') {
      // These are sized by their front width; set it so the top on the map is w wide.
      if (!(p.kind === 'bed' && (p.bed === 'bunk' || p.bed === 'loft'))) {
        const now = footprint(p).w;
        p.w = Math.round(p.w * w / now * 10) / 10;
        return;
      }
    }
    if (p.kind === 'closet') {
      fixCloset(p);
      const total = p.sections.reduce((a, x) => a + x.w, 0);
      p.sections.forEach(x => { x.w = Math.max(1, x.w * w / total); });
      p.w = p.sections.reduce((a, x) => a + x.w, 0);
      return;
    }
    if (p.kind === 'bed' && (p.bed === 'bunk' || p.bed === 'loft')) {
      // On the map the stretch makes the mattress wider; on its page ↔ makes it longer.
      p.bw = Math.round(w / BED_SIZE[p.bed][0] * 100) / 100;
      return;
    }
    p.w = w;
  }

  function setDepth(p, d) {
    if (!canDeepen(p)) return;
    p.depth = Math.round(Math.max(0.8, Math.min(20, d)) * 10) / 10;
  }

  // The top of a piece, front edge at the bottom. S is pixels per unit.
  function topArt(p, S, x = 0, y = 0) {
    const { w: fw, d: fd } = footprint(p);
    const W = fw * S, D = fd * S, c = p.color;
    let o = '';
    if (p.kind === 'bed') {
      const frame = '#d9c4a2';
      o += rect(x, y, W, D, p.bed === 'bunk' || p.bed === 'loft' ? '#c9cfd8' : frame, 10);
      o += rect(x + 6, y + 6, W - 12, D - 12, '#fff', 8, 2);
      const pillows = p.bed === 'queen' || p.bed === 'king' ? 2 : 1;
      const pw = (W - 24 - (pillows - 1) * 8) / pillows;
      for (let i = 0; i < pillows; i++) o += rect(x + 12 + i * (pw + 8), y + 12, pw, D * 0.13, '#fffaf0', 12, 2);
      const by = y + D * 0.3;
      o += `<path d="M${x + 6} ${by} L${x + W - 6} ${by} L${x + W - 6} ${y + D - 14} Q${x + W - 6} ${y + D - 6} ${x + W - 14} ${y + D - 6} L${x + 14} ${y + D - 6} Q${x + 6} ${y + D - 6} ${x + 6} ${y + D - 14} Z" fill="${c}" ${line(2)}/>`;
      o += `<path d="M${x + 6} ${by + 10} L${x + W - 6} ${by + 10}" stroke="${shade(c, 0.4)}" stroke-width="5"/>`;
      if (p.bed === 'bunk' || p.bed === 'loft') {
        // The ladder down one side
        o += rect(x + W - 16, y + D * 0.45, 10, D * 0.3, '#c9cfd8', 3, 2);
      }
      return o;
    }
    if (p.kind === 'seat') {
      if (p.seat === 'beanbag') {
        return `<ellipse cx="${x + W / 2}" cy="${y + D / 2}" rx="${W / 2 - 2}" ry="${D / 2 - 2}" fill="${c}" ${line()}/>` +
          `<ellipse cx="${x + W / 2}" cy="${y + D * 0.56}" rx="${W * 0.28}" ry="${D * 0.22}" fill="${shade(c, -0.12)}" opacity=".7"/>`;
      }
      if (p.seat === 'recliner') {
        o += rect(x, y + D * 0.15, W, D * 0.55, shade(c, 0.22), 10) + rect(x + 2, y, W - 4, D * 0.22, c, 8);
        o += rect(x + W * 0.15, y + D * 0.68, W * 0.7, D * 0.32, shade(c, 0.1), 8);
        return o;
      }
      o += rect(x, y + D * 0.2, W, D * 0.8, shade(c, 0.22), 10);
      o += rect(x + 2, y, W - 4, D * 0.26, c, 8);
      return o;
    }
    if (p.kind === 'wallshelf' || p.kind === 'hooks' || p.kind === 'wallsorter' || p.kind === 'pockets') return rect(x, y, W, D, c, 4);
    if (p.kind === 'container') {
      if (p.sub === 'trashRound') return `<ellipse cx="${x + W / 2}" cy="${y + D / 2}" rx="${W / 2 - 2}" ry="${D / 2 - 2}" fill="${c}" ${line()}/><ellipse cx="${x + W / 2}" cy="${y + D / 2}" rx="${W * 0.36}" ry="${D * 0.36}" fill="${shade(c, -0.25)}"/>`;
      if (p.sub === 'trashKitchen') return rect(x, y, W, D - 8, c, 14) + `<path d="M${x + 8} ${y + D * 0.45} Q${x + W / 2} ${y + D * 0.15} ${x + W - 8} ${y + D * 0.45}" fill="none" stroke="${INK}" stroke-width="2" opacity=".4"/>` + rect(x + W * 0.3, y + D - 10, W * 0.4, 10, '#9aa7b8', 4, 2);
      if (p.sub === 'recycle') return rect(x, y, W, D, c, 8) + recycleMark(x + W / 2, y + D / 2 + 1, Math.min(W, D) / 52);
      if (p.sub === 'hamperRound') return `<ellipse cx="${x + W / 2}" cy="${y + D / 2}" rx="${W / 2 - 2}" ry="${D / 2 - 2}" fill="${c}" ${line()}/><ellipse cx="${x + W / 2}" cy="${y + D / 2}" rx="${W / 2 - 9}" ry="${D / 2 - 9}" fill="${shade(c, -0.15)}"/>`;
      return rect(x, y, W, D, c, p.sub === 'bag' ? 12 : 6) + rect(x + 6, y + 6, W - 12, D - 12, shade(c, -0.15), 4, 1.5);
    }
    if (p.style === 'wire') {
      o += rect(x, y, W, D, '#d5dbe3', 4);
      for (let g = 1; g < 10; g++) o += `<path d="M${x + g * W / 10} ${y} L${x + g * W / 10} ${y + D}" stroke="${INK}" stroke-width="1" opacity=".45"/>`;
      return o;
    }
    if (p.kind === 'closet') {
      fixCloset(p);
      o += rect(x, y, W, D, '#fffaf0', 4, 2);
      o += `<path d="M${x + 10} ${y + D * 0.45} L${x + W - 10} ${y + D * 0.45}" stroke="#a8a8b8" stroke-width="6" stroke-linecap="round"/>`;
      o += closetDoorTop(p.doors, x, y + D, W);
      return o;
    }
    // Storage: the top, then the front edge with a knob for each column of drawers.
    const topC = p.style === 'plastic' ? '#eef1f5' : shade(c, 0.25);
    o += rect(x, y, W, D, topC, 6);
    const strip = Math.max(8, D * 0.12);
    o += rect(x, y + D - strip, W, strip, p.style === 'plastic' ? c : shade(c, -0.12), 3, 2);
    if (hasParts(p)) {
      const total = p.cols.reduce((a, k) => a + k.w, 0);
      let cx = x;
      p.cols.forEach((k, i) => {
        const cw = W * k.w / total;
        if (i) o += `<path d="M${cx} ${y + D - strip} L${cx} ${y + D}" stroke="${INK}" stroke-width="2"/>`;
        if (k.cells.some(z => z.type !== 'open')) o += `<circle cx="${cx + cw / 2}" cy="${y + D + 3}" r="4" fill="${shade(c, -0.35)}" ${line(1.6)}/>`;
        cx += cw;
      });
    }
    return o;
  }

  function renderTop(p, S = 14) {
    const { w, d } = footprint(p);
    return svg(w * S + 8, d * S + 12, topArt(p, S, 4, 4), 'top-svg');
  }

  return {
    COLORS, BIN_COLORS, CATALOG, GROUPS,
    make, render, renderInside, partIcon, sectionIcon,
    hasParts, fitsInCloset, spacesOf, spaceUsed, cellUsed, findCell,
    section, fixCloset, sectionSpaces, findSection,
    cell, col, uid, shade, setInsert, INSERT_COUNTS, fixPiece,
    footprint, topArt, renderTop, canStretch, canDeepen, setWidth, setDepth,
    DOOR_KINDS, doorIcon, renderDoor, sizePockets, sizeHooks, closetDoorTop,
  };
})();
