// The room as a map from above, like looking down from the ceiling.
// Everything is in room units (the same units as furniture, about 7 inches each).
//
// room = {
//   size: { w, d },          how wide and how deep, set by eye
//   view: 0..3,              quarter turns, so the map matches what the child sees
//   wallItems: [ { id, type: 'door' | 'window' | 'switch', wall: 0..3, pos, flip } ],
//   pieces: [ ... place: { x, y, rot } ]   furniture on the map (center point, quarter turns)
// }
// Walls: 0 top, 1 right, 2 bottom, 3 left. pos is how far along the wall (from the top or left end).
// A piece with rot 0 faces down (its back is toward the top wall).
const RoomMap = (() => {
  const INK = '#3a2a2a';
  const S = 20;          // pixels per unit in the map drawing
  const M = 3;           // room around the walls, in units
  const T = 0.7;         // wall thickness
  const ITEM_W = { door: 4.6, window: 5, switch: 0.9, outlet: 0.9 };
  const MIN = 8, MAX = 60;
  const itemW = it => it.w || ITEM_W[it.type];

  // Direction along a wall, and along a turned piece's width.
  const WALL_AXIS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

  // Stretch a door, window or piece by dragging its handle to a point.
  function stretchItem(room, it, x, y) {
    const f = wallFrame(room, it.wall, it.pos);
    const [ax, ay] = WALL_AXIS[it.wall];
    const half = Math.abs((x - f.x) * ax + (y - f.y) * ay);
    const L = wallLength(room, it.wall);
    it.w = Math.round(Math.max(it.type === 'switch' ? 0.6 : 1.5, Math.min(L, half * 2)) * 10) / 10;
    settleWallItem(room, it);
  }

  function stretchPiece(room, p, x, y) {
    const [ax, ay] = WALL_AXIS[(p.place.rot || 0) % 4];
    const half = Math.abs((x - p.place.x) * ax + (y - p.place.y) * ay);
    Furniture.setWidth(p, half * 2);
    settle(room, p);
  }

  const line = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  function defaults(room) {
    if (!room.size) room.size = { w: 20, d: 16 };
    if (room.view == null) room.view = 0;
    if (!room.wallItems) room.wallItems = [];
    return room;
  }

  const wallLength = (room, wall) => (wall % 2 === 0 ? room.size.w : room.size.d);

  // A point on a wall, and the turn that makes "along the wall" the x-axis and "into the room" +y.
  function wallFrame(room, wall, pos) {
    const { w, d } = room.size;
    if (wall === 0) return { x: pos, y: 0, a: 0 };
    if (wall === 1) return { x: w, y: pos, a: 90 };
    if (wall === 2) return { x: pos, y: d, a: 180 };
    return { x: 0, y: pos, a: -90 };
  }

  // Half the width and depth of a placed piece, after its turn.
  function halfSize(p) {
    const f = Furniture.footprint(p);
    const r = (p.place && p.place.rot) || 0;
    return r % 2 ? { hx: f.d / 2, hy: f.w / 2 } : { hx: f.w / 2, hy: f.d / 2 };
  }

  // Keep a piece inside the room. Closets and wall shelves always stand against a wall,
  // and anything dropped near a wall turns so its back is against it.
  function settle(room, p) {
    const { w, d } = room.size;
    const pl = p.place;
    const mustWall = p.kind === 'closet' || p.kind === 'wallshelf';
    let { hx, hy } = halfSize(p);
    const gaps = [pl.y - hy, w - (pl.x + hx), d - (pl.y + hy), pl.x - hx];   // top, right, bottom, left
    let wall = gaps.indexOf(Math.min(...gaps));
    if (mustWall || gaps[wall] < 1.6) {
      pl.rot = [0, 1, 2, 3][wall];
      ({ hx, hy } = halfSize(p));
      if (wall === 0) pl.y = hy;
      if (wall === 1) pl.x = w - hx;
      if (wall === 2) pl.y = d - hy;
      if (wall === 3) pl.x = hx;
    }
    pl.x = Math.max(hx, Math.min(w - hx, pl.x));
    pl.y = Math.max(hy, Math.min(d - hy, pl.y));
    // A piece bigger than the room sits in the middle until the room is stretched.
    if (hx * 2 > w) pl.x = w / 2;
    if (hy * 2 > d) pl.y = d / 2;
  }

  // Put a wall item on the wall nearest to a point.
  function settleWallItem(room, item, x, y) {
    const { w, d } = room.size;
    if (x != null) {
      const gaps = [Math.abs(y), Math.abs(w - x), Math.abs(d - y), Math.abs(x)];
      item.wall = gaps.indexOf(Math.min(...gaps));
      item.pos = item.wall % 2 === 0 ? x : y;
    }
    const L = wallLength(room, item.wall);
    const half = itemW(item) / 2;
    item.pos = Math.max(half, Math.min(L - half, item.pos));
  }

  function resize(room, dim, value, pieces) {
    room.size[dim] = Math.round(Math.max(MIN, Math.min(MAX, value)) * 2) / 2;
    room.wallItems.forEach(it => settleWallItem(room, it));
    pieces.forEach(p => { if (p.place) settle(room, p); });
  }

  // ---------- Drawing ----------

  // A round yellow handle with arrows, dragged to make something wider.
  function stretchHandle(x, y, id) {
    return `<g class="map-handle" data-map="stretch" data-id="${id}" transform="translate(${x} ${y})">` +
      `<circle r="${S * 1.15}" fill="#ffd54a" ${line(3)}/>` +
      `<path d="M-11 0 H11 M-5 -6 L-11 0 L-5 6 M5 -6 L11 0 L5 6" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>`;
  }

  function bulbMark(x, y) {
    return `<g transform="translate(${x} ${y})"><path d="M0 -9 C-7 -9 -10 -3 -7 2 C-5 5 -4 6 -4 9 L4 9 C4 6 5 5 7 2 C10 -3 7 -9 0 -9Z" fill="#ffd54a" ${line(1.8)}/><rect x="-3.5" y="9" width="7" height="4" rx="1.5" fill="#c9cfd8" ${line(1.4)}/></g>`;
  }

  function plugMark(x, y) {
    return `<g transform="translate(${x} ${y})"><rect x="-6" y="-6" width="12" height="11" rx="3" fill="#9aa7b8" ${line(1.6)}/><path d="M-3 -6 v-4 M3 -6 v-4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/><path d="M0 5 q0 6 6 7" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/></g>`;
  }

  function wallItemArt(room, it, selected) {
    const f = wallFrame(room, it.wall, it.pos);
    const w = itemW(it) * S;
    let o = '';
    if (it.type === 'door') {
      const hinge = it.flip ? w / 2 : -w / 2;
      const end = it.flip ? -w / 2 : w / 2;
      o += `<rect x="${-w / 2}" y="${-T * S - 2}" width="${w}" height="${T * S + 4}" fill="#f3dfbf"/>`;
      o += `<path d="M${hinge} 0 L${hinge} ${w} A${w} ${w} 0 0 ${it.flip ? 1 : 0} ${end} 0" fill="#ffffff55" stroke="${INK}" stroke-width="2" stroke-dasharray="7 6"/>`;
      o += `<rect x="${hinge - 4}" y="0" width="8" height="${w}" rx="3" fill="#c98b5a" ${line(2)}/>`;
    } else if (it.type === 'window') {
      o += `<rect x="${-w / 2}" y="${-T * S - 3}" width="${w}" height="${T * S + 6}" rx="3" fill="#bfe8ff" ${line(2)}/>`;
      o += `<path d="M${-w / 2} ${-T * S / 2} L${w / 2} ${-T * S / 2}" stroke="${INK}" stroke-width="2"/>`;
    } else if (it.type === 'outlet') {
      const p = Math.max(w, 18);
      o += `<rect x="${-p / 2}" y="2" width="${p}" height="${p * 1.25}" rx="4" fill="#fff" ${line(2)}/>`;
      o += `<rect x="${-4}" y="${6}" width="2.5" height="6" fill="${INK}"/><rect x="${1.5}" y="${6}" width="2.5" height="6" fill="${INK}"/><circle cx="0" cy="${15}" r="2" fill="${INK}"/>`;
      o += plugMark(0, p * 1.25 + 14);
    } else {
      const p = Math.max(w, 18);
      o += `<rect x="${-p / 2}" y="2" width="${p}" height="${p * 1.25}" rx="4" fill="#fff" ${line(2)}/>`;
      o += `<rect x="${-3}" y="${6}" width="6" height="${p * 0.75}" rx="2" fill="${INK}"/>`;
      o += bulbMark(0, p * 1.25 + 14);
    }
    const hit = it.type === 'door'
      ? `<rect x="${-w / 2}" y="${-T * S - 6}" width="${w}" height="${w + T * S + 6}" fill="transparent"/>`
      : `<rect x="${-w / 2 - 8}" y="${-T * S - 10}" width="${w + 16}" height="${T * S + 40}" fill="transparent"/>`;
    const sel = selected
      ? `<rect x="${-w / 2 - 6}" y="${-T * S - 8}" width="${w + 12}" height="${(it.type === 'door' ? w : 30) + T * S + 14}" rx="8" fill="none" stroke="#3a86ff" stroke-width="4" stroke-dasharray="10 6"/>`
      : '';
    return `<g class="map-item" data-map="wall" data-id="${it.id}" transform="translate(${f.x * S} ${f.y * S}) rotate(${f.a})">${hit}${o}${sel}</g>`;
  }

  function pieceArt(p, selected, dim) {
    const f = Furniture.footprint(p);
    const W = f.w * S, D = f.d * S;
    const { x, y, rot } = p.place;
    const sel = selected
      ? `<rect x="${-W / 2 - 6}" y="${-D / 2 - 6}" width="${W + 12}" height="${D + 16}" rx="10" fill="none" stroke="#3a86ff" stroke-width="4" stroke-dasharray="10 6"/>`
      : '';
    return `<g class="map-item${dim ? ' dim' : ''}" data-map="piece" data-id="${p.id}" transform="translate(${x * S} ${y * S}) rotate(${(rot || 0) * 90})">` +
      `<rect x="${-W / 2}" y="${-D / 2}" width="${W}" height="${D}" fill="transparent"/>` +
      Furniture.topArt(p, S, -W / 2, -D / 2) + sel + '</g>';
  }

  // state: { step, selected }
  function render(room, pieces, state = {}) {
    defaults(room);
    const { w, d } = room.size;
    const r = room.view;
    const VW = ((r % 2 ? d : w) + 2 * M) * S;
    const VH = ((r % 2 ? w : d) + 2 * M) * S;
    const Wp = w * S, Dp = d * S, Tp = T * S;
    let o = `<g id="room-g" transform="translate(${VW / 2} ${VH / 2}) rotate(${r * 90}) translate(${-Wp / 2} ${-Dp / 2})">`;
    // Floor
    o += `<rect x="0" y="0" width="${Wp}" height="${Dp}" fill="#f3dfbf"/>`;
    for (let i = 1; i < d; i += 1.6) o += `<path d="M0 ${i * S} L${Wp} ${i * S}" stroke="#e8cfa6" stroke-width="2"/>`;
    // Walls
    o += `<path d="M${-Tp / 2} ${-Tp / 2} H${Wp + Tp / 2} V${Dp + Tp / 2} H${-Tp / 2} Z" fill="none" stroke="${INK}" stroke-width="${Tp}" stroke-linejoin="round"/>`;
    // Furniture (closets and wall shelves first, they stand against the walls)
    const placed = pieces.filter(p => p.place);
    const order = p => (p.kind === 'closet' ? 0 : p.kind === 'wallshelf' ? 2 : 1);
    const dimFurniture = state.step === 1 || state.step === 2;
    placed.sort((a, b) => order(a) - order(b)).forEach(p => {
      const isWall = p.kind === 'closet';
      o += pieceArt(p, state.selected === p.id, dimFurniture && !(state.step === 2 && isWall));
    });
    // Doors, windows and light switches
    room.wallItems.forEach(it => { o += wallItemArt(room, it, state.selected === it.id); });
    // The stretch handle of whatever is picked
    const pickedItem = room.wallItems.find(it => it.id === state.selected);
    const pickedPiece = placed.find(p => p.id === state.selected);
    if (pickedItem) {
      const f = wallFrame(room, pickedItem.wall, pickedItem.pos);
      o += `<g transform="translate(${f.x * S} ${f.y * S}) rotate(${f.a})">${stretchHandle(itemW(pickedItem) * S / 2 + 6, S * 1.2, pickedItem.id)}</g>`;
    } else if (pickedPiece && Furniture.canStretch(pickedPiece)) {
      const W = Furniture.footprint(pickedPiece).w * S;
      const { x, y, rot } = pickedPiece.place;
      o += `<g transform="translate(${x * S} ${y * S}) rotate(${(rot || 0) * 90})">${stretchHandle(W / 2 + 6, 0, pickedPiece.id)}</g>`;
    }
    // Handles to stretch the room (step 1)
    if (state.step === 1) {
      const handle = (cx, cy, dim, arrow) =>
        `<g class="map-handle" data-map="handle" data-dim="${dim}" transform="translate(${cx} ${cy})">` +
        `<circle r="${S * 1.5}" fill="#ffd54a" ${line(3)}/>` +
        `<path d="${arrow}" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
      o += handle(Wp + Tp / 2, Dp / 2, 'w', 'M-14 0 H14 M-7 -7 L-14 0 L-7 7 M7 -7 L14 0 L7 7');
      o += handle(Wp / 2, Dp + Tp / 2, 'd', 'M0 -14 V14 M-7 -7 L0 -14 L7 -7 M-7 7 L0 14 L7 7');
    }
    o += '</g>';
    return `<svg id="map-svg" class="map-svg" viewBox="0 0 ${VW} ${VH}" xmlns="http://www.w3.org/2000/svg">${o}</svg>`;
  }

  // A small picture for the tray: the door, a window or the light switch.
  function itemIcon(type) {
    if (type === 'door') {
      return `<svg viewBox="0 0 60 60"><rect x="4" y="6" width="52" height="8" fill="${INK}"/><rect x="12" y="4" width="36" height="12" fill="#f3dfbf"/>` +
        `<path d="M12 10 L12 46 A36 36 0 0 0 48 10" fill="#fff8" stroke="${INK}" stroke-width="2" stroke-dasharray="5 4"/><rect x="9" y="10" width="6" height="36" rx="2" fill="#c98b5a" stroke="${INK}" stroke-width="2"/></svg>`;
    }
    if (type === 'window') {
      return `<svg viewBox="0 0 60 60"><rect x="6" y="10" width="48" height="40" rx="4" fill="#bfe8ff" stroke="${INK}" stroke-width="3"/><path d="M30 10 V50 M6 30 H54" stroke="${INK}" stroke-width="3"/></svg>`;
    }
    if (type === 'outlet') {
      const face = (cx, cy) => `<rect x="${cx - 9}" y="${cy - 9}" width="18" height="18" rx="6" fill="#eef1f5" ${line(1.6)}/><rect x="${cx - 5}" y="${cy - 5}" width="2.4" height="6" fill="${INK}"/><rect x="${cx + 2.6}" y="${cy - 5}" width="2.4" height="6" fill="${INK}"/><circle cx="${cx}" cy="${cy + 5}" r="1.8" fill="${INK}"/>`;
      return `<svg viewBox="0 0 60 60"><rect x="16" y="6" width="28" height="48" rx="7" fill="#fff" ${line(2.5)}/>${face(30, 19)}${face(30, 41)}</svg>`;
    }
    return `<svg viewBox="0 0 60 60"><rect x="8" y="8" width="30" height="44" rx="7" fill="#fff" ${line(2.5)}/><rect x="18" y="18" width="10" height="24" rx="3" fill="#eef1f5" ${line(1.8)}/><rect x="20" y="19" width="6" height="11" rx="2" fill="#fff" ${line(1.6)}/>` +
      `<g transform="translate(46 22)"><path d="M0 -10 C-8 -10 -11 -3 -8 2 C-6 5 -5 7 -5 10 L5 10 C5 7 6 5 8 2 C11 -3 8 -10 0 -10Z" fill="#ffd54a" ${line(2)}/><rect x="-4" y="10" width="8" height="5" rx="2" fill="#c9cfd8" ${line(1.6)}/></g></svg>`;
  }

  return { S, defaults, render, settle, settleWallItem, resize, halfSize, itemIcon, ITEM_W, itemW, wallLength, MIN, MAX, stretchItem, stretchPiece };
})();
