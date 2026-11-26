(() => {
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal');
  const S = Store;

  // Parent mode stays unlocked only while on the Rewards page.
  let parentUnlocked = false;

  // Shown small on the home screen, so it's easy to tell which copy of the app is open.
  const APP_VERSION = 21;

  // The person using the app right now (picked on "Who are you?").
  let currentId = null;

  // ---------- Small helpers ----------

  function esc(str) {
    return String(str ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function iconHtml(icon) {
    if (!icon) return '';
    if (icon.startsWith('<')) return `<span class="circle-art">${icon}</span>`;
    return `<span class="circle-emoji" aria-hidden="true">${icon}</span>`;
  }

  // A big round button with a picture and a small word under it.
  function circle({ href, act, id, icon, label, color, disabled, extraClass = '', badge = '' }) {
    const style = color ? `style="--circle-bg:${color}"` : '';
    const inner = `<span class="circle ${extraClass}" ${style}>${iconHtml(icon)}${badge}</span>` +
      (label ? `<span class="circle-label">${esc(label)}</span>` : '');
    if (disabled) {
      return `<button type="button" class="circle-item is-off" data-act="soon" aria-label="${esc(label)}, coming soon">${inner}` +
        `<span class="soon-badge" aria-hidden="true">⏳</span></button>`;
    }
    if (href) return `<a class="circle-item" href="${href}">${inner}</a>`;
    return `<button type="button" class="circle-item" data-act="${act}" ${id ? `data-id="${id}"` : ''}>${inner}</button>`;
  }

  function topBar(title, backHref, right = '') {
    return `<header class="top-bar">
      <a class="round-btn" href="${backHref}" aria-label="Back">⬅️</a>
      <h1 class="page-title">${esc(title)}</h1>
      <div class="top-right">${right}<a class="round-btn" href="#/" aria-label="Home">🏠</a></div>
    </header>`;
  }

  function saveOrWarn() {
    if (!S.save()) {
      alert('This device is out of space, so the last change could not be saved.');
      return false;
    }
    return true;
  }

  function wiggle(el) {
    if (!el) return;
    el.classList.remove('wiggle');
    void el.offsetWidth;
    el.classList.add('wiggle');
  }

  // ---------- Modal ----------

  function openModal(html) {
    $modal.innerHTML = `<div class="modal-card" role="dialog" aria-modal="true">${html}</div>`;
    $modal.hidden = false;
    document.body.classList.add('no-scroll');
  }

  function closeModal() {
    $modal.hidden = true;
    $modal.innerHTML = '';
    document.body.classList.remove('no-scroll');
  }

  function infoBox(icon, message) {
    openModal(`
      <div class="confirm-icon" aria-hidden="true">${icon}</div>
      <p class="confirm-text">${esc(message)}</p>
      <div class="confirm-row">
        <button type="button" class="big-btn yes" data-act="modal-close" aria-label="OK">👍</button>
      </div>`);
  }

  let confirmYes = null;
  function confirmBox(icon, message, onYes) {
    confirmYes = onYes;
    openModal(`
      <div class="confirm-icon" aria-hidden="true">${icon}</div>
      <p class="confirm-text">${esc(message)}</p>
      <div class="confirm-row">
        <button type="button" class="big-btn no" data-act="confirm-no" aria-label="No">✖️</button>
        <button type="button" class="big-btn yes" data-act="confirm-yes" aria-label="Yes">✔️</button>
      </div>`);
  }

  // ---------- People and stickers ----------

  function currentPerson() {
    return S.data.people.find(p => p.id === currentId) || null;
  }

  function stickerById(id) {
    return S.data.stickers.find(s => s.id === id) || null;
  }

  function personSticker(p) {
    return stickerById(p.stickerId) || Stickers.DEFAULTS.person;
  }

  // Who is using this sticker (each sticker belongs to at most one person).
  function ownerOf(stickerId) {
    return S.data.people.find(p => p.stickerId === stickerId) || null;
  }

  // Two stickers look the same if every choice matches.
  function lookKey(s) {
    return JSON.stringify(Object.keys(s).filter(k => k !== 'id').sort().map(k => [k, s[k]]));
  }

  function lockButton() {
    return parentUnlocked
      ? `<button type="button" class="round-btn parent-on" data-act="lock" aria-label="Lock parent mode">🔓</button>`
      : `<button type="button" class="round-btn" data-act="unlock" aria-label="Parent mode">🔒</button>`;
  }

  function parentBanner() {
    return parentUnlocked ? `<div class="parent-banner">Parent mode is on. Tap 🔓 to lock it.</div>` : '';
  }

  // ---------- Who are you? (first screen) ----------

  function renderWho() {
    const people = S.data.people.map(p => `
      <div class="who-item">
        ${circle({ act: 'pick-profile', id: p.id, icon: Stickers.render(personSticker(p)), label: p.name || '', extraClass: 'sticker-circle' })}
        <a class="pencil-btn" href="#/people/${p.id}" aria-label="Change ${esc(p.name || 'this')} sticker">✏️</a>
      </div>`).join('');
    $app.innerHTML = `
      <header class="home-head">
        <h1 class="logo">Messy Room</h1>
        <p class="who-title"><span aria-hidden="true">👋</span> Who are you?</p>
      </header>
      <main class="circle-grid">
        ${people}
        ${circle({ href: '#/people/new', icon: '➕', label: 'New', color: 'var(--c-stickers)', extraClass: 'add-circle' })}
      </main>`;
  }

  // ---------- Home ----------

  function renderHome() {
    const me = currentPerson();
    const mine = Stickers.render(personSticker(me));
    $app.innerHTML = `
      <header class="home-head">
        <a class="me-chip" href="#/who" aria-label="Switch person">
          <span class="me-sticker">${mine}</span>
          <span class="me-switch" aria-hidden="true">🔄</span>
        </a>
        <h1 class="logo">Messy Room</h1>
        <button type="button" class="round-btn home-settings" data-act="open-backup" aria-label="Backup and restore (parent)"><span aria-hidden="true">⚙️</span><span class="lock-mini" aria-hidden="true">🔒</span></button>
      </header>
      <main class="circle-grid home-grid">
        ${circle({ href: '#/rooms', icon: '🏠', label: 'Rooms', color: 'var(--c-rooms)' })}
        ${circle({ href: `#/people/${me.id}`, icon: mine, label: 'Stickers', color: 'var(--c-stickers)', extraClass: 'sticker-circle' })}
        ${circle({ href: '#/rewards', icon: '🎁', label: 'Rewards', color: 'var(--c-rewards)' })}
        ${circle({ href: '#/clean', icon: '🧽', label: 'Clean', color: 'var(--c-clean)' })}
        ${circle({ href: '#/things', icon: '🧸', label: 'Things', color: 'var(--c-things)' })}
        ${circle({ href: '#/today', icon: '📋', label: 'Today', color: 'var(--c-today)' })}
      </main>
      <p class="app-version">Version ${APP_VERSION}</p>`;
  }

  // ---------- Rooms ----------

  function renderRooms() {
    $app.innerHTML = `
      ${topBar('Rooms', '#/')}
      <main class="circle-grid">
        ${circle({ href: '#/rooms/my-room', icon: '🛏️', label: 'My Room', color: 'var(--c-rooms)' })}
        ${circle({ icon: '🛁', label: 'Bathroom', disabled: true })}
        ${circle({ icon: '🛋️', label: 'Living Room', disabled: true })}
        ${circle({ icon: '🍳', label: 'Kitchen', disabled: true })}
      </main>`;
  }

  // ---------- My Room: furniture ----------
  // Step A: pick furniture and shape it to match the real piece (front view).
  // The map from above (Step B) comes next.

  function room() {
    if (!S.data.rooms) S.data.rooms = {};
    if (!S.data.rooms['my-room']) S.data.rooms['my-room'] = { pieces: [] };
    return S.data.rooms['my-room'];
  }

  function pieceById(id) {
    return room().pieces.find(p => p.id === id) || null;
  }

  // Where a piece goes back to: its closet, the door or closet it hangs on, or the map or list.
  function pieceBack(p) {
    if (!p) return pieceReturn;
    if (p.hangOn) return hangBack(p.hangOn);
    if (p.insideId && pieceById(p.insideId)) return `#/rooms/my-room/piece/${p.insideId}`;
    return pieceReturn;
  }

  function hangBack(targetId) {
    if (room().wallItems && room().wallItems.some(it => it.id === targetId)) return `#/rooms/my-room/door/${targetId}`;
    if (pieceById(targetId)) return `#/rooms/my-room/piece/${targetId}/outside`;
    return '#/rooms/my-room';
  }

  // A room door from the front: things hang on it (a pocket organizer, hooks).
  let pageDoorId = null;
  function renderDoorPage(id) {
    const r = RoomMap.defaults(room());
    const door = r.wallItems.find(it => it.id === id && it.type === 'door');
    if (!door) { location.replace('#/rooms/my-room'); return; }
    pageDoorId = id;
    const current = door.color || '#ffffff';
    $app.innerHTML = `
      ${topBar(door.label || '', '#/rooms/my-room')}
      <main class="piece-page">
        <div class="piece-stage">${Furniture.renderDoor(door, piecesHungOn(id), { interactive: true, addHang: true })}</div>
        <section class="opt-row">
          <h2 class="opt-head"><span aria-hidden="true">🎨</span></h2>
          <div class="opt-choices">${swatches(current, 'door-color')}</div>
        </section>
        <section class="opt-row">
          <h2 class="opt-head"><span aria-hidden="true">🏷️</span> Label (optional)</h2>
          <input class="text-input" id="door-label" type="text" maxlength="24" value="${esc(door.label || '')}" placeholder="Like: Bathroom">
        </section>
        <div class="action-row">
          <button type="button" class="save-btn" data-act="door-save"><span aria-hidden="true">✔️</span> Save</button>
        </div>
      </main>`;
  }

  // A row of color circles, plus ➕ for the big color picker. A color picked there shows in the row too.
  function swatches(current, act) {
    const list = Furniture.COLORS.includes(current) || !current ? Furniture.COLORS : [...Furniture.COLORS, current];
    return list.map(c =>
      `<button type="button" class="swatch ${current === c ? 'picked' : ''}" style="--swatch:${c}" data-act="${act}" data-value="${c}" aria-label="Color" aria-pressed="${current === c}"></button>`).join('') +
      `<button type="button" class="swatch more-colors" data-act="color-picker" data-for="${act}" aria-label="More colors"><span aria-hidden="true">➕</span></button>`;
  }

  // The big color picker: a grid of color squares, no sliders.
  const PICKER = (() => {
    const hsl = (h, s, l) => {
      s /= 100; l /= 100;
      const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
      return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('');
    };
    const hues = [0, 15, 30, 45, 60, 90, 130, 165, 190, 210, 235, 265, 290, 320, 340];
    // One row per color family, light to dark
    const rows = hues.map(h => [[90, 88], [85, 76], [80, 64], [70, 52], [60, 40], [55, 28]].map(([s, l]) => hsl(h, s, l)));
    const browns = ['#f6ead8', '#ead2b0', '#d9b98a', '#c9a57a', '#b08050', '#8a6a5a', '#6b4a3a', '#4a3226'];
    const grays = ['#ffffff', '#eef1f5', '#d5dbe3', '#b8c0cc', '#9aa7b8', '#6b7686', '#4a4a5a', '#2a2a32'];
    return [...rows, browns, grays];
  })();
  let pickerFor = null;

  let pickerKey = null;
  function openColorPicker(act, key) {
    pickerFor = act;
    pickerKey = key || null;
    openModal(`
      <div class="color-grid">
        ${PICKER.map(row => `<div class="color-row ${row.length > 6 ? 'wide' : ''}">${row.map(c => `<button type="button" class="color-box" style="--swatch:${c}" data-act="pick-color" data-value="${c}" aria-label="Color"></button>`).join('')}</div>`).join('')}
      </div>
      <div class="confirm-row"><button type="button" class="big-btn no" data-act="modal-close" aria-label="Close">✖️</button></div>`);
  }

  // Things hanging on a door or on a closet's doors.
  function piecesHungOn(id) {
    return room().pieces.filter(p => p.hangOn === id);
  }

  // Pieces standing on a closet's floor.
  function piecesIn(closetId) {
    return room().pieces.filter(p => p.insideId === closetId);
  }

  function pieceCard(p, act = 'open-piece') {
    const inside = p.kind === 'closet' ? piecesIn(p.id) : [];
    return `<button type="button" class="furn-card" data-act="${act}" data-id="${p.id}" aria-label="${esc(p.label || 'Open')}">
      <span class="furn-pic">${Furniture.render(p, { inside })}</span>
      ${p.label ? `<span class="furn-label">${esc(p.label)}</span>` : ''}
    </button>`;
  }

  function renderFurnitureList() {
    pieceReturn = '#/rooms/my-room/furniture';
    const pieces = room().pieces.filter(p => !p.insideId);
    $app.innerHTML = `
      ${topBar('', '#/rooms/my-room')}
      <main>
        <div class="furn-grid">
          <a class="furn-card add-card" href="#/rooms/my-room/add" aria-label="Add furniture">
            <span class="add-plus" aria-hidden="true">➕</span>
          </a>
          ${pieces.map(p => pieceCard(p)).join('')}
        </div>
      </main>`;
  }

  // ---------- My Room: the map from above ----------
  // 1 📐 room size, 2 🚪 door, closet, windows and light switch, 3 🛏️ furniture.

  let mapStep = null;
  let mapSelected = null;
  let drag = null;

  const mapPieces = () => room().pieces.filter(p => !p.insideId && !p.hangOn && p.kind !== 'pockets' && !(p.kind === 'hooks' && p.sub === 'overdoor'));
  const isWallPiece = p => p.kind === 'closet';

  function firstStep(r) {
    if (!r.sizeSet) return 1;
    if (!r.wallItems.some(it => it.type === 'door')) return 2;
    return 3;
  }

  function rotateIcon() {
    return `<svg viewBox="0 0 60 60" aria-hidden="true"><path d="M18 36 A16 16 0 1 1 34 46" fill="none" stroke="#3a2a2a" stroke-width="6" stroke-linecap="round"/><path d="M8 30 L18 40 L28 30" fill="none" stroke="#3a2a2a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  function renderMap() {
    pieceReturn = '#/rooms/my-room';
    const r = RoomMap.defaults(room());
    if (mapStep == null) mapStep = firstStep(r);
    const steps = [[1, '📐', 'Room size'], [2, '🚪', 'Door, closet, windows'], [3, '🛏️', 'Furniture']].map(([n, icon, label]) =>
      `<button type="button" class="step-btn ${mapStep === n ? 'on' : ''}" data-act="map-step" data-value="${n}" aria-label="${label}" aria-pressed="${mapStep === n}">
        <span class="step-pic" aria-hidden="true">${icon}</span><span class="step-n" aria-hidden="true">${n}</span></button>`).join('<span class="step-line" aria-hidden="true"></span>');
    $app.innerHTML = `
      ${topBar('My Room', '#/rooms', `<a class="round-btn" href="#/rooms/my-room/furniture" aria-label="All furniture">🧰</a>`)}
      <main class="map-page">
        <div class="map-head">
          <div class="map-steps">${steps}</div>
          <button type="button" class="rotate-btn" data-act="map-rotate" aria-label="Turn the room">${rotateIcon()}</button>
        </div>
        <div class="map-area">
          <div id="map-wrap" class="map-wrap">${RoomMap.render(r, mapPieces(), { step: mapStep, selected: mapSelected })}</div>
        </div>
        <div id="map-below">${mapBelow()}</div>
      </main>`;
  }

  // Tools under the map: what's picked, or what this step needs.
  function mapBelow() {
    const r = room();
    const sel = mapSelected && (r.wallItems.find(it => it.id === mapSelected) || mapPieces().find(p => p.id === mapSelected && p.place));
    if (sel) {
      const isItem = !!sel.type && !sel.kind;
      const wide = isItem || Furniture.canStretch(sel)
        ? `<div class="step-group"><span class="step-icon" aria-hidden="true">↔️</span>${stepBtn('map-stretch', '➖', 'Narrower', 'data-dir="-1"')}${stepBtn('map-stretch', '➕', 'Wider', 'data-dir="1"')}</div>` : '';
      const deep = !isItem && Furniture.canDeepen(sel)
        ? `<div class="step-group"><span class="step-icon" aria-hidden="true">⤵️</span>${stepBtn('map-depth', '➖', 'Less deep', 'data-dir="-1"')}${stepBtn('map-depth', '➕', 'Deeper', 'data-dir="1"')}</div>` : '';
      const tools = (isItem
        ? (sel.type === 'door' ? stepBtn('map-flip', '🔄', 'Swing the door the other way') + stepBtn('map-open-door', '👀', 'Open the door to hang things on it') : '') + stepBtn('map-remove', '🗑️', 'Take it away')
        : (sel.kind === 'closet' ? '' : stepBtn('map-turn', '🔄', 'Turn it')) + stepBtn('map-open', '👀', 'Open it') + stepBtn('map-unplace', '↩️', 'Take it off the map')) + wide + deep;
      return `<div class="map-tools">${tools}${stepBtn('map-deselect', '✔️', 'Done')}</div>`;
    }
    if (mapStep === 1) {
      return `<div class="map-tools">
        <div class="step-group"><span class="step-icon" aria-hidden="true">↔️</span>${stepBtn('map-size', '➖', 'Narrower room', 'data-dim="w" data-dir="-1"')}${stepBtn('map-size', '➕', 'Wider room', 'data-dim="w" data-dir="1"')}</div>
        <div class="step-group"><span class="step-icon" aria-hidden="true">↕️</span>${stepBtn('map-size', '➖', 'Shorter room', 'data-dim="d" data-dir="-1"')}${stepBtn('map-size', '➕', 'Longer room', 'data-dim="d" data-dir="1"')}</div>
        <button type="button" class="big-btn yes" data-act="map-next" aria-label="Next">➡️</button>
      </div>`;
    }
    const tray = [];
    if (mapStep === 2) {
      ['door', 'window', 'switch', 'outlet'].forEach(t => {
        tray.push(`<div class="tray-item" data-tray="${t}" role="button" aria-label="${t}">${RoomMap.itemIcon(t)}</div>`);
      });
      mapPieces().filter(p => isWallPiece(p) && !p.place).forEach(p => {
        tray.push(`<div class="tray-item piece" data-tray="piece" data-id="${p.id}" role="button" aria-label="Closet">${Furniture.renderTop(p, 8)}</div>`);
      });
      // A new closet is built first, then it waits here to go on its wall.
      tray.splice(4, 0, `<a class="tray-item new-closet" href="#/rooms/my-room/add-closet" aria-label="Make a closet">${Furniture.doorIcon('bifold')}<span class="plus-badge" aria-hidden="true">➕</span></a>`);
    } else {
      mapPieces().filter(p => !isWallPiece(p) && !p.place).forEach(p => {
        tray.push(`<div class="tray-item piece" data-tray="piece" data-id="${p.id}" role="button" aria-label="${esc(p.label || 'Furniture')}">${Furniture.renderTop(p, 8)}</div>`);
      });
    }
    const add = mapStep === 2 ? '' : `<a class="tray-item add" href="#/rooms/my-room/add" aria-label="Make furniture">➕</a>`;
    const hasDoor = r.wallItems.some(it => it.type === 'door');
    const next = mapStep === 2 && hasDoor
      ? `<button type="button" class="big-btn yes" data-act="map-next" aria-label="Next">➡️</button>` : '';
    return `<div class="map-tray">${tray.join('')}${add}</div>${next ? `<div class="action-row">${next}</div>` : ''}`;
  }

  function drawMapOnly() {
    const wrap = document.getElementById('map-wrap');
    if (wrap) wrap.innerHTML = RoomMap.render(room(), mapPieces(), { step: mapStep, selected: mapSelected });
  }

  function drawMapAll() {
    drawMapOnly();
    const below = document.getElementById('map-below');
    if (below) below.innerHTML = mapBelow();
  }

  // Where a finger is, in room units.
  function toRoom(e) {
    const g = document.getElementById('room-g');
    if (!g) return null;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(g.getScreenCTM().inverse());
    return { x: pt.x / RoomMap.S, y: pt.y / RoomMap.S };
  }

  function canDrag(kind, obj) {
    if (mapStep === 1) return kind === 'handle';
    if (kind === 'handle') return false;
    if (mapStep === 2) return kind === 'wall' || (kind === 'piece' && isWallPiece(obj));
    return true;
  }

  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('#map-wrap [data-map], [data-tray]');
    if (!el || drag) return;
    const r = room();
    let d = null;
    if (el.dataset.tray === 'catalog') {
      d = { kind: 'new-catalog', key: el.dataset.key, el };
    } else if (el.dataset.tray) {
      d = { kind: el.dataset.tray === 'piece' ? 'new-piece' : 'new-wall', type: el.dataset.tray, id: el.dataset.id, el };
    } else if (el.dataset.map === 'stretch') {
      const item = r.wallItems.find(it => it.id === el.dataset.id);
      d = { kind: 'stretch', id: el.dataset.id, item, piece: item ? null : pieceById(el.dataset.id) };
    } else if (el.dataset.map === 'handle') {
      d = { kind: 'handle', dim: el.dataset.dim };
    } else if (el.dataset.map === 'wall') {
      d = { kind: 'wall', id: el.dataset.id, item: r.wallItems.find(it => it.id === el.dataset.id) };
    } else if (el.dataset.map === 'piece') {
      const p = pieceById(el.dataset.id);
      d = { kind: 'piece', id: el.dataset.id, piece: p };
    }
    if (!d) return;
    const dragKind = { 'new-piece': 'piece', 'new-wall': 'wall', 'new-catalog': 'wall', stretch: d.item ? 'wall' : 'piece' }[d.kind] || d.kind;
    d.allowed = d.kind === 'new-catalog' ? mapStep !== 1 : canDrag(dragKind, d.piece || (d.id && pieceById(d.id)));
    d.x0 = e.clientX;
    d.y0 = e.clientY;
    d.moved = false;
    if (d.kind === 'piece' && d.piece && d.piece.place && !isWallPiece(d.piece)) {
      const pt = toRoom(e);
      d.off = { x: pt.x - d.piece.place.x, y: pt.y - d.piece.place.y };
    }
    drag = d;
    e.preventDefault();
  });

  let dragFrame = 0;
  document.addEventListener('pointermove', e => {
    if (!drag || !drag.allowed) return;
    if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
    drag.moved = true;
    const pt = toRoom(e);
    if (!pt) return;
    const r = room();
    if (drag.kind === 'new-catalog') {
      const p = Furniture.make(drag.key);
      r.pieces.push(p);
      drag.id = p.id;
      drag.kind = 'new-piece';
    }
    if (drag.kind === 'new-piece') {
      drag.piece = pieceById(drag.id);
      if (!drag.piece) { drag = null; return; }
      if (isWallPiece(drag.piece)) RoomMap.placeCloset(r, drag.piece, pt.x, pt.y);
      else drag.piece.place = { x: pt.x, y: pt.y, rot: 0 };
      drag.off = { x: 0, y: 0 };
      drag.kind = 'piece';
      mapSelected = null;
      drag.el.classList.add('lifted');
    } else if (drag.kind === 'new-wall') {
      drag.item = { id: S.uid(), type: drag.type, wall: 2, pos: 0, flip: false };
      r.wallItems.push(drag.item);
      drag.kind = 'wall';
      mapSelected = null;
    }
    if (drag.kind === 'stretch') {
      if (drag.item) RoomMap.stretchItem(r, drag.item, pt.x, pt.y);
      else if (drag.piece && drag.piece.place) RoomMap.stretchPiece(r, drag.piece, pt.x, pt.y);
    } else if (drag.kind === 'handle') {
      RoomMap.resize(r, drag.dim, drag.dim === 'w' ? pt.x : pt.y, mapPieces());
    } else if (drag.kind === 'piece' && isWallPiece(drag.piece)) {
      RoomMap.placeCloset(r, drag.piece, pt.x, pt.y);
    } else if (drag.kind === 'piece') {
      drag.piece.place.x = pt.x - drag.off.x;
      drag.piece.place.y = pt.y - drag.off.y;
    } else if (drag.kind === 'wall') {
      RoomMap.settleWallItem(r, drag.item, pt.x, pt.y);
    }
    drag.last = pt;
    if (!dragFrame) dragFrame = requestAnimationFrame(() => { dragFrame = 0; drawMapOnly(); });
  });

  // Far outside the walls means "take it off the map".
  function farOutside(r, pt, m = 2.5) {
    return !pt || pt.x < -m || pt.y < -m || pt.x > r.size.w + m || pt.y > r.size.d + m;
  }

  document.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag;
    drag = null;
    const r = room();
    if (!d.moved) {
      // A tap: pick it, or put a tray item straight into the room.
      if (d.kind === 'new-catalog' && d.allowed) {
        const p = Furniture.make(d.key);
        r.pieces.push(p);
        p.place = { x: r.size.w / 2, y: 0, rot: 0 };
        RoomMap.settle(r, p);
        mapSelected = p.id;
      } else if (d.kind === 'new-piece' && d.allowed) {
        const p = pieceById(d.id);
        if (p) {
          if (isWallPiece(p)) RoomMap.placeCloset(r, p, r.size.w / 2, 0);
          else { p.place = { x: r.size.w / 2, y: r.size.d / 2, rot: 0 }; RoomMap.settle(r, p); }
          mapSelected = p.id;
        }
      } else if (d.kind === 'new-wall' && d.allowed) {
        const it = { id: S.uid(), type: d.type, wall: 2, pos: r.size.w / 2, flip: false };
        RoomMap.settleWallItem(r, it);
        r.wallItems.push(it);
        mapSelected = it.id;
      } else if (d.kind === 'piece' || d.kind === 'wall') {
        mapSelected = mapSelected === d.id ? null : d.id;
      } else {
        return;
      }
      saveOrWarn();
      Effects.pop();
      drawMapAll();
      return;
    }
    const pt = toRoom(e) || d.last;
    if (d.kind === 'piece') {
      const far = isWallPiece(d.piece) ? farOutside(r, pt, 6) : farOutside(r, pt);
      if (far) delete d.piece.place;
      else RoomMap.settle(r, d.piece);
    } else if (d.kind === 'wall') {
      if (farOutside(r, pt)) r.wallItems = r.wallItems.filter(it => it !== d.item);
    }
    saveOrWarn();
    Effects.pop();
    drawMapAll();
  });

  document.addEventListener('pointercancel', () => { drag = null; });

  // Ready-made pieces, shown as pictures.
  // mode: 'room' (furniture), 'floor' (pieces that stand on a closet floor), 'closets' (closets only)
  function renderCatalog(mode, targetId) {
    const closet = mode === 'floor' ? pieceById(targetId) : null;
    if (mode === 'floor' && !closet) { location.replace('#/rooms/my-room'); return; }
    const back = closet ? `#/rooms/my-room/piece/${closet.id}` : mode === 'hang' ? hangBack(targetId) : pieceReturn;
    catalogHang = mode === 'hang' ? targetId : null;
    const groups = Furniture.GROUPS.map(g => {
      if (mode === 'closets' ? g.key !== 'closet' : g.key === 'closet') return '';
      const items = Furniture.CATALOG.filter(c => c.group === g.key)
        .filter(c => mode === 'hang' ? (c.where === 'door' || c.where === 'both') : c.where !== 'door')
        .map(c => ({ c, p: c.make() }))
        .filter(x => mode !== 'floor' || Furniture.fitsInCloset(x.p));
      if (!items.length) return '';
      return `<section class="opt-row">
        <h2 class="opt-head"><span aria-hidden="true">${g.icon}</span> ${g.label}</h2>
        <div class="catalog-row">
          ${items.map(({ c, p }) => `<button type="button" class="furn-card small" data-act="add-piece" data-key="${c.key}" aria-label="${g.label}">
            <span class="furn-pic">${Furniture.render(p)}</span></button>`).join('')}
        </div>
      </section>`;
    }).join('');
    catalogCloset = closet ? closet.id : null;
    $app.innerHTML = `${topBar('', back)}<main>${groups}</main>`;
  }

  let catalogCloset = null;
  let catalogHang = null;      // door or closet that new pieces hang on
  let closetOutside = false;   // the closet page is showing the outside of its doors
  let pieceReturn = '#/rooms/my-room';
  let partsMode = false;     // "change the parts" is open
  let selectedPart = null;   // part picked while changing the parts
  let pagePieceId = null;

  // Removing or changing a space that already has things assigned needs the parent PIN.
  function guardUsed(used, fn) {
    if (used) askPin(fn); else fn();
  }

  function renderPiece(id, outside = false) {
    const p = pieceById(id);
    if (!p) { location.replace('#/rooms/my-room'); return; }
    if (pagePieceId !== id || outside) { partsMode = false; selectedPart = null; closetOutside = outside; }
    pagePieceId = id;
    const back = pieceBack(p);
    const inside = p.kind === 'closet' ? piecesIn(p.id) : [];
    const canChange = Furniture.hasParts(p) || ['closet', 'wallshelf', 'pockets'].includes(p.kind) || (p.kind === 'hooks' && p.count > 1);
    const pic = Furniture.render(p, {
      interactive: true,
      selected: partsMode ? selectedPart : null,
      inside,
      addInside: p.kind === 'closet' && !closetOutside,
      pickSection: partsMode && p.kind === 'closet' && !closetOutside,
      outside: p.kind === 'closet' && closetOutside,
      hung: p.kind === 'closet' ? piecesHungOn(p.id) : [],
      addHang: p.kind === 'closet' && closetOutside,
      marks: marksFor(p),
    });
    // On the outside of a closet, the colors are for its doors.
    const current = p.kind === 'closet' && closetOutside ? p.doorColor : p.color;
    const colors = swatches(current, 'piece-color');
    $app.innerHTML = `
      ${topBar(p.label || '', back, `<button type="button" class="round-btn save-top" data-act="piece-save" aria-label="Save">✔️</button>`)}
      <main class="piece-page">
        <div class="piece-stage ${p.kind === 'closet' ? 'wide' : ''} ${hasCubbies(p) ? 'drag-stage' : ''}">${pic}</div>
        <div class="piece-tools">
          ${p.kind === 'closet' && p.doors !== 'none' ? `<button type="button" class="round-btn big-door ${closetOutside ? 'on' : ''}" data-act="closet-side" aria-label="${closetOutside ? 'Open the closet' : 'Close the doors'}" aria-pressed="${closetOutside}">🚪</button>` : ''}
          ${canChange ? `<button type="button" class="round-btn ${partsMode ? 'on' : ''}" data-act="parts-mode" aria-label="Change the parts" aria-pressed="${partsMode}">🔧</button>` : ''}
          <button type="button" class="round-btn" data-act="piece-delete" aria-label="Delete">🗑️</button>
        </div>
        ${whoseRow(p)}
        ${basketRow(p)}
        ${sizeRow(p)}
        ${partsMode ? partsPanel(p) : ''}
        <section class="opt-row">
          <h2 class="opt-head"><span aria-hidden="true">🎨</span></h2>
          <div class="opt-choices">${colors}</div>
        </section>
        <section class="opt-row">
          <h2 class="opt-head"><span aria-hidden="true">🏷️</span> Label (optional)</h2>
          <input class="text-input" id="piece-label" type="text" maxlength="24" value="${esc(p.label)}" placeholder="Label">
        </section>
        <div class="action-row">
          <button type="button" class="save-btn" data-act="piece-save"><span aria-hidden="true">✔️</span> Save</button>
        </div>
      </main>`;
  }

  const stepBtn = (act, icon, label, extra = '') =>
    `<button type="button" class="tool-btn step" data-act="${act}" ${extra} aria-label="${label}">${icon}</button>`;

  // ---------- Baskets: drag to move, add or take out ----------

  const hasCubbies = p => Furniture.hasParts(p) && p.style !== 'plastic' && p.cols.some(c => c.cells.some(k => k.type === 'open'));

  function basketRow(p) {
    if (!hasCubbies(p)) return '';
    const chip = v => `<div class="basket-chip" data-basket="${v}" role="button" aria-label="${v === 'bin' ? 'Drag a bin into a cubby' : v === 'sorter' ? 'Drag a paper sorter into a cubby' : 'Drag paper drawers into a cubby'}">${Furniture.partIcon('open', v)}</div>`;
    return `<section class="opt-row basket-row">
      <div class="basket-chips">${chip('bin')}${chip('sorter')}${chip('drawers')}</div>
      <div class="basket-out" data-drop="out" aria-label="Drop here to take it out"><span aria-hidden="true">🗑️</span></div>
    </section>`;
  }

  let basketDrag = null;
  let suppressClick = false;

  function cellUnder(x, y) {
    const hit = document.elementFromPoint(x, y);
    if (!hit) return null;
    if (hit.closest('[data-drop="out"]')) return { out: true };
    const g = hit.closest('.piece-stage g.fpart[data-act="part"]');
    if (!g) return null;
    const p = pieceById(pagePieceId);
    const k = p && Furniture.findCell(p, g.dataset.id);
    return k && k.type === 'open' && k.id === g.dataset.id ? { cell: k, g } : null;
  }

  function markDrop(target) {
    document.querySelectorAll('.drop-ok').forEach(el => el.classList.remove('drop-ok'));
    if (target && target.g) target.g.classList.add('drop-ok');
    if (target && target.out) document.querySelector('[data-drop="out"]').classList.add('drop-ok');
  }

  // What travels with a basket when it moves: the basket and anything kept in it.
  const BASKET_KEYS = ['insert', 'binColor', 'count', 'spots', 'holds', 'owners'];

  function swapBaskets(a, b) {
    BASKET_KEYS.forEach(key => {
      const t = a[key];
      if (b[key] === undefined) delete a[key]; else a[key] = b[key];
      if (t === undefined) delete b[key]; else b[key] = t;
    });
    if (!a.insert) a.insert = 'empty';
    if (!b.insert) b.insert = 'empty';
  }

  document.addEventListener('pointerdown', e => {
    const chip = e.target.closest('[data-basket]');
    const g = e.target.closest('.piece-stage g.fpart[data-act="part"]');
    if (!chip && !g) return;
    const p = pieceById(pagePieceId);
    if (!p || !hasCubbies(p)) return;
    let from = null, insert, color;
    if (chip) {
      insert = chip.dataset.basket;
      color = insert === 'drawers' ? '#3d4a45' : Furniture.BIN_COLORS[1];
    } else {
      const k = Furniture.findCell(p, g.dataset.id);
      if (!k || k.type !== 'open' || k.id !== g.dataset.id || k.insert === 'empty') return;
      from = k;
      insert = k.insert;
      color = k.binColor;
    }
    basketDrag = { from, insert, color, x0: e.clientX, y0: e.clientY, moved: false, ghost: null };
    if (chip) e.preventDefault();
  });

  document.addEventListener('pointermove', e => {
    const d = basketDrag;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8) return;
    if (!d.moved) {
      d.moved = true;
      d.ghost = document.createElement('div');
      d.ghost.className = 'basket-ghost';
      d.ghost.innerHTML = Furniture.partIcon('open', d.insert).replace('#8fd3ff', d.insert === 'bin' ? d.color : '#8fd3ff').replace('#3d4a45', d.color || '#3d4a45');
      document.body.appendChild(d.ghost);
      document.body.classList.add('dragging-basket');
    }
    e.preventDefault();
    d.ghost.style.left = `${e.clientX}px`;
    d.ghost.style.top = `${e.clientY}px`;
    markDrop(cellUnder(e.clientX, e.clientY));
  }, { passive: false });

  document.addEventListener('pointerup', e => {
    const d = basketDrag;
    basketDrag = null;
    if (!d || !d.moved) return;
    d.ghost.remove();
    document.body.classList.remove('dragging-basket');
    markDrop(null);
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    const target = cellUnder(e.clientX, e.clientY);
    if (!target) return;
    const p = pieceById(pagePieceId);
    const done = () => { saveOrWarn(); Effects.pop(); redrawPiece(); };
    if (target.out) {
      if (!d.from) return;
      guardUsed(Furniture.cellUsed(d.from), () => { Furniture.setInsert(d.from, 'empty'); done(); });
      return;
    }
    const to = target.cell;
    if (d.from) {
      if (to === d.from) return;
      swapBaskets(d.from, to);
      done();
      return;
    }
    // A new basket from the row: it goes in, and anything already there comes out.
    guardUsed(to.insert !== 'empty' && Furniture.cellUsed(to), () => {
      Furniture.setInsert(to, d.insert);
      to.binColor = d.color;
      done();
    });
  });

  document.addEventListener('pointercancel', () => {
    if (!basketDrag) return;
    if (basketDrag.ghost) basketDrag.ghost.remove();
    document.body.classList.remove('dragging-basket');
    markDrop(null);
    basketDrag = null;
  });

  // Bigger or smaller: always showing on pieces that can change size.
  function sizeRow(p) {
    // Hooks and pocket organizers get bigger or smaller as a whole.
    if (p.kind === 'pockets' || p.kind === 'hooks') {
      return `<section class="opt-row size-row"><h2 class="opt-head">Size</h2><div class="opt-choices">
        <div class="step-group"><span class="step-icon" aria-hidden="true">🔍</span>${stepBtn('size-scale', '➖', 'Smaller', 'data-dir="-1"')}${stepBtn('size-scale', '➕', 'Bigger', 'data-dir="1"')}</div>
      </div></section>`;
    }
    const wide = Furniture.canStretch(p);
    const tall = p.kind !== 'wallshelf' && p.kind !== 'closet';
    return `<section class="opt-row size-row"><h2 class="opt-head">Size</h2><div class="opt-choices">
      ${wide ? `<div class="step-group"><span class="step-icon" aria-hidden="true">↔️</span>${stepBtn('size', '➖', 'Narrower', 'data-dim="w" data-dir="-1"')}${stepBtn('size', '➕', 'Wider', 'data-dim="w" data-dir="1"')}</div>` : ''}
      ${tall ? `<div class="step-group"><span class="step-icon" aria-hidden="true">↕️</span>${stepBtn('size', '➖', 'Shorter', 'data-dim="h" data-dir="-1"')}${stepBtn('size', '➕', 'Taller', 'data-dim="h" data-dir="1"')}</div>` : ''}
    </div></section>`;
  }

  function partsPanel(p) {
    const rows = [];

    if (p.kind === 'closet') {
      Furniture.fixCloset(p);
      const doorPicks = Furniture.DOOR_KINDS.map(k =>
        `<button type="button" class="pick small square ${p.doors === k ? 'picked' : ''}" data-act="closet-doors" data-value="${k}" aria-label="Doors ${k}" aria-pressed="${p.doors === k}">${Furniture.doorIcon(k)}</button>`).join('');
      rows.push(`<section class="opt-row"><h2 class="opt-head">Doors</h2><div class="opt-choices">${doorPicks}</div></section>`);
      rows.push(`<section class="opt-row"><h2 class="opt-head">Top shelf</h2><div class="opt-choices">
        <div class="step-group"><span class="step-num">${p.shelves.length}</span>${stepBtn('closet-shelves', '➖', 'Fewer top shelves', 'data-dir="-1"')}${stepBtn('closet-shelves', '➕', 'More top shelves', 'data-dir="1"')}</div></div></section>`);
      rows.push(`<section class="opt-row"><h2 class="opt-head">Sections</h2><div class="opt-choices">
        <div class="step-group"><span class="step-num">${p.sections.length}</span>${stepBtn('sections', '➖', 'Fewer sections', 'data-dir="-1"')}${stepBtn('sections', '➕', 'More sections', 'data-dir="1"')}</div></div></section>`);
      const sec = selectedPart && Furniture.findSection(p, selectedPart);
      if (!sec) {
        rows.push(`<p class="parts-hint"><span aria-hidden="true">👆</span> Tap a section to change it</p>`);
      } else {
        const kinds = [['high', 'One high rod'], ['low', 'One low rod'], ['two', 'Two rods'], ['shelves', 'Shelves']].map(([k, label]) =>
          `<button type="button" class="pick small square ${sec.kind === k ? 'picked' : ''}" data-act="section-kind" data-value="${k}" aria-label="${label}" aria-pressed="${sec.kind === k}">${Furniture.sectionIcon(k)}</button>`).join('');
        rows.push(`<section class="opt-row"><h2 class="opt-head">This section</h2><div class="opt-choices">${kinds}</div></section>`);
        const more = sec.kind === 'shelves'
          ? `<div class="step-group"><span class="step-num">${sec.shelves.length}</span>${stepBtn('section-shelves', '➖', 'Fewer shelves', 'data-dir="-1"')}${stepBtn('section-shelves', '➕', 'More shelves', 'data-dir="1"')}</div>`
          : '';
        rows.push(`<section class="opt-row"><h2 class="opt-head">${sec.kind === 'shelves' ? 'Shelves and width' : 'Width'}</h2><div class="opt-choices">
          ${more}
          <div class="step-group"><span class="step-icon" aria-hidden="true">↔️</span>${stepBtn('section-width', '➖', 'Narrower section', 'data-dir="-1"')}${stepBtn('section-width', '➕', 'Wider section', 'data-dir="1"')}</div>
        </div></section>`);
      }
      return `<div class="parts-panel">${rows.join('')}</div>`;
    }
    if (p.kind === 'pockets') {
      return `<div class="parts-panel"><section class="opt-row"><h2 class="opt-head">Pockets</h2><div class="opt-choices">
        <div class="step-group"><span class="step-icon" aria-hidden="true">↔️</span><span class="step-num">${p.cols}</span>${stepBtn('pockets-size', '➖', 'Fewer across', 'data-dim="cols" data-dir="-1"')}${stepBtn('pockets-size', '➕', 'More across', 'data-dim="cols" data-dir="1"')}</div>
        <div class="step-group"><span class="step-icon" aria-hidden="true">↕️</span><span class="step-num">${p.rows}</span>${stepBtn('pockets-size', '➖', 'Fewer down', 'data-dim="rows" data-dir="-1"')}${stepBtn('pockets-size', '➕', 'More down', 'data-dim="rows" data-dir="1"')}</div>
      </div></section></div>`;
    }
    if (p.kind === 'hooks') {
      return `<div class="parts-panel"><section class="opt-row"><h2 class="opt-head">Hooks</h2><div class="opt-choices">
        <div class="step-group"><span class="step-num">${p.count}</span>${stepBtn('hooks-count', '➖', 'Fewer hooks', 'data-dir="-1"')}${stepBtn('hooks-count', '➕', 'More hooks', 'data-dir="1"')}</div>
      </div></section></div>`;
    }
    if (!Furniture.hasParts(p)) return `<div class="parts-panel">${rows.join('')}</div>`;
    if (p.style === 'wire') {
      rows.push(`<section class="opt-row"><h2 class="opt-head">Shelves</h2><div class="opt-choices">
        <div class="step-group"><span class="step-num">${p.cols[0].cells.length}</span>${stepBtn('rows', '➖', 'Fewer shelves', 'data-dir="-1"')}${stepBtn('rows', '➕', 'More shelves', 'data-dir="1"')}</div></div></section>`);
      return `<div class="parts-panel">${rows.join('')}</div>`;
    }

    if (p.style === 'plastic') {
      const wheels = [['on', 'With wheels'], ['off', 'No wheels']].map(([v, label]) => {
        const on = (p.wheels !== false) === (v === 'on');
        return `<button type="button" class="pick small square ${on ? 'picked' : ''}" data-act="wheels" data-value="${v}" aria-label="${label}" aria-pressed="${on}">${Furniture.render({ ...p, wheels: v === 'on', label: '' })}</button>`;
      }).join('');
      rows.push(`<section class="opt-row"><h2 class="opt-head">Wheels</h2><div class="opt-choices">${wheels}</div></section>`);
      const n = p.cols[0].cells.length;
      rows.push(`<section class="opt-row"><h2 class="opt-head">Drawers</h2><div class="opt-choices">
        <div class="step-group"><span class="step-num">${n}</span>${stepBtn('tower-drawers', '➖', 'Fewer drawers', 'data-dir="-1"')}${stepBtn('tower-drawers', '➕', 'More drawers', 'data-dir="1"')}</div></div></section>`);
      return `<div class="parts-panel">${rows.join('')}</div>`;
    }

    const rowCount = Math.max(...p.cols.map(c => c.cells.length));
    rows.push(`<section class="opt-row"><h2 class="opt-head">Columns${p.style === 'cube' ? ' and rows' : ''}</h2><div class="opt-choices">
      <div class="step-group"><span class="step-icon" aria-hidden="true">⫴</span><span class="step-num">${p.cols.length}</span>${stepBtn('cols', '➖', 'Fewer columns', 'data-dir="-1"')}${stepBtn('cols', '➕', 'More columns', 'data-dir="1"')}</div>
      ${p.style === 'cube' ? `<div class="step-group"><span class="step-icon" aria-hidden="true">☰</span><span class="step-num">${rowCount}</span>${stepBtn('rows', '➖', 'Fewer rows', 'data-dir="-1"')}${stepBtn('rows', '➕', 'More rows', 'data-dir="1"')}</div>` : ''}
    </div></section>`);

    const k = selectedPart && Furniture.findCell(p, selectedPart);
    if (!k) {
      rows.push(`<p class="parts-hint"><span aria-hidden="true">👆</span> Tap a part to change it</p>`);
    } else {
      const types = [['drawer', 'Drawer'], ['open', 'Cubby'], ['cupboard', 'Cupboard']].map(([t, label]) =>
        `<button type="button" class="pick small square ${k.type === t ? 'picked' : ''}" data-act="part-type" data-value="${t}" aria-label="${label}" aria-pressed="${k.type === t}">${Furniture.partIcon(t)}</button>`).join('');
      rows.push(`<section class="opt-row"><h2 class="opt-head">This part</h2><div class="opt-choices">${types}</div></section>`);
      if (k.type === 'open') {
        const ins = [['empty', 'Open'], ['bin', 'Bin'], ['sorter', 'Paper sorter'], ['drawers', 'Paper drawers']].map(([v, label]) =>
          `<button type="button" class="pick small square ${k.insert === v ? 'picked' : ''}" data-act="part-insert" data-value="${v}" aria-label="${label}" aria-pressed="${k.insert === v}">${Furniture.partIcon('open', v)}</button>`).join('');
        rows.push(`<section class="opt-row"><h2 class="opt-head">Inside</h2><div class="opt-choices">${ins}</div></section>`);
        if (Furniture.INSERT_COUNTS[k.insert]) {
          rows.push(`<section class="opt-row"><h2 class="opt-head">${k.insert === 'sorter' ? 'Trays' : 'Drawers'}</h2><div class="opt-choices">
            <div class="step-group"><span class="step-num">${k.count}</span>${stepBtn('insert-count', '➖', 'Fewer', 'data-dir="-1"')}${stepBtn('insert-count', '➕', 'More', 'data-dir="1"')}</div></div></section>`);
        }
        if (k.insert === 'bin' || k.insert === 'drawers') {
          const binList = Furniture.BIN_COLORS.includes(k.binColor) ? Furniture.BIN_COLORS : [...Furniture.BIN_COLORS, k.binColor];
          const bins = binList.map(c =>
            `<button type="button" class="swatch ${k.binColor === c ? 'picked' : ''}" style="--swatch:${c}" data-act="bin-color" data-value="${c}" aria-label="Bin color" aria-pressed="${k.binColor === c}"></button>`).join('') +
            `<button type="button" class="swatch more-colors" data-act="color-picker" data-for="bin-color" aria-label="More colors"><span aria-hidden="true">➕</span></button>`;
          rows.push(`<section class="opt-row"><h2 class="opt-head">Color</h2><div class="opt-choices">${bins}</div></section>`);
        }
      }
      if (k.type === 'cupboard') {
        rows.push(`<section class="opt-row"><h2 class="opt-head">Shelves inside</h2><div class="opt-choices">
          <div class="step-group"><span class="step-num">${k.shelves}</span>${stepBtn('cup-shelves', '➖', 'Fewer shelves', 'data-dir="-1"')}${stepBtn('cup-shelves', '➕', 'More shelves', 'data-dir="1"')}</div></div></section>`);
      }
      rows.push(`<section class="opt-row"><h2 class="opt-head">More or fewer</h2><div class="opt-choices">
        <div class="step-group"><span class="step-icon" aria-hidden="true">↕️</span>${stepBtn('part-size', '➖', 'Smaller part', 'data-dir="-1"')}${stepBtn('part-size', '➕', 'Bigger part', 'data-dir="1"')}</div>
        ${stepBtn('part-add', '➕ Add one', 'Add a part like this one')}
        ${stepBtn('part-remove', '🗑️', 'Remove this part')}
      </div></section>`);
    }
    return `<div class="parts-panel">${rows.join('')}</div>`;
  }

  function openPartInside(p, partId) {
    const k = Furniture.hasParts(p) && p.style !== 'wire' ? Furniture.findCell(p, partId) : null;
    const cubby = k && k.type === 'open' && k.id === partId;
    const choices = cubby ? `<div class="inside-choices">${[['empty', 'Take it out (open)'], ['bin', 'Bin'], ['sorter', 'Paper sorter'], ['drawers', 'Paper drawers']].map(([v, label]) =>
      `<button type="button" class="pick small square ${k.insert === v ? 'picked' : ''}" data-act="inside-insert" data-id="${k.id}" data-value="${v}" aria-label="${label}" aria-pressed="${k.insert === v}">${Furniture.partIcon('open', v)}</button>`).join('')}</div>` : '';
    const spaces = spacesIn(p, partId);
    if (!insideCtx || insideCtx.partId !== partId) insideCtx = { partId, spot: 0 };
    const space = spaces[Math.min(insideCtx.spot, spaces.length - 1)];
    // Cupboards, sorters and paper-drawer boxes have more than one space: pick which one.
    const spotRow = spaces.length > 1 ? `<div class="spot-row">${spaces.map((sp, i) =>
      `<button type="button" class="spot-btn ${sp === space ? 'picked' : ''}" data-act="inside-spot" data-value="${i}" aria-label="Space ${i + 1}">${i + 1}</button>`).join('')}</div>` : '';
    const scroll = $modal.querySelector('.modal-card') ? $modal.querySelector('.modal-card').scrollTop : 0;
    openModal(`
      <div class="inside-view">${Furniture.renderInside(p, partId)}</div>
      ${choices}
      ${space ? `${spotRow}${spaceWhose(p, space)}${spaceHolds(space)}` : ''}
      <div class="confirm-row">
        <button type="button" class="big-btn yes" data-act="modal-close" aria-label="Close">👍</button>
      </div>`);
    insideCtx.pieceId = p.id;
    const card = $modal.querySelector('.modal-card');
    if (card) card.scrollTop = scroll;
  }

  // ---------- Whose space is whose, and what goes there ----------
  // A whole piece can belong to someone (p.owners). A space can have its own owners;
  // until then it belongs to whoever owns the piece. Shared spaces have more than one owner.

  let insideCtx = null;

  const uniq = list => [...new Set(list)];
  const findSpace = (p, id) => Furniture.spacesOf(p).find(s => s.id === id) || null;

  // The spaces inside the part that was tapped (a cupboard has a top and bottom spot).
  function spacesIn(p, partId) {
    const one = findSpace(p, partId);
    if (one) return [one];
    const k = Furniture.findCell(p, partId);
    return k && k.spots ? k.spots : [];
  }

  function ownersOf(p, space) {
    const list = space && space.owners !== undefined ? space.owners : (p.owners || []);
    return list.filter(id => S.data.people.some(x => x.id === id));
  }

  function personBadge(pid, x, y, s) {
    const person = S.data.people.find(x => x.id === pid);
    if (!person) return '';
    return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s / 2 + 1.5}" fill="#fff"/>` +
      Stickers.render(personSticker(person)).replace('<svg class="sticker-svg"', `<svg x="${x}" y="${y}" width="${s}" height="${s}"`);
  }

  // Badges in the top right of a space, what-goes-here pictures in the bottom left.
  function marksFor(p) {
    const custom = S.data.customHolds || [];
    return (ids, x, y, w, h) => {
      const spaces = ids.map(id => findSpace(p, id)).filter(Boolean);
      const owners = uniq(spaces.flatMap(sp => ownersOf(p, sp)));
      const holds = uniq(spaces.flatMap(sp => sp.holds || []));
      if (!owners.length && !holds.length) return '';
      const s = Math.max(14, Math.min(30, Math.min(w, h) * 0.42));
      let o = '';
      owners.slice(0, 3).forEach((pid, i) => { o += personBadge(pid, x + w - s - 3 - i * s * 0.75, y + 3, s); });
      holds.slice(0, 3).forEach((key, i) => { o += Items.place(key, x + 4 + i * (s + 2), y + h - s - 3, s, custom); });
      return `<g pointer-events="none">${o}</g>`;
    };
  }

  function stickerPick(pid, on, act, extra = '') {
    const person = S.data.people.find(x => x.id === pid);
    return `<button type="button" class="pick small ${on ? 'picked' : ''}" data-act="${act}" data-pid="${pid}" ${extra} aria-label="${esc(person.name || 'Person')}" aria-pressed="${on}">
      ${Stickers.render(personSticker(person))}</button>`;
  }

  function whoseRow(p) {
    if (!S.data.people.length || p.kind === 'closet' && closetOutside) return '';
    const owners = p.owners || [];
    return `<section class="opt-row whose-row"><h2 class="opt-head"><span aria-hidden="true">👤</span> Whose?</h2>
      <div class="opt-choices">${S.data.people.map(x => stickerPick(x.id, owners.includes(x.id), 'piece-owner')).join('')}</div></section>`;
  }

  function spaceWhose(p, space) {
    const owners = ownersOf(p, space);
    return `<section class="inside-section"><h3 class="inside-head"><span aria-hidden="true">👤</span> Whose?</h3>
      <div class="opt-choices">${S.data.people.map(x => stickerPick(x.id, owners.includes(x.id), 'space-owner', `data-sid="${space.id}"`)).join('')}</div></section>`;
  }

  function spaceHolds(space) {
    const custom = S.data.customHolds || [];
    const holds = space.holds || [];
    const btn = key => `<button type="button" class="hold-pick ${holds.includes(key) ? 'picked' : ''}" data-act="space-hold" data-sid="${space.id}" data-key="${key}" aria-label="${esc(Items.label(key, custom))}" aria-pressed="${holds.includes(key)}">${Items.icon(key, custom)}</button>`;
    const groups = Items.GROUPS.map(g => `<div class="hold-group" aria-label="${g.label}">${g.items.map(([key]) => btn(key)).join('')}</div>`).join('');
    const mine = custom.map(c => btn(c.key)).join('');
    return `<section class="inside-section"><h3 class="inside-head"><span aria-hidden="true">🧺</span> What goes here?</h3>
      ${groups}
      <div class="hold-group">${mine}
        <label class="hold-pick photo-pick" aria-label="Take a photo of something"><span aria-hidden="true">📷</span>
          <input type="file" accept="image/*" capture="environment" data-hold-photo="${space.id}" hidden></label>
      </div></section>`;
  }

  function reopenInside() {
    const p = pieceById(pagePieceId);
    if (p && insideCtx) openPartInside(p, insideCtx.partId);
  }

  // Redraw the piece page and keep the scroll where it was.
  function redrawPiece() {
    const y = window.scrollY;
    renderPiece(pagePieceId);
    window.scrollTo(0, y);
  }

  function changePiece(fn) {
    const p = pieceById(pagePieceId);
    if (!p) return;
    fn(p);
    saveOrWarn();
    Effects.pop();
    redrawPiece();
  }

  const clampSize = v => Math.round(Math.max(1, Math.min(30, v)) * 10) / 10;

  // Where the selected part is: its column and its place in the column.
  function partPlace(p, id) {
    for (const c of p.cols) {
      const i = c.cells.findIndex(k => k.id === id);
      if (i >= 0) return { col: c, i };
    }
    return null;
  }

  // ---------- Backup and restore (parent only) ----------
  // The viewer inside claude.ai blocks downloads, so a backup is copied as text
  // (to paste into a note or an email). A file works too where downloads are allowed.

  let backupUnlocked = false;

  function backupText() {
    return JSON.stringify({ app: 'messy-room', savedAt: new Date().toISOString(), data: S.data });
  }

  // Accepts a backup made by "Save a backup", or the plain saved data.
  function readBackup(text) {
    let obj;
    try { obj = JSON.parse(String(text).trim()); } catch (e) { return null; }
    const data = obj && obj.app === 'messy-room' && obj.data ? obj.data : obj;
    if (!data || !Array.isArray(data.people) || !Array.isArray(data.stickers)) return null;
    return { data, savedAt: obj.savedAt || null };
  }

  function niceDate(iso) {
    if (!iso) return '';
    try { return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ''; }
  }

  function renderBackup() {
    if (!backupUnlocked) { location.replace('#/'); return; }
    const d = S.data;
    const rooms = d.rooms && d.rooms['my-room'] ? d.rooms['my-room'].pieces.length : 0;
    $app.innerHTML = `
      ${topBar('Backup', '#/')}
      <main class="backup-page">
        <section class="opt-row backup-box">
          <h2 class="opt-head"><span aria-hidden="true">💾</span> Save a backup</h2>
          <p class="backup-note">Everything: ${d.people.length} ${d.people.length === 1 ? 'person' : 'people'}, ${d.stickers.length} stickers, ${d.rewards.length} rewards, and My Room with ${rooms} ${rooms === 1 ? 'piece' : 'pieces'} of furniture.
          ${d.lastBackup ? `<br>Last backup: ${esc(niceDate(d.lastBackup))}` : ''}</p>
          <div class="backup-actions">
            <button type="button" class="save-btn" data-act="backup-copy"><span aria-hidden="true">📋</span> Copy backup</button>
            <button type="button" class="tool-btn big" data-act="backup-file"><span aria-hidden="true">📄</span> Save as a file</button>
          </div>
          <p class="backup-note">Copy it, then paste it into a note or an email to yourself. Saving as a file works when the app is opened on its own, not inside claude.ai.</p>
          <textarea id="backup-out" class="text-input backup-text" rows="4" readonly hidden aria-label="Backup text"></textarea>
        </section>
        <section class="opt-row backup-box">
          <h2 class="opt-head"><span aria-hidden="true">♻️</span> Restore</h2>
          <p class="backup-note">This replaces everything on this device with the backup.</p>
          <textarea id="restore-text" class="text-input backup-text" rows="4" placeholder="Paste a backup here" aria-label="Paste a backup"></textarea>
          <div class="backup-actions">
            <button type="button" class="save-btn" data-act="restore-text"><span aria-hidden="true">♻️</span> Restore</button>
            <label class="tool-btn big"><span aria-hidden="true">📂</span> Choose a file
              <input type="file" accept=".json,.txt,application/json,text/plain" data-restore-file hidden>
            </label>
          </div>
        </section>
      </main>`;
  }

  function markBackedUp() {
    S.data.lastBackup = new Date().toISOString();
    S.save();
  }

  // If copying isn't allowed, show the text, selected, so it can be copied by hand.
  function showBackupText(text) {
    const out = document.getElementById('backup-out');
    if (!out) return;
    out.hidden = false;
    out.value = text;
    out.focus();
    out.select();
  }

  function askRestore(text) {
    const b = readBackup(text);
    if (!b) { infoBox('🤔', 'That doesn’t look like a Messy Room backup. Check that the whole backup was pasted.'); return; }
    const when = b.savedAt ? ` from ${niceDate(b.savedAt)}` : '';
    const n = b.data.people.length;
    confirmBox('♻️', `Replace everything on this device with the backup${when} (${n} ${n === 1 ? 'person' : 'people'})?`, () => {
      if (!S.restore(b.data)) { infoBox('⚠️', 'This device is out of space, so the backup could not be restored. Nothing was changed.'); return; }
      Effects.celebrate();
      backupUnlocked = false;
      currentId = null;
      location.hash = '#/who';
    });
  }

  // ---------- 🧸 Things: the things that get put away ----------
  // A thing has a picture (or a photo), a color and pattern, whose it is, and where it lives.
  // thing = { id, kind, color, pattern, photo, owners: [], home: { pieceId, spaceId }, label }

  let thingDraft = null;
  let thingIsNew = false;
  let homePiece = null;      // piece shown while choosing where a thing lives

  const things = () => (S.data.things || (S.data.things = []));

  function thingArt(t) {
    if (t.photo) return `<svg viewBox="0 0 60 60"><clipPath id="tp-${t.id}"><rect width="60" height="60" rx="12"/></clipPath><image href="${t.photo}" width="60" height="60" preserveAspectRatio="xMidYMid slice" clip-path="url(#tp-${t.id})"/></svg>`;
    if (ItemArt.has(t.kind)) return ItemArt.svg(t.kind, t.color, t.pattern);
    return Items.icon(t.kind, S.data.customHolds || []);
  }

  // Where a thing lives, as words for grown-ups and a small picture for kids.
  function homeOf(t) {
    if (!t.home) return null;
    const p = pieceById(t.home.pieceId);
    if (!p) return null;
    const space = findSpace(p, t.home.spaceId);
    return space ? { p, space } : null;
  }

  function ownerBadges(owners, size = 34) {
    return owners.filter(id => S.data.people.some(x => x.id === id)).slice(0, 3).map(pid => {
      const person = S.data.people.find(x => x.id === pid);
      return `<span class="mini-sticker" style="width:${size}px;height:${size}px">${Stickers.render(personSticker(person))}</span>`;
    }).join('');
  }

  function renderThings() {
    const list = things();
    $app.innerHTML = `
      ${topBar('Things', '#/')}
      <main>
        <div class="thing-grid">
          <a class="thing-card add-card" href="#/thing/new" aria-label="Make a thing"><span class="add-plus" aria-hidden="true">➕</span></a>
          ${list.map(t => `<a class="thing-card" href="#/thing/${t.id}" aria-label="${esc(t.label || Items.label(t.kind, S.data.customHolds || []) || 'Thing')}">
            <span class="thing-pic">${thingArt(t)}</span>
            <span class="thing-badges">${ownerBadges(t.owners || [])}${homeOf(t) ? '<span class="home-pin" aria-hidden="true">📍</span>' : ''}</span>
            ${t.label ? `<span class="furn-label">${esc(t.label)}</span>` : ''}
          </a>`).join('')}
        </div>
      </main>`;
  }

  function renderThing(id) {
    if (!thingDraft || (id !== 'new' && thingDraft.id !== id) || (id === 'new' && !thingIsNew)) {
      const existing = id === 'new' ? null : things().find(t => t.id === id);
      if (id !== 'new' && !existing) { location.replace('#/things'); return; }
      thingIsNew = !existing;
      thingDraft = existing ? clone(existing) : { id: S.uid(), kind: 'shirts', color: null, pattern: 'none', owners: currentId ? [currentId] : [], home: null, label: '' };
    }
    drawThing();
  }

  function drawThing() {
    const t = thingDraft;
    const custom = S.data.customHolds || [];
    const pick = key => `<button type="button" class="hold-pick ${t.kind === key && !t.photo ? 'picked' : ''}" data-act="thing-kind" data-key="${key}" aria-label="${esc(Items.label(key, custom))}">${Items.icon(key, custom)}</button>`;
    const pictures = Items.GROUPS.map(g => `<div class="hold-group">${g.items.map(([key]) => pick(key)).join('')}</div>`).join('') +
      `<div class="hold-group">${custom.map(c => pick(c.key)).join('')}
        <label class="hold-pick photo-pick" aria-label="Take a photo of it"><span aria-hidden="true">📷</span>
          <input type="file" accept="image/*" capture="environment" data-thing-photo hidden></label></div>`;
    const recolor = ItemArt.has(t.kind) && !t.photo;
    const color = t.color || (recolor ? ItemArt.ART[t.kind].color : null);
    const colors = recolor ? swatches(color, 'thing-color') : '';
    const patterns = recolor ? ItemArt.PATTERNS.map(pt =>
      `<button type="button" class="hold-pick ${(t.pattern || 'none') === pt ? 'picked' : ''}" data-act="thing-pattern" data-value="${pt}" aria-label="Pattern ${pt}">${ItemArt.svg(t.kind, color, pt)}</button>`).join('') : '';
    const owners = t.owners || [];
    const home = homeOf(t);
    const homePic = home ? Furniture.render(home.p, { marks: homeMark(home.p, home.space.id) }) : '';
    $app.innerHTML = `
      ${topBar(t.label || '', thingIsNew ? '#/things' : '#/things', `<button type="button" class="round-btn save-top" data-act="thing-save" aria-label="Save">✔️</button>`)}
      <main class="piece-page">
        <div class="thing-hero">${thingArt(t)}</div>
        ${recolor ? `<section class="opt-row"><h2 class="opt-head"><span aria-hidden="true">🎨</span></h2><div class="opt-choices">${colors}</div></section>
        <section class="opt-row"><h2 class="opt-head"><span aria-hidden="true">✨</span> Pattern</h2><div class="opt-choices">${patterns}</div></section>` : ''}
        ${S.data.people.length ? `<section class="opt-row"><h2 class="opt-head"><span aria-hidden="true">👤</span> Whose?</h2>
          <div class="opt-choices">${S.data.people.map(x => stickerPick(x.id, owners.includes(x.id), 'thing-owner')).join('')}</div></section>` : ''}
        <section class="opt-row">
          <h2 class="opt-head"><span aria-hidden="true">📍</span> Where does it live?</h2>
          ${home ? `<div class="home-preview">${homePic}</div>` : ''}
          <div class="action-row"><button type="button" class="tool-btn big" data-act="thing-home"><span aria-hidden="true">📍</span> ${home ? 'Change' : 'Choose'}</button>
          ${home ? `<button type="button" class="tool-btn big" data-act="thing-home-clear" aria-label="No home"><span aria-hidden="true">✖️</span></button>` : ''}</div>
        </section>
        <section class="opt-row"><h2 class="opt-head"><span aria-hidden="true">🖼️</span> Picture</h2>${pictures}</section>
        <section class="opt-row">
          <h2 class="opt-head"><span aria-hidden="true">🏷️</span> Label (optional)</h2>
          <input class="text-input" id="thing-label" type="text" maxlength="24" value="${esc(t.label || '')}" placeholder="Like: Ava's pink dress">
        </section>
        <div class="action-row">
          ${thingIsNew ? '' : `<button type="button" class="round-btn" data-act="thing-delete" aria-label="Delete">🗑️</button>`}
          <button type="button" class="save-btn" data-act="thing-save"><span aria-hidden="true">✔️</span> Save</button>
        </div>
      </main>`;
  }

  // A pin on the space where a thing lives.
  function homeMark(p, spaceId) {
    return (ids, x, y, w, h) => (ids.includes(spaceId)
      ? `<g pointer-events="none"><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="6" fill="#3a86ff" fill-opacity=".18" stroke="#3a86ff" stroke-width="4" stroke-dasharray="8 5"/>` +
        `<text x="${x + w / 2}" y="${y + h / 2}" font-size="${Math.min(34, Math.max(16, h * 0.6))}" text-anchor="middle" dominant-baseline="central">📍</text></g>`
      : '');
  }

  function redrawThing() {
    const y = window.scrollY;
    drawThing();
    window.scrollTo(0, y);
  }

  // Choosing where a thing lives: pick a piece of furniture, then tap the space.
  function renderThingHome() {
    if (!thingDraft) { location.replace('#/things'); return; }
    const r = room();
    const p = homePiece && pieceById(homePiece);
    if (!p) {
      const pieces = r.pieces.filter(q => Furniture.spacesOf(q).length);
      $app.innerHTML = `
        ${topBar('', thingIsNew ? '#/thing/new' : `#/thing/${thingDraft.id}`)}
        <main>
          <h2 class="section-title"><span aria-hidden="true">📍</span> <span class="thing-inline">${thingArt(thingDraft)}</span></h2>
          <div class="furn-grid">${pieces.map(q => pieceCard(q, 'home-piece')).join('') || '<p class="parts-hint">Make some furniture in My Room first.</p>'}</div>
        </main>`;
      return;
    }
    $app.innerHTML = `
      ${topBar('', '#/thing-home')}
      <main class="piece-page">
        <h2 class="section-title"><span aria-hidden="true">👆</span> <span class="thing-inline">${thingArt(thingDraft)}</span></h2>
        <div class="piece-stage">${Furniture.render(p, { interactive: true, inside: p.kind === 'closet' ? piecesIn(p.id) : [], marks: marksFor(p) })}</div>
      </main>`;
  }

  function setThingHome(p, spaceId) {
    thingDraft.home = { pieceId: p.id, spaceId };
    homePiece = null;
    closeModal();
    Effects.chime();
    location.hash = thingIsNew ? '#/thing/new' : `#/thing/${thingDraft.id}`;
  }

  // ---------- 🧺 Tidy up ----------
  // What's on the floor? Then put it away, one thing (or one kind) at a time,
  // with the spot where it goes glowing 📍. Everyone else's spaces are dimmed.
  // A pick is 'thing:<id>', 'kind:<key>' (a clean kind, or trash, recycling, dishes) or 'dirty:<key>'.

  let tidy = { mode: 'group', picks: [], steps: [], i: 0, done: new Set() };
  let tidyDrag = null;

  const CLOTHES_KEYS = Items.GROUPS.find(g => g.key === 'clothes').items.map(([k]) => k);
  const TRASH_SUBS = ['trashKitchen', 'trashRect', 'trashRound'];

  function renderClean() {
    $app.innerHTML = `
      ${topBar('Clean', '#/')}
      <main class="circle-grid">
        ${circle({ href: '#/tidy', icon: '🧺', label: 'Tidy up', color: 'var(--c-clean)' })}
        ${circle({ href: '#/jobs', icon: '🧽', label: 'Jobs', color: 'var(--c-things)' })}
      </main>`;
  }

  function dirtyIcon(key) {
    const stink = `<g fill="none" stroke="#8a6a3a" stroke-width="2.6" stroke-linecap="round" opacity=".9"><path d="M14 10 q3 -4 0 -8 M30 8 q3 -4 0 -8 M46 10 q3 -4 0 -8"/></g><circle cx="38" cy="40" r="5" fill="#8a6a3a" opacity=".55"/><circle cx="22" cy="46" r="3.5" fill="#8a6a3a" opacity=".5"/>`;
    return Items.icon(key).replace(/<\/svg>$/, `${stink}</svg>`);
  }

  function pickArt(pick) {
    const [type, key] = pick.split(':');
    if (type === 'thing') { const t = things().find(x => x.id === key); return t ? thingArt(t) : ''; }
    if (type === 'dirty') return dirtyIcon(key);
    return Items.icon(key, S.data.customHolds || []);
  }

  // Which group a pick belongs to, for "one kind at a time".
  function pickGroup(pick) {
    const [type, key] = pick.split(':');
    if (type === 'thing') return { key: 'things', icon: '🧸' };
    if (type === 'dirty') return { key: 'dirty', icon: '🧺' };
    const it = Items.ALL[key];
    if (it && it.group) { const g = Items.FLOOR.find(x => x.key === it.group); return { key: g.key, icon: g.icon }; }
    const g = Items.GROUPS.find(x => x.items.some(([k]) => k === key));
    return g ? { key: g.key, icon: g.icon } : { key: 'other', icon: '❓' };
  }

  // Every piece in the room, including ones in closets and hung on doors.
  const allPieces = () => room().pieces;
  const mine = owners => !owners.length || owners.includes(currentId);

  // Where a pick goes: spaces to glow, or the kitchen.
  function targetsOf(pick) {
    const [type, key] = pick.split(':');
    const spaces = [];
    const add = (p, s) => spaces.push({ p, s });
    if (type === 'thing') {
      const t = things().find(x => x.id === key);
      const h = t && homeOf(t);
      if (h) add(h.p, h.space);
      return { spaces };
    }
    const it = Items.ALL[key];
    const dest = type === 'dirty' ? 'hamper' : it && it.dest;
    if (dest === 'kitchen') return { spaces, kitchen: true };
    if (dest) {
      const subs = dest === 'trash' ? TRASH_SUBS : dest === 'recycle' ? ['recycle'] : ['hamperRound', 'hamperRect'];
      allPieces().filter(p => p.kind === 'container' && subs.includes(p.sub)).forEach(p => add(p, p.spot));
      if (!spaces.length && dest === 'recycle') allPieces().filter(p => p.kind === 'container' && TRASH_SUBS.includes(p.sub)).forEach(p => add(p, p.spot));
      return { spaces };
    }
    // A clean kind: every space marked "what goes here" with it; your own and shared ones first.
    allPieces().forEach(p => Furniture.spacesOf(p).forEach(s => { if ((s.holds || []).includes(key)) add(p, s); }));
    const ours = spaces.filter(x => mine(ownersOf(x.p, x.s)));
    return { spaces: ours.length ? ours : spaces };
  }

  let tidyTab = 'pictures';

  function renderTidy() {
    const custom = S.data.customHolds || [];
    const sel = new Set(tidy.picks);
    const words = tidyTab === 'words';
    const pick = (id, art, label) => words
      ? `<button type="button" class="word-pick ${sel.has(id) ? 'picked' : ''}" data-act="tidy-pick" data-value="${id}" aria-pressed="${sel.has(id)}"><span class="word-box" aria-hidden="true">${sel.has(id) ? '✔️' : ''}</span><span class="word-pic">${art}</span><span class="word-label">${esc(label)}</span></button>`
      : `<button type="button" class="hold-pick floor-pick ${sel.has(id) ? 'picked' : ''}" data-act="tidy-pick" data-value="${id}" aria-label="${esc(label)}" aria-pressed="${sel.has(id)}">${art}</button>`;
    const myThings = things().filter(t => mine(t.owners || []));
    const row = (icon, label, picks) => picks ? `<section class="opt-row"><h2 class="opt-head"><span aria-hidden="true">${icon}</span> ${label}</h2><div class="${words ? 'word-list' : 'opt-choices'}">${picks}</div></section>` : '';
    const tab = (key, icon, word) => `<button type="button" class="tool-btn big ${tidyTab === key ? 'on' : ''}" data-act="tidy-tab" data-value="${key}">${icon} ${word}</button>`;
    const floor = Items.FLOOR.map(g => row(g.icon, g.label, g.items.map(([k]) => pick(`kind:${k}`, Items.icon(k), Items.label(k))).join(''))).join('');
    const dirty = row('🧺', 'Dirty clothes', CLOTHES_KEYS.map(k => pick(`dirty:${k}`, dirtyIcon(k), `Dirty ${Items.label(k)}`)).join(''));
    const kinds = Items.GROUPS.map(g => row(g.icon, g.label, g.items.map(([k]) => pick(`kind:${k}`, Items.icon(k, custom), Items.label(k, custom))).join(''))).join('');
    const one = `<svg viewBox="0 0 60 60">${ItemArt.inner('shirts')}</svg>`;
    const many = `<svg viewBox="0 0 60 60"><g transform="translate(-6 4) scale(.6)">${ItemArt.inner('socks')}</g><g transform="translate(22 4) scale(.6)">${ItemArt.inner('shirts')}</g><g transform="translate(8 24) scale(.6)">${ItemArt.inner('pants')}</g></svg>`;
    $app.innerHTML = `
      ${topBar('', '#/clean', `<span class="me-mini">${Stickers.render(personSticker(currentPerson()))}</span>`)}
      <main class="piece-page">
        <h1 class="tidy-title"><span aria-hidden="true">👀</span> What's on the floor?</h1>
        <div class="opt-choices today-tabs">${tab('pictures', '🖼️', 'Pictures')}${tab('words', '🔤', 'Words')}</div>
        <div class="mode-row">
          <button type="button" class="mode-btn ${tidy.mode === 'one' ? 'picked' : ''}" data-act="tidy-mode" data-value="one" aria-label="One thing at a time" aria-pressed="${tidy.mode === 'one'}">${one}<span class="mode-n">1</span></button>
          <button type="button" class="mode-btn ${tidy.mode === 'group' ? 'picked' : ''}" data-act="tidy-mode" data-value="group" aria-label="One kind at a time" aria-pressed="${tidy.mode === 'group'}">${many}</button>
        </div>
        ${row('🧸', 'My things', myThings.map(t => pick(`thing:${t.id}`, thingArt(t), t.label || 'Thing')).join(''))}
        ${floor}${dirty}${kinds}
        <div class="go-bar"><button type="button" class="save-btn go-btn" data-act="tidy-go" ${tidy.picks.length ? '' : 'disabled'} aria-label="Start">▶️ ${tidy.picks.length || ''}</button></div>
      </main>`;
  }

  function buildSteps() {
    if (tidy.mode === 'one') return tidy.picks.map(pk => ({ icon: pickGroup(pk).icon, picks: [pk] }));
    const groups = [];
    tidy.picks.forEach(pk => {
      const g = pickGroup(pk);
      let step = groups.find(x => x.key === g.key);
      if (!step) groups.push(step = { key: g.key, icon: g.icon, picks: [] });
      step.picks.push(pk);
    });
    return groups;
  }

  // Glow the spaces where things go; dim spaces that belong only to someone else.
  function tidyMarks(p, glowIds) {
    const base = marksFor(p);
    return (ids, x, y, w, h) => {
      const spaces = ids.map(id => findSpace(p, id)).filter(Boolean);
      if (ids.some(id => glowIds.has(id))) {
        return `<g pointer-events="none"><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h - 4}" rx="8" fill="#ffd54a" fill-opacity=".45" stroke="#ffb703" stroke-width="5" class="glow"/>` +
          `<text x="${x + w / 2}" y="${y + h / 2}" font-size="${Math.min(40, Math.max(16, h * 0.55))}" text-anchor="middle" dominant-baseline="central">📍</text></g>`;
      }
      const others = spaces.length && spaces.every(sp => { const o = ownersOf(p, sp); return o.length && !o.includes(currentId); });
      return base(ids, x, y, w, h) + (others ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#fff" fill-opacity=".6" pointer-events="none"/>` : '');
    };
  }

  function renderTidyGo() {
    if (!tidy.steps.length) { location.replace('#/tidy'); return; }
    if (tidy.i >= tidy.steps.length) { renderTidyDone(); return; }
    const step = tidy.steps[tidy.i];
    const left = step.picks.filter(pk => !tidy.done.has(pk));
    // Where everything in this step goes
    const glow = new Set();
    const pieceIds = [];
    let kitchen = false, missing = [];
    step.picks.forEach(pk => {
      const t = targetsOf(pk);
      if (t.kitchen) kitchen = true;
      if (!t.kitchen && !t.spaces.length) missing.push(pk);
      t.spaces.forEach(({ p, s }) => { glow.add(s.id); if (!pieceIds.includes(p.id)) pieceIds.push(p.id); });
    });
    const dots = tidy.steps.map((s, i) => `<span class="dot ${i < tidy.i ? 'done' : i === tidy.i ? 'now' : ''}"></span>`).join('');
    const items = step.picks.map(pk => `<div class="tidy-item ${tidy.done.has(pk) ? 'done' : ''}" data-tidy-item="${pk}" role="button" aria-label="Put it away">${pickArt(pk)}${tidy.done.has(pk) ? '<span class="tick" aria-hidden="true">✔️</span>' : ''}</div>`).join('');
    const pieces = pieceIds.map(id => {
      const p = pieceById(id);
      return `<div class="piece-stage tidy-stage">${Furniture.render(p, { interactive: true, inside: p.kind === 'closet' ? piecesIn(p.id) : [], marks: tidyMarks(p, glow) })}</div>`;
    }).join('');
    const kitchenCard = kitchen ? `<div class="kitchen-card" data-tidy-drop="kitchen"><span class="kitchen-pic" aria-hidden="true">🍽️</span><span class="kitchen-arrow" aria-hidden="true">➡️</span><span class="kitchen-pic" aria-hidden="true">🍳</span><span class="kitchen-word">Take to the kitchen</span></div>` : '';
    const noSpot = missing.length ? `<div class="no-spot"><span aria-hidden="true">📍❓</span> No spot yet for ${missing.map(pk => `<span class="thing-inline">${pickArt(pk)}</span>`).join('')}
      ${missing.some(pk => pk.startsWith('thing:')) ? `<button type="button" class="tool-btn big" data-act="tidy-set-home" data-value="${missing.find(pk => pk.startsWith('thing:'))}">📍</button>` : ''}</div>` : '';
    $app.innerHTML = `
      ${topBar('', '#/tidy', `<span class="me-mini">${Stickers.render(personSticker(currentPerson()))}</span>`)}
      <main class="piece-page tidy-go">
        <div class="dots">${dots}</div>
        <div class="tidy-items"><span class="step-icon big" aria-hidden="true">${step.icon}</span>${items}</div>
        ${kitchenCard}${pieces}${noSpot}
        <div class="go-bar"><button type="button" class="save-btn ${left.length ? '' : 'pulse'}" data-act="tidy-next" aria-label="Done, next">✔️</button></div>
      </main>`;
  }

  function renderTidyDone() {
    $app.innerHTML = `
      ${topBar('', '#/')}
      <main class="tidy-done">
        <div class="done-sticker">${Stickers.render(personSticker(currentPerson()))}</div>
        <div class="done-party" aria-hidden="true">🎉🧹✨</div>
        <div class="action-row">
          <a class="round-btn big-round" href="#/rewards" aria-label="Rewards">🎁</a>
          <a class="round-btn big-round" href="#/" aria-label="Home">🏠</a>
        </div>
      </main>`;
  }

  // Put one thing away: check it off, and move on when the step is done.
  function putAway(pk) {
    if (!pk || tidy.done.has(pk)) return;
    tidy.done.add(pk);
    Effects.chime();
    const step = tidy.steps[tidy.i];
    if (step.picks.every(x => tidy.done.has(x))) {
      renderTidyGo();
      setTimeout(() => { if (location.hash === '#/tidy/go' && tidy.steps[tidy.i] === step) nextStep(); }, 700);
    } else {
      renderTidyGo();
    }
  }

  function nextStep() {
    const step = tidy.steps[tidy.i];
    if (step) step.picks.forEach(pk => tidy.done.add(pk));
    tidy.i += 1;
    if (tidy.i >= tidy.steps.length) {
      S.addCleanup();
      const r = room();
      if (!r.jobsDone) r.jobsDone = {};
      const now = new Date().toISOString();
      r.jobsDone.tidy = now;
      if (!r.jobsBy) r.jobsBy = {};
      r.jobsBy.tidy = currentId;
      r.tidies = [...(r.tidies || []), { who: currentId, at: now }].slice(-60);
      saveOrWarn();
      Effects.celebrate();
    } else {
      Effects.pop();
    }
    window.scrollTo(0, 0);
    renderTidyGo();
  }

  // Which pick (still on the floor in this step) goes to this space or the kitchen?
  function pickFor(target) {
    const step = tidy.steps[tidy.i];
    if (!step) return null;
    return step.picks.find(pk => {
      if (tidy.done.has(pk)) return false;
      const t = targetsOf(pk);
      if (target === 'kitchen') return t.kitchen;
      return t.spaces.some(({ p, s }) => target === s.id || (Furniture.findCell(p, target) || {}).spots?.some(x => x.id === s.id));
    }) || null;
  }

  // Dragging a picture onto its glowing spot
  document.addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-tidy-item]');
    if (!el || el.classList.contains('done')) return;
    tidyDrag = { pk: el.dataset.tidyItem, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, el };
    e.preventDefault();
  });

  document.addEventListener('pointermove', e => {
    const d = tidyDrag;
    if (!d) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 8) return;
    if (!d.moved) {
      d.moved = true;
      d.ghost = document.createElement('div');
      d.ghost.className = 'basket-ghost';
      d.ghost.innerHTML = pickArt(d.pk);
      document.body.appendChild(d.ghost);
      d.el.classList.add('lifted');
    }
    d.ghost.style.left = `${e.clientX}px`;
    d.ghost.style.top = `${e.clientY}px`;
  });

  document.addEventListener('pointerup', e => {
    const d = tidyDrag;
    tidyDrag = null;
    if (!d) return;
    if (d.ghost) d.ghost.remove();
    if (d.el) d.el.classList.remove('lifted');
    if (!d.moved) { putAway(d.pk); return; }   // a tap puts it away too
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const kitchen = hit && hit.closest('[data-tidy-drop="kitchen"]');
    const g = hit && hit.closest('.tidy-stage g.fpart[data-act="part"]');
    const target = kitchen ? 'kitchen' : g ? g.dataset.id : null;
    const ok = target && targetsOf(d.pk).kitchen === (target === 'kitchen') && (target === 'kitchen' || pickFor(target) === d.pk || targetsOf(d.pk).spaces.some(({ p, s }) => s.id === target || (Furniture.findCell(p, target) || {}).spots?.some(x => x.id === s.id)));
    if (ok) { suppressClick = true; setTimeout(() => { suppressClick = false; }, 0); putAway(d.pk); }
    else { Effects.pop(); wiggle(d.el); }
  });

  // ---------- 🧽 Jobs ----------
  // Suggested from the room. Jobs follow ownership: a job on Ava's dresser is Ava's; jobs for
  // shared things or the whole room belong to everyone who shares it, and whoever does it first
  // checks it off. A parent can turn jobs on or off, change how often, or give a job to someone.

  function jobSettings(job) {
    const r = room();
    if (!r.jobs) r.jobs = {};
    return r.jobs[job.id] || (r.jobs[job.id] = {});
  }

  // Everyone who shares the room: owners of anything in it, or everyone if nobody owns anything.
  function roomPeople() {
    const ids = uniq(room().pieces.flatMap(p => p.owners || [])).filter(id => S.data.people.some(x => x.id === id));
    return ids.length ? ids : S.data.people.map(x => x.id);
  }

  function jobWho(job) {
    const set = jobSettings(job);
    if (set.who && set.who.length) return set.who;
    const p = job.pieceId && pieceById(job.pieceId);
    const owners = p ? (p.owners || []).filter(id => S.data.people.some(x => x.id === id)) : [];
    return owners.length ? owners : roomPeople();
  }

  const jobFreq = job => jobSettings(job).freq || job.freq;
  const jobOn = job => jobSettings(job).on !== false && jobFreq(job) !== 'off';
  const jobDone = job => (room().jobsDone || {})[job.id] || null;
  const jobDue = job => jobOn(job) && Jobs.isDue(jobFreq(job), jobDone(job));

  function jobPlace(job) {
    if (job.pieceId) { const p = pieceById(job.pieceId); return p ? Furniture.render(p) : ''; }
    if (job.itemId) {
      const it = (room().wallItems || []).find(x => x.id === job.itemId);
      return it ? RoomMap.itemIcon(it.type) : '';
    }
    const pl = Jobs.PLACE[job.key] || '';
    return pl.startsWith('<') ? pl : `<svg viewBox="0 0 60 60"><text x="30" y="33" font-size="44" text-anchor="middle" dominant-baseline="central">${pl}</text></svg>`;
  }

  function jobCard(job, act = 'job-open') {
    const done = !jobDue(job);
    return `<button type="button" class="job-card ${done ? 'done' : ''}" data-act="${act}" data-id="${job.id}" aria-label="${esc(Jobs.LABEL[job.key])}">
      <span class="job-place">${jobPlace(job)}</span>
      <span class="job-tool">${Jobs.toolSvg(job.tool)}</span>
      ${done ? '<span class="tick" aria-hidden="true">✔️</span>' : ''}
      <span class="job-who">${ownerBadges(jobWho(job), 26)}</span>
    </button>`;
  }

  function renderJobs() {
    const all = Jobs.suggest(RoomMap.defaults(room()));
    if (parentUnlocked) { renderJobSettings(all); return; }
    const mineJobs = all.filter(j => jobOn(j) && jobWho(j).includes(currentId));
    const due = mineJobs.filter(jobDue), done = mineJobs.filter(j => !jobDue(j));
    const tab = (key, icon, word) => `<button type="button" class="tool-btn big ${tidyTab === key ? 'on' : ''}" data-act="tidy-tab" data-value="${key}">${icon} ${word}</button>`;
    const tabs = `<div class="opt-choices today-tabs">${tab('pictures', '🖼️', 'Pictures')}${tab('words', '🔤', 'Words')}</div>`;
    const wordRow = j => { const isDone = !jobDue(j); return `<button type="button" class="word-pick ${isDone ? 'picked' : ''}" data-act="job-open" data-id="${j.id}"><span class="word-box" aria-hidden="true">${isDone ? '✔️' : ''}</span><span class="word-pic">${Jobs.toolSvg(j.tool)}</span><span class="word-label">${esc(jobWords(j))}</span></button>`; };
    if (tidyTab === 'words') {
      $app.innerHTML = `
        ${topBar('', '#/clean', `<span class="me-mini">${Stickers.render(personSticker(currentPerson()))}</span>${lockButton()}`)}
        <main>
          ${tabs}
          <div class="word-list">${due.map(wordRow).join('')}</div>
          ${!due.length ? `<div class="all-done"><span aria-hidden="true">🌟</span></div>` : ''}
          ${done.length ? `<div class="word-list done-grid">${done.map(wordRow).join('')}</div>` : ''}
        </main>`;
      return;
    }
    $app.innerHTML = `
      ${topBar('', '#/clean', `<span class="me-mini">${Stickers.render(personSticker(currentPerson()))}</span>${lockButton()}`)}
      <main>
        ${tabs}
        <div class="job-grid">${due.map(j => jobCard(j)).join('')}</div>
        ${!due.length ? `<div class="all-done"><span aria-hidden="true">🌟</span></div>` : ''}
        ${done.length ? `<div class="job-grid done-grid">${done.map(j => jobCard(j)).join('')}</div>` : ''}
      </main>`;
  }

  // Parent settings: every job, on or off, how often, and who.
  function renderJobSettings(all) {
    const rows = all.map(j => {
      const on = jobOn(j), freq = jobFreq(j), set = jobSettings(j);
      const who = set.who || [];
      return `<section class="opt-row job-row ${on ? '' : 'off'}">
        <div class="job-row-head">${jobCard(j, 'noop')}<span class="job-name">${esc(Jobs.LABEL[j.key])}</span></div>
        <div class="opt-choices">
          <button type="button" class="tool-btn big ${on ? 'on' : ''}" data-act="job-toggle" data-id="${j.id}">${on ? '✅ On' : '⛔ Off'}</button>
          <button type="button" class="tool-btn big ${freq === 'daily' ? 'on' : ''}" data-act="job-freq" data-id="${j.id}" data-value="daily">☀️ Every day</button>
          <button type="button" class="tool-btn big ${freq === 'weekly' ? 'on' : ''}" data-act="job-freq" data-id="${j.id}" data-value="weekly">📅 Every week</button>
        </div>
        <div class="opt-choices job-who-picks">${S.data.people.map(x => stickerPick(x.id, who.includes(x.id), 'job-who', `data-id="${j.id}"`)).join('')}</div>
      </section>`;
    }).join('');
    $app.innerHTML = `
      ${topBar('Jobs', '#/clean', lockButton())}
      ${parentBanner()}
      <main class="piece-page">
        <p class="backup-note">Stickers picked here get the job. With none picked, it goes to whoever owns the thing, or everyone who shares the room.</p>
        ${rows}
      </main>`;
  }

  function openJob(id) {
    const job = Jobs.suggest(RoomMap.defaults(room())).find(j => j.id === id);
    if (!job) return;
    if (job.key === 'tidy') { location.hash = '#/tidy'; return; }
    const r = room();
    const target = job.pieceId || job.itemId || null;
    const placed = r.pieces.find(p => p.id === target && p.place) || (r.wallItems || []).find(x => x.id === target);
    const map = r.sizeSet ? RoomMap.render(r, mapPieces(), { step: 3, selected: target, noHandles: true }) : '';
    openModal(`
      <div class="job-head"><span class="job-big">${jobPlace(job)}</span><span class="job-big tool">${Jobs.toolSvg(job.tool)}</span></div>
      <p class="confirm-text">${esc(Jobs.LABEL[job.key])}</p>
      ${map && (placed || !target) ? `<div class="job-map">${map}</div>` : ''}
      <div class="confirm-row">
        <button type="button" class="big-btn no" data-act="modal-close" aria-label="Not yet">✖️</button>
        <button type="button" class="big-btn yes" data-act="job-done" data-id="${job.id}" aria-label="Done">✔️</button>
      </div>`);
  }

  // When all of today's jobs are done, it counts as a cleanup (once a day).
  function markJobDone(id) {
    const r = room();
    if (!r.jobsDone) r.jobsDone = {};
    r.jobsDone[id] = new Date().toISOString();
    if (!r.jobsBy) r.jobsBy = {};
    r.jobsBy[id] = currentId;
    const all = Jobs.suggest(RoomMap.defaults(r));
    const left = all.filter(j => jobOn(j) && jobWho(j).includes(currentId) && jobDue(j));
    const day = `${Jobs.today()}:${currentId}`;
    if (!left.length && r.jobsCounted !== day) {
      r.jobsCounted = day;
      S.addCleanup();
      saveOrWarn();
      Effects.celebrate();
    } else {
      saveOrWarn();
      Effects.chime();
    }
  }

  // ---------- 📋 Today: everyone's progress ----------
  // Anyone can look. Pictures for kids, words for parents and readers.
  // Phones start on Words; tablets and computers start on Pictures.

  let todayTab = null;

  const PIECE_WORD = { bed: 'bed', dresser: 'dresser', table: 'side table', cubby: 'cubby', bookshelf: 'bookshelf', wire: 'wire shelf', wallshelf: 'wall shelf', tower: 'drawers' };

  function pieceWord(p) {
    if (!p) return '';
    if (p.kind === 'container') return p.sub === 'recycle' ? 'recycling bin' : 'trash can';
    return PIECE_WORD[p.kind] || 'furniture';
  }

  function jobWords(job) {
    const p = job.pieceId && pieceById(job.pieceId);
    const it = job.itemId && (room().wallItems || []).find(x => x.id === job.itemId);
    const named = (p && p.label) || (it && it.label) || '';
    let text = Jobs.LABEL[job.key];
    if (job.key === 'dust') text = `Dust the ${pieceWord(p)}`;
    if (job.key === 'trash') text = 'Empty the trash can';
    return named ? `${text} (${named})` : text;
  }

  function jobsFor(pid) {
    return Jobs.suggest(RoomMap.defaults(room())).filter(j => jobOn(j) && jobWho(j).includes(pid));
  }

  function tidiesToday(pid) {
    const day = Jobs.today();
    return (room().tidies || []).filter(t => t.who === pid && t.at.slice(0, 10) === day).length;
  }

  function doneBy(job) {
    const by = (room().jobsBy || {})[job.id];
    return by && S.data.people.find(x => x.id === by) ? by : null;
  }

  function renderToday() {
    if (!todayTab) todayTab = window.innerWidth < 600 ? 'words' : 'pictures';
    const people = S.data.people;
    const sections = people.map(person => {
      const list = jobsFor(person.id);
      const done = list.filter(j => !jobDue(j));
      const tidies = tidiesToday(person.id);
      const sticker = `<span class="today-sticker">${Stickers.render(personSticker(person))}</span>`;
      if (todayTab === 'words') {
        const rows = list.map(j => {
          const isDone = !jobDue(j);
          const by = isDone ? doneBy(j) : null;
          const who = by && by !== person.id ? ` · done by ${esc(people.find(x => x.id === by).name || 'someone')}` : '';
          const when = isDone && jobFreq(j) === 'weekly' ? ' · this week' : '';
          return `<li class="${isDone ? 'done' : ''}"><span aria-hidden="true">${isDone ? '✔️' : '⬜'}</span> ${esc(jobWords(j))}<span class="today-note">${when}${who}</span></li>`;
        }).join('');
        return `<section class="today-person">
          <div class="today-head">${sticker}<div><h2>${esc(person.name || 'No name')}</h2>
            <p class="today-count">${done.length} of ${list.length} jobs done · ${tidies} tidy-up${tidies === 1 ? '' : 's'} today</p></div></div>
          ${list.length ? `<ul class="today-list">${rows}</ul>` : '<p class="today-count">No jobs.</p>'}
        </section>`;
      }
      const dots = list.map(j => `<span class="today-dot ${jobDue(j) ? '' : 'on'}"></span>`).join('');
      return `<section class="today-person">
        <div class="today-head">${sticker}<div class="today-dots" aria-label="${done.length} of ${list.length} done">${dots}</div>
          ${tidies ? `<span class="today-tidies" aria-label="${tidies} tidy-ups today">${'🧺'.repeat(Math.min(tidies, 5))}</span>` : ''}</div>
        <div class="job-grid today-grid">${list.map(j => jobCard(j, 'noop')).join('')}</div>
      </section>`;
    }).join('');
    const tab = (key, icon, word) => `<button type="button" class="tool-btn big ${todayTab === key ? 'on' : ''}" data-act="today-tab" data-value="${key}">${icon} ${word}</button>`;
    $app.innerHTML = `
      ${topBar('', '#/', lockButton())}
      ${parentBanner()}
      <main>
        <div class="opt-choices today-tabs">${tab('pictures', '🖼️', 'Pictures')}${tab('words', '🔤', 'Words')}</div>
        <p class="today-settings"><a class="tool-btn big" href="#/where">📍 Where does it go?</a>${parentUnlocked ? ` <a class="tool-btn big" href="#/jobs">⚙️ Job settings</a>` : ''}</p>
        ${people.length ? sections : ''}
      </main>`;
  }

  // ---------- 📍 Where does it go? (words, for grown-ups and readers) ----------
  // Starts from the thing: each kind (socks, books) and each named thing, with every spot it goes.

  const nth = n => n + (n % 10 === 1 && n % 100 !== 11 ? 'st' : n % 10 === 2 && n % 100 !== 12 ? 'nd' : n % 10 === 3 && n % 100 !== 13 ? 'rd' : 'th');
  // "top drawer", "2nd drawer from the top", "bottom drawer"
  const rowWord = (what, i, n) => (n < 2 ? what : i === 0 ? `top ${what}` : i === n - 1 ? `bottom ${what}` : `${nth(i + 1)} ${what} from the top`);
  const sideWord = (i, n) => (n < 2 ? '' : n === 2 ? ['left', 'right'][i] : n === 3 ? ['left', 'middle', 'right'][i] : `${nth(i + 1)} from the left`);

  const PIECE_NAME = {
    bed: 'Bed', dresser: 'Dresser', table: 'Side table', cubby: 'Cubby', bookshelf: 'Bookshelf', wire: 'Wire shelves', wallshelf: 'Wall shelf',
    tower: 'Drawers', closet: 'Closet', pockets: 'Pocket organizer', hooks: 'Hooks', wallsorter: 'Wall sorter', seat: 'Seat',
  };

  function pieceName(p) {
    let name = PIECE_NAME[p.kind] || 'Furniture';
    if (p.kind === 'container') {
      const sub = p.sub || '';
      name = /^hamper/.test(sub) ? 'Hamper' : /^trash/.test(sub) ? 'Trash can' : sub === 'recycle' ? 'Recycling bin' : /^bag/.test(sub) ? 'Bag' : /^box/.test(sub) ? 'Box' : 'Basket';
    }
    if (p.label) name += ` (${p.label})`;
    const host = p.insideId ? pieceById(p.insideId) : null;
    if (host) return `${name} in the ${pieceName(host).toLowerCase()}`;
    if (p.hangOn) {
      const door = (room().wallItems || []).find(x => x.id === p.hangOn);
      const on = door ? `door${door.label ? ` (${door.label})` : ''}` : (pieceById(p.hangOn) ? pieceName(pieceById(p.hangOn)).toLowerCase() : 'door');
      return `${name} on the ${on}`;
    }
    return name;
  }

  // The words for one space inside a piece: "top drawer, left side", "2nd tray", "low rod".
  function spaceWords(p, sid) {
    const join = (...xs) => xs.filter(Boolean).join(', ');
    if (Furniture.hasParts(p)) {
      if (p.top && p.top.id === sid) return 'on top';
      for (let ci = 0; ci < p.cols.length; ci++) {
        const cells = p.cols[ci].cells;
        for (let ki = 0; ki < cells.length; ki++) {
          const k = cells[ki];
          const si = (k.spots || []).findIndex(s => s.id === sid);
          if (k.id !== sid && si < 0) continue;
          let what = k.type === 'drawer' ? 'drawer' : k.type === 'cupboard' ? 'cupboard' : 'cubby';
          if (k.type === 'open') {
            what = { bin: 'bin', sorter: 'paper sorter', drawers: 'paper drawers' }[k.insert] ||
              (p.kind === 'bookshelf' || p.style === 'wire' || p.kind === 'table' ? 'shelf' : 'cubby');
          }
          const nc = p.cols.length;
          const where = nc > 3 ? `${what} in row ${ki + 1}, ${nth(ci + 1)} from the left`
            : join(rowWord(what, ki, cells.length), nc > 1 && `${sideWord(ci, nc)} side`);
          if (si < 0) return where;
          const n = k.spots.length;
          const inner = k.type === 'cupboard' ? rowWord('shelf', si, n) : k.insert === 'sorter' ? rowWord('tray', si, n) : rowWord('drawer', si, n);
          return join(where, inner);
        }
      }
      return '';
    }
    if (p.kind === 'closet') {
      const ti = (p.shelves || []).findIndex(s => s.id === sid);
      if (ti >= 0) return p.shelves.length > 1 ? `top shelf ${ti + 1}` : 'top shelf';
      if (p.floor && p.floor.id === sid) return 'floor';
      const secs = p.sections || [];
      for (let i = 0; i < secs.length; i++) {
        const sec = secs[i], side = sideWord(i, secs.length) && `${sideWord(i, secs.length)} side`;
        const ri = sec.rods.findIndex(s => s.id === sid);
        const shi = sec.shelves.findIndex(s => s.id === sid);
        if (ri >= 0) return join(sec.kind === 'two' ? (ri === 0 ? 'top rod' : 'bottom rod') : sec.kind === 'low' ? 'low rod' : 'rod', side);
        if (shi >= 0) return join(rowWord('shelf', shi, sec.shelves.length), side);
      }
      return '';
    }
    if (p.kind === 'pockets') {
      const i = (p.pockets || []).findIndex(s => s.id === sid);
      const cols = p.cols || 1;
      return i < 0 ? '' : `pocket in row ${Math.floor(i / cols) + 1}, ${nth((i % cols) + 1)} from the left`;
    }
    if (p.kind === 'hooks') {
      const i = (p.hooks || []).findIndex(s => s.id === sid);
      return p.hooks.length > 1 && i >= 0 ? `${nth(i + 1)} hook` : '';
    }
    if (p.kind === 'wallsorter') {
      const a = p.slots.findIndex(s => s.id === sid), b = p.keys.findIndex(s => s.id === sid);
      return a >= 0 ? `${nth(a + 1)} slot` : b >= 0 ? `${nth(b + 1)} key hook` : '';
    }
    return '';
  }

  function placeLine(p, space) {
    const owners = ownersOf(p, space).map(id => S.data.people.find(x => x.id === id).name || 'someone');
    const where = spaceWords(p, space.id);
    return { pieceId: p.id, spaceId: space.id, text: [pieceName(p), where].filter(Boolean).join(' · '), owners };
  }

  // Every kind and named thing, with where each one goes.
  function whereRows() {
    const custom = S.data.customHolds || [];
    const pieces = room().pieces;
    const spotsFor = key => pieces.flatMap(p => Furniture.spacesOf(p).filter(s => (s.holds || []).includes(key)).map(s => placeLine(p, s)));
    const groups = [...Items.GROUPS.map(g => ({ label: g.label, keys: g.items.map(([k]) => k) })), { label: 'My photos', keys: custom.map(c => c.key) }];
    return groups.map(g => {
      const rows = [];
      g.keys.forEach(key => {
        const spots = spotsFor(key);
        if (spots.length) rows.push({ id: `k:${key}`, pic: Items.icon(key, custom), name: Items.label(key, custom), spots });
        things().filter(t => t.kind === key).forEach(t => {
          const h = homeOf(t);
          const whose = (t.owners || []).map(id => (S.data.people.find(x => x.id === id) || {}).name).filter(Boolean);
          const name = t.label || `${Items.label(key, custom) || 'Thing'}${whose.length ? ` (${whose.join(' and ')})` : ''}`;
          rows.push({ id: `t:${t.id}`, pic: thingArt(t), name, spots: h ? [placeLine(h.p, h.space)] : [], thing: true });
        });
      });
      return { label: g.label, rows };
    }).filter(g => g.rows.length);
  }

  function renderWhere() {
    const groups = whereRows();
    const body = groups.map(g => `<section class="where-group"><h2 class="where-head">${esc(g.label)}</h2>
      ${g.rows.map(r => `<div class="where-row">
        <span class="where-pic">${r.pic}</span>
        <div class="where-text"><p class="where-name">${esc(r.name)}</p>
          ${r.spots.length ? r.spots.map(s => `<button type="button" class="where-spot" data-act="where-show" data-id="${s.pieceId}" data-sid="${s.spaceId}">
            📍 ${esc(s.text)}${s.owners.length ? ` <span class="today-note">· ${esc(s.owners.join(', '))}</span>` : ''}</button>`).join('')
            : '<p class="today-note">No home yet</p>'}
        </div></div>`).join('')}</section>`).join('');
    $app.innerHTML = `
      ${topBar('Where does it go?', '#/today')}
      <main>
        ${body || '<p class="backup-note">Nothing has a spot yet. Open a drawer or cubby in My Room and pick 🧺 what goes there, or give a thing a home in 🧸 Things.</p>'}
      </main>`;
  }

  // Show the spot: the piece with the space glowing, and the piece on the map.
  function showWhere(pieceId, spaceId) {
    const p = pieceById(pieceId);
    if (!p) return;
    const r = room();
    let top = p;
    while (top && top.insideId && pieceById(top.insideId)) top = pieceById(top.insideId);
    const target = top.hangOn || top.id;
    const onMap = r.pieces.some(q => q.id === target && q.place) || (r.wallItems || []).some(x => x.id === target);
    const map = r.sizeSet && onMap ? RoomMap.render(r, mapPieces(), { step: 3, selected: target, noHandles: true }) : '';
    openModal(`
      <div class="inside-view">${Furniture.render(p, { marks: homeMark(p, spaceId) })}</div>
      <p class="confirm-text">${esc([pieceName(p), spaceWords(p, spaceId)].filter(Boolean).join(' · '))}</p>
      ${map ? `<div class="job-map">${map}</div>` : ''}
      <div class="confirm-row"><button type="button" class="big-btn yes" data-act="modal-close" aria-label="Close">👍</button></div>`);
  }

  // ---------- Sticker page for one person ----------
  // Shows the whole shared collection. Your sticker has a ✔️.
  // Stickers someone else is using are taken and can't be picked.

  let pagePersonId = null;   // person whose sticker page is open ('new' while making a person)
  let pendingName = '';      // name typed before a new person picks a sticker

  function renderPersonPage(id) {
    const person = id === 'new' ? null : S.data.people.find(p => p.id === id);
    if (id !== 'new' && !person) { location.replace('#/who'); return; }
    if (pagePersonId !== id) pendingName = '';
    pagePersonId = id;

    const order = s => {
      const owner = ownerOf(s.id);
      if (person && owner && owner.id === person.id) return 0;
      return owner ? 2 : 1;
    };
    const list = [...S.data.stickers].sort((a, b) => order(a) - order(b));

    const items = list.map(s => {
      const owner = ownerOf(s.id);
      const mine = !!(person && owner && owner.id === person.id);
      const taken = !!owner && !mine;
      const tools = [];
      if (!taken) tools.push(`<button type="button" class="tool-btn" data-act="edit-sticker" data-id="${s.id}" aria-label="Change this sticker">✏️</button>`);
      if (parentUnlocked && !owner) tools.push(`<button type="button" class="tool-btn danger" data-act="delete-sticker" data-id="${s.id}" aria-label="Delete this sticker">🗑️</button>`);
      return `<div class="stk-item ${mine ? 'mine' : ''} ${taken ? 'taken' : ''}">
        <button type="button" class="circle-item" data-act="pick-sticker" data-id="${s.id}" aria-label="${taken ? 'Taken' : mine ? 'Your sticker' : 'Pick this sticker'}">
          <span class="circle sticker-circle"><span class="circle-art">${Stickers.render(s)}</span></span>
          ${mine ? '<span class="done-badge" aria-hidden="true">✔️</span>' : ''}
        </button>
        ${taken ? `<span class="circle-label taken-label">${esc(owner.name || '')}</span>` : ''}
        ${tools.length ? `<div class="parent-tools">${tools.join('')}</div>` : ''}
      </div>`;
    }).join('');

    const back = person && person.id === currentId ? '#/' : '#/who';
    const title = person ? (person.name || 'Stickers') : 'New person';
    $app.innerHTML = `
      ${topBar(title, back, lockButton())}
      ${parentBanner()}
      <main>
        <section class="opt-row name-row">
          <h2 class="opt-head"><span aria-hidden="true">✏️</span> Name (optional)</h2>
          <input class="text-input" id="person-name" type="text" maxlength="20" value="${esc(person ? person.name : pendingName)}" placeholder="Name">
        </section>
        <h2 class="section-title"><span aria-hidden="true">👇</span> ${person ? 'Pick your sticker' : 'Pick a sticker'}</h2>
        <div class="circle-grid sticker-grid">
          ${circle({ act: 'new-sticker', icon: '➕', label: 'Make one', color: 'var(--c-stickers)', extraClass: 'add-circle' })}
          ${items}
        </div>
        ${parentUnlocked && person ? `<div class="action-row">
          <button type="button" class="tool-btn big danger" data-act="person-delete">🗑️ Delete ${esc(person.name || 'this person')}</button>
        </div>` : ''}
      </main>`;
  }

  // Give a person a sticker. Makes the person first if they're new.
  function assignSticker(stickerId) {
    if (pagePersonId === 'new') {
      const p = { id: S.uid(), name: pendingName, stickerId };
      S.data.people.push(p);
      currentId = p.id;
    } else {
      const p = S.data.people.find(x => x.id === pagePersonId);
      if (p) p.stickerId = stickerId;
    }
    return saveOrWarn();
  }

  // ---------- Sticker builder ----------

  let draft = null;      // sticker being built
  let draftIsNew = true;
  let builderBack = '#/who';

  function renderStickerBuilder(id) {
    const existing = id ? stickerById(id) : null;
    if (id && !existing) { location.replace('#/who'); return; }
    // A sticker someone else is using can't be changed.
    const owner = existing && ownerOf(existing.id);
    if (owner && owner.id !== pagePersonId) { location.replace('#/who'); return; }
    builderBack = pagePersonId ? `#/people/${pagePersonId}` : '#/who';
    // Changing a sticker makes a new copy, so the one you started from stays in the collection.
    draftIsNew = true;
    draft = existing ? { ...clone(existing), id: S.uid() } : { ...clone(Stickers.DEFAULTS.person), id: S.uid() };
    // Older stickers kept a single "feeling"; turn it into eyes, mouth and cheeks.
    if (draft.feeling) draft = Stickers.applyPreset(draft, draft.feeling);
    // Very old person stickers used other eye names and had no mouth choice.
    if (!draft.mouth) draft.eyes = ({ dots: 'dot', big: 'shiny' })[draft.eyes] || draft.eyes;
    drawBuilder();
  }

  function drawBuilder() {
    const types = [
      { type: 'person', label: 'Person' },
      { type: 'alien', label: 'Alien' },
      { type: 'animal', label: 'Animal' },
    ];
    const typeRow = types.map(t => {
      const preview = draft.type === t.type ? draft : { ...Stickers.DEFAULTS[t.type], bg: draft.bg };
      return `<button type="button" class="pick ${draft.type === t.type ? 'picked' : ''}" data-act="sticker-type" data-value="${t.type}" aria-label="${t.label}" aria-pressed="${draft.type === t.type}">
        ${Stickers.render(preview)}<span class="pick-label">${t.label}</span></button>`;
    }).join('');

    const optionRows = Stickers.OPTIONS[draft.type].filter(opt => !opt.when || opt.when(draft)).map(opt => {
      let choices;
      if (opt.presets) {
        // Quick feelings: each fills in eyes, mouth, cheeks and extras at once.
        const current = Stickers.presetOf(draft);
        choices = opt.presets.map(f =>
          `<button type="button" class="pick small ${current === f ? 'picked' : ''}" data-act="sticker-preset" data-value="${f}" aria-label="${f}" aria-pressed="${current === f}">
            ${Stickers.render(Stickers.applyPreset(draft, f))}</button>`
        ).join('');
      } else if (opt.colors) {
        const list = opt.colors.includes(draft[opt.key]) || !draft[opt.key] ? opt.colors : [...opt.colors, draft[opt.key]];
        choices = list.map(c =>
          `<button type="button" class="swatch ${draft[opt.key] === c ? 'picked' : ''}" style="--swatch:${c}" data-act="sticker-opt" data-key="${opt.key}" data-value="${c}" aria-label="${opt.label} ${c}" aria-pressed="${draft[opt.key] === c}"></button>`
        ).join('') +
          `<button type="button" class="swatch more-colors" data-act="color-picker" data-for="sticker-opt" data-key="${opt.key}" aria-label="More colors"><span aria-hidden="true">➕</span></button>`;
      } else {
        choices = (typeof opt.styles === 'function' ? opt.styles(draft) : opt.styles).map(v =>
          `<button type="button" class="pick small ${draft[opt.key] === v ? 'picked' : ''}" data-act="sticker-opt" data-key="${opt.key}" data-value="${v}" data-num="${typeof v === 'number'}" aria-label="${opt.label} ${v}" aria-pressed="${draft[opt.key] === v}">
            ${Stickers.render({ ...draft, [opt.key]: v, ...(opt.key === 'hair' ? { hat: 'none' } : {}) })}</button>`
        ).join('');
      }
      return `<section class="opt-row">
        <h2 class="opt-head"><span aria-hidden="true">${opt.icon}</span> ${opt.label}</h2>
        <div class="opt-choices">${choices}</div>
      </section>`;
    }).join('');

    $app.innerHTML = `
      ${topBar(draftIsNew ? 'Make a sticker' : 'Change sticker', builderBack)}
      <main class="builder">
        <div class="builder-preview">${Stickers.render(draft)}</div>
        <section class="opt-row start-row">
          <h2 class="opt-head"><span aria-hidden="true">✨</span> Start from</h2>
          <div class="opt-choices">${Stickers.STARTERS.map((st, i) =>
            `<button type="button" class="pick small" data-act="sticker-start" data-value="${i}" aria-label="Start from this sticker">${Stickers.render({ ...Stickers.DEFAULTS[st.type], ...st })}</button>`).join('')}</div>
        </section>
        <div class="type-row">${typeRow}</div>
        ${optionRows}
        <div class="action-row">
          <button type="button" class="big-btn yes" data-act="sticker-save" aria-label="Save sticker">✔️</button>
        </div>
      </main>`;
  }

  // ---------- Rewards ----------

  function rewardProgress(r) {
    const done = Math.max(0, Math.min(r.goal, S.data.cleanups - r.startCount));
    const ready = r.earned || done >= r.goal;
    return { done: ready ? r.goal : done, ready };
  }

  function rewardPicture(pic) {
    if (pic && pic.type === 'photo') return `<img class="reward-photo" src="${pic.data}" alt="">`;
    return `<span class="circle-emoji" aria-hidden="true">${pic ? pic.value : '🎁'}</span>`;
  }

  function starsHtml(done, goal) {
    if (goal <= 10) {
      let out = '';
      for (let i = 0; i < goal; i++) out += `<span class="star ${i < done ? 'on' : ''}">★</span>`;
      return `<div class="stars" aria-label="${done} of ${goal}">${out}</div>`;
    }
    return `<div class="bar" aria-label="${done} of ${goal}"><span style="width:${(done / goal) * 100}%"></span></div>`;
  }

  function renderRewards() {
    const rewards = [...S.data.rewards].sort((a, b) => Number(a.collected) - Number(b.collected));
    const lock = parentUnlocked
      ? `<button type="button" class="round-btn parent-on" data-act="lock" aria-label="Lock parent mode">🔓</button>`
      : `<button type="button" class="round-btn" data-act="unlock" aria-label="Parent mode">🔒</button>`;

    const cards = rewards.map(r => {
      const { done, ready } = rewardProgress(r);
      const state = r.collected ? 'collected' : ready ? 'ready' : '';
      const tools = parentUnlocked ? `<div class="parent-tools">
          ${r.collected
            ? `<button type="button" class="tool-btn" data-act="reward-again" data-id="${r.id}">↺ Again</button>`
            : `<button type="button" class="tool-btn ${r.earned ? 'on' : ''}" data-act="reward-earned" data-id="${r.id}">⭐ ${r.earned ? 'Earned ✔' : 'Earned'}</button>`}
          <button type="button" class="tool-btn" data-act="reward-edit" data-id="${r.id}" aria-label="Edit reward">✏️</button>
        </div>` : '';
      return `<div class="reward-card ${state}">
        <button type="button" class="circle-item" data-act="reward-tap" data-id="${r.id}" aria-label="${esc(r.label || 'Reward')}">
          <span class="circle reward-circle">${rewardPicture(r.picture)}</span>
          ${r.collected ? '<span class="done-badge" aria-hidden="true">✔️</span>' : ready ? '<span class="ready-badge" aria-hidden="true">🎉</span>' : ''}
        </button>
        ${starsHtml(done, r.goal)}
        ${r.label ? `<span class="circle-label">${esc(r.label)}</span>` : ''}
        ${tools}
      </div>`;
    }).join('');

    let body;
    if (!rewards.length && !parentUnlocked) {
      body = `<div class="placeholder">
        <div class="placeholder-art" aria-hidden="true">🎁</div>
        <p>No rewards yet. A grown-up can tap 🔒 to add one.</p>
      </div>`;
    } else {
      body = `<div class="circle-grid rewards-grid">
        ${cards}
        ${parentUnlocked ? circle({ act: 'reward-new', icon: '➕', label: 'Add reward', color: 'var(--c-rewards)', extraClass: 'add-circle' }) : ''}
      </div>`;
    }

    $app.innerHTML = `
      ${topBar('Rewards', '#/', lock)}
      ${parentUnlocked ? `<div class="parent-banner">Parent mode is on. Tap 🔓 to lock it.</div>` : ''}
      <main>${body}</main>`;
  }

  // Reward editor (parents only)
  const REWARD_PICTURES = ['🍬', '🍭', '🍦', '🍔', '🍕', '🧸', '🎮', '📚', '🎨', '💵', '🎢', '🎬', '⚽', '🏊', '🛝', '🎁'];
  let rewardDraft = null;
  let rewardIsNew = true;

  function openRewardEditor(id) {
    const existing = id ? S.data.rewards.find(r => r.id === id) : null;
    rewardIsNew = !existing;
    rewardDraft = existing ? clone(existing) : {
      id: S.uid(), label: '', goal: 5, picture: { type: 'emoji', value: '🎁' },
      startCount: S.data.cleanups, earned: false, collected: false,
    };
    drawRewardEditor();
  }

  function drawRewardEditor() {
    const r = rewardDraft;
    const emojiGrid = REWARD_PICTURES.map(e =>
      `<button type="button" class="emoji-pick ${r.picture.type === 'emoji' && r.picture.value === e ? 'picked' : ''}" data-act="reward-emoji" data-value="${e}" aria-label="${e}">${e}</button>`
    ).join('');
    openModal(`
      <h2 class="modal-title">${rewardIsNew ? 'Add a reward' : 'Change reward'}</h2>
      <div class="reward-preview circle">${rewardPicture(r.picture)}</div>
      <div class="photo-row">
        <label class="tool-btn big">📷 Take photo
          <input type="file" accept="image/*" capture="environment" data-photo hidden>
        </label>
        <label class="tool-btn big">🖼️ Choose picture
          <input type="file" accept="image/*" data-photo hidden>
        </label>
      </div>
      <div class="emoji-grid">${emojiGrid}</div>
      <label class="field">
        <span>Name (optional)</span>
        <input class="text-input" id="reward-label" type="text" maxlength="30" value="${esc(r.label)}" placeholder="Like: Trip to the park">
      </label>
      <div class="field">
        <span>Cleanups needed</span>
        <div class="stepper">
          <button type="button" class="round-btn" data-act="goal-down" aria-label="Fewer">➖</button>
          <span class="goal-num" id="goal-num">${r.goal}</span>
          <button type="button" class="round-btn" data-act="goal-up" aria-label="More">➕</button>
        </div>
      </div>
      <div class="action-row">
        <button type="button" class="big-btn no" data-act="modal-close" aria-label="Cancel">✖️</button>
        ${rewardIsNew ? '' : `<button type="button" class="big-btn delete" data-act="reward-delete" aria-label="Delete reward">🗑️</button>`}
        <button type="button" class="big-btn yes" data-act="reward-save" aria-label="Save reward">✔️</button>
      </div>`);
  }

  // Shrinks a photo to a small square so many fit on the device.
  function readPhoto(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.naturalWidth, img.naturalHeight);
        const sx = (img.naturalWidth - side) / 2;
        const sy = (img.naturalHeight - side) / 2;
        const out = 360;
        const canvas = document.createElement('canvas');
        canvas.width = out;
        canvas.height = out;
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, out, out);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that picture')); };
      img.src = url;
    });
  }

  // ---------- Parent PIN ----------

  let pinEntry = '';
  let pinFirst = null;
  let pinOnOk = null;

  function askPin(onOk) {
    pinEntry = '';
    pinFirst = null;
    pinOnOk = onOk;
    drawPin();
  }

  function drawPin(message) {
    const setting = !S.data.pin;
    const title = setting
      ? (pinFirst ? 'Enter the new PIN again' : 'Make a 4-number parent PIN')
      : 'Parent PIN';
    const dots = [0, 1, 2, 3].map(i => `<span class="pin-dot ${i < pinEntry.length ? 'on' : ''}"></span>`).join('');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'close'].map(k => {
      if (k === 'back') return `<button type="button" class="pin-key" data-act="pin-back" aria-label="Erase">⌫</button>`;
      if (k === 'close') return `<button type="button" class="pin-key" data-act="modal-close" aria-label="Cancel">✖️</button>`;
      return `<button type="button" class="pin-key" data-act="pin-digit" data-value="${k}">${k}</button>`;
    }).join('');
    openModal(`
      <h2 class="modal-title">🔒 ${title}</h2>
      ${message ? `<p class="pin-msg">${esc(message)}</p>` : ''}
      <div class="pin-dots" id="pin-dots">${dots}</div>
      <div class="pin-pad">${keys}</div>`);
  }

  function pinComplete() {
    const setting = !S.data.pin;
    if (setting) {
      if (!pinFirst) {
        pinFirst = pinEntry;
        pinEntry = '';
        drawPin();
        return;
      }
      if (pinFirst !== pinEntry) {
        pinFirst = null;
        pinEntry = '';
        drawPin('Those didn’t match. Let’s try again.');
        return;
      }
      S.data.pin = pinEntry;
      saveOrWarn();
    } else if (pinEntry !== S.data.pin) {
      pinEntry = '';
      drawPin('That PIN isn’t right.');
      wiggle(document.getElementById('pin-dots'));
      return;
    }
    closeModal();
    const cb = pinOnOk;
    pinOnOk = null;
    if (cb) cb();
  }

  // ---------- Actions ----------

  const actions = {
    'soon'(el) {
      wiggle(el);
      Effects.pop();
    },
    'modal-close'() {
      closeModal();
    },
    'confirm-no'() {
      confirmYes = null;
      closeModal();
    },
    'confirm-yes'() {
      const cb = confirmYes;
      confirmYes = null;
      closeModal();
      if (cb) cb();
    },

    // Stickers
    'sticker-type'(el) {
      const type = el.dataset.value;
      if (draft.type === type) return;
      // Keep the background and the expression when switching kind.
      const keep = { bg: draft.bg, eyes: draft.eyes, mouth: draft.mouth, cheeks: draft.cheeks, extra: draft.extra, hat: draft.hat, glasses: draft.glasses, neck: draft.neck };
      Object.keys(keep).forEach(k => { if (keep[k] === undefined) delete keep[k]; });
      draft = { ...clone(Stickers.DEFAULTS[type]), ...keep, id: draft.id };
      Effects.pop();
      drawBuilder();
    },
    'sticker-start'(el) {
      const st = Stickers.STARTERS[Number(el.dataset.value)];
      if (!st) return;
      draft = { ...clone(Stickers.DEFAULTS[st.type]), ...clone(st), id: draft.id };
      Effects.pop();
      const y = window.scrollY;
      drawBuilder();
      window.scrollTo(0, y);
    },
    'sticker-preset'(el) {
      draft = Stickers.applyPreset(draft, el.dataset.value);
      Effects.pop();
      const y = window.scrollY;
      drawBuilder();
      window.scrollTo(0, y);
    },
    'sticker-opt'(el) {
      const value = el.dataset.num === 'true' ? Number(el.dataset.value) : el.dataset.value;
      draft[el.dataset.key] = value;
      // Folded ears don't work on a wide cat face.
      if (draft.face === 'wide' && draft.ears === 'folded') draft.ears = 'pointy';
      Effects.pop();
      const y = window.scrollY;
      drawBuilder();
      window.scrollTo(0, y);
    },
    'sticker-save'() {
      // No two stickers may look exactly the same.
      const twin = S.data.stickers.find(s => s.id !== draft.id && lookKey(s) === lookKey(draft));
      if (twin) {
        infoBox(Stickers.render(twin), 'That sticker is already made. Try changing something!');
        return;
      }
      const list = S.data.stickers;
      const i = list.findIndex(s => s.id === draft.id);
      if (i >= 0) list[i] = clone(draft); else list.push(clone(draft));
      // A brand-new sticker made from someone's sticker page becomes theirs.
      if (draftIsNew && pagePersonId) {
        if (!assignSticker(draft.id)) return;
      } else if (!saveOrWarn()) {
        return;
      }
      Effects.celebrate();
      if (draftIsNew && pagePersonId === 'new') {
        pagePersonId = currentId;
        location.hash = '#/';
      } else {
        location.hash = builderBack;
      }
    },
    'pick-profile'(el) {
      currentId = el.dataset.id;
      Effects.pop();
      location.hash = '#/';
    },
    'pick-sticker'(el) {
      const id = el.dataset.id;
      const owner = ownerOf(id);
      if (owner && owner.id !== pagePersonId) { wiggle(el); Effects.pop(); return; }
      if (owner) { wiggle(el); return; } // already yours
      const wasNew = pagePersonId === 'new';
      if (!assignSticker(id)) return;
      Effects.celebrate();
      if (wasNew) {
        location.hash = '#/';
      } else {
        rerender();
      }
    },
    'edit-sticker'(el) {
      location.hash = `#/sticker/${el.dataset.id}`;
    },
    'new-sticker'() {
      location.hash = '#/sticker/new';
    },
    // Only parents can delete stickers, and only ones nobody is using.
    'delete-sticker'(el) {
      const s = stickerById(el.dataset.id);
      if (!s || ownerOf(s.id)) return;
      confirmBox(Stickers.render(s), 'Delete this sticker?', () => {
        S.data.stickers = S.data.stickers.filter(x => x.id !== s.id);
        saveOrWarn();
        rerender();
      });
    },
    // Deleting a person needs the parent PIN. Their sticker stays in the collection.
    'person-delete'() {
      const p = S.data.people.find(x => x.id === pagePersonId);
      if (!p) return;
      confirmBox(Stickers.render(personSticker(p)), `Delete ${p.name || 'this person'}?`, () => {
        S.data.people = S.data.people.filter(x => x.id !== p.id);
        saveOrWarn();
        if (currentId === p.id) currentId = null;
        location.hash = '#/who';
      });
    },

    // Map
    'map-step'(el) {
      mapStep = Number(el.dataset.value);
      mapSelected = null;
      Effects.pop();
      renderMap();
    },
    'map-next'() {
      const r = room();
      if (mapStep === 1) r.sizeSet = true;
      saveOrWarn();
      mapStep = Math.min(3, mapStep + 1);
      mapSelected = null;
      Effects.chime();
      renderMap();
    },
    'map-rotate'() {
      const r = room();
      r.view = (r.view + 1) % 4;
      saveOrWarn();
      Effects.pop();
      drawMapAll();
    },
    'map-size'(el) {
      const r = room();
      const dim = el.dataset.dim;
      RoomMap.resize(r, dim, r.size[dim] + Number(el.dataset.dir), mapPieces());
      saveOrWarn();
      Effects.pop();
      drawMapAll();
    },
    'map-deselect'() {
      mapSelected = null;
      drawMapAll();
    },
    'map-turn'() {
      const p = pieceById(mapSelected);
      if (!p || !p.place) return;
      p.place.rot = ((p.place.rot || 0) + 1) % 4;
      const keep = { ...p.place };
      // Turning a piece away from the wall shouldn't snap it right back.
      const { hx, hy } = RoomMap.halfSize(p);
      const r = room();
      p.place.x = Math.max(hx, Math.min(r.size.w - hx, keep.x));
      p.place.y = Math.max(hy, Math.min(r.size.d - hy, keep.y));
      saveOrWarn();
      Effects.pop();
      drawMapAll();
    },
    'map-open'() {
      if (mapSelected) location.hash = `#/rooms/my-room/piece/${mapSelected}`;
    },
    'map-unplace'() {
      const p = pieceById(mapSelected);
      if (p) delete p.place;
      mapSelected = null;
      saveOrWarn();
      Effects.pop();
      drawMapAll();
    },
    'open-backup'() {
      askPin(() => { backupUnlocked = true; location.hash = '#/backup'; });
    },
    'backup-copy'() {
      const text = backupText();
      const done = () => { markBackedUp(); renderBackup(); infoBox('📋', 'Copied! Paste it into a note or an email to keep it safe.'); };
      try {
        navigator.clipboard.writeText(text).then(done, () => showBackupText(text));
      } catch (e) {
        showBackupText(text);
      }
    },
    'backup-file'() {
      const text = backupText();
      try {
        const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `messy-room-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        markBackedUp();
      } catch (e) {
        showBackupText(text);
      }
    },
    'restore-text'() {
      const box = document.getElementById('restore-text');
      askRestore(box ? box.value : '');
    },
    'piece-owner'(el) {
      const p = pieceById(pagePieceId);
      if (!p) return;
      const pid = el.dataset.pid;
      const owners = p.owners || [];
      const apply = () => {
        p.owners = owners.includes(pid) ? owners.filter(x => x !== pid) : [...owners, pid];
        saveOrWarn();
        Effects.pop();
        redrawPiece();
      };
      // Taking a piece away from someone else needs the parent PIN.
      if (owners.includes(pid) && pid !== currentId) askPin(apply); else apply();
    },
    'space-owner'(el) {
      const p = pieceById(pagePieceId);
      const space = p && findSpace(p, el.dataset.sid);
      if (!space) return;
      const pid = el.dataset.pid;
      const now = ownersOf(p, space);
      const apply = () => {
        space.owners = now.includes(pid) ? now.filter(x => x !== pid) : [...now, pid];
        saveOrWarn();
        Effects.pop();
        redrawPiece();
        reopenInside();
      };
      if (now.includes(pid) && pid !== currentId) askPin(() => { apply(); }); else apply();
    },
    'space-hold'(el) {
      const p = pieceById(pagePieceId);
      const space = p && findSpace(p, el.dataset.sid);
      if (!space) return;
      const key = el.dataset.key;
      const holds = space.holds || [];
      space.holds = holds.includes(key) ? holds.filter(x => x !== key) : [...holds, key];
      saveOrWarn();
      Effects.pop();
      redrawPiece();
      reopenInside();
    },
    'inside-spot'(el) {
      if (!insideCtx) return;
      insideCtx.spot = Number(el.dataset.value);
      Effects.pop();
      reopenInside();
    },
    'inside-insert'(el) {
      const p = pieceById(pagePieceId);
      const k = p && Furniture.findCell(p, el.dataset.id);
      if (!k || k.insert === el.dataset.value) return;
      const insert = el.dataset.value;
      guardUsed((k.spots || []).some(Furniture.spaceUsed) || Furniture.spaceUsed(k), () => {
        Furniture.setInsert(k, insert);
        if (insert === 'drawers' && !['#3d4a45', '#ffffff'].includes(k.binColor)) k.binColor = '#3d4a45';
        if (insert === 'bin' && (!k.binColor || k.binColor === '#3d4a45')) k.binColor = Furniture.BIN_COLORS[1];
        saveOrWarn();
        Effects.pop();
        redrawPiece();
        openPartInside(p, k.id);
      });
    },
    'color-picker'(el) {
      openColorPicker(el.dataset.for, el.dataset.key);
    },
    'pick-color'(el) {
      const act = pickerFor;
      closeModal();
      const dataset = { value: el.dataset.value };
      if (pickerKey) dataset.key = pickerKey;
      if (act && actions[act]) actions[act]({ dataset });
    },
    'door-color'(el) {
      const door = room().wallItems.find(it => it.id === pageDoorId);
      if (!door) return;
      door.color = el.dataset.value;
      saveOrWarn();
      Effects.pop();
      const y = window.scrollY;
      renderDoorPage(pageDoorId);
      window.scrollTo(0, y);
    },
    'door-save'() {
      saveOrWarn();
      Effects.chime();
      location.hash = '#/rooms/my-room';
    },
    'hang-add'() {
      const target = location.hash.startsWith('#/rooms/my-room/door/') ? pageDoorId : pagePieceId;
      location.hash = `#/rooms/my-room/hang/${target}`;
    },
    'map-open-door'() {
      if (mapSelected) location.hash = `#/rooms/my-room/door/${mapSelected}`;
    },
    'pockets-size'(el) {
      const p = pieceById(pagePieceId);
      if (!p) return;
      const dim = el.dataset.dim, next = p[dim] + Number(el.dataset.dir);
      if (next < 1 || next > (dim === 'cols' ? 8 : 10)) { wiggle(el); return; }
      // Pockets that would go away, row by row from the end
      const after = Furniture.sizePockets({ ...p, [dim]: next, pockets: p.pockets.slice() });
      const kept = new Set(after.pockets.map(x => x.id));
      const losing = p.pockets.some(x => !kept.has(x.id) && Furniture.spaceUsed(x));
      guardUsed(losing, () => changePiece(q => { q[dim] = next; Furniture.sizePockets(q); }));
    },
    'hooks-count'(el) {
      const p = pieceById(pagePieceId);
      if (!p) return;
      const next = p.count + Number(el.dataset.dir);
      if (next < 2 || next > 10) { wiggle(el); return; }
      const losing = next < p.count && Furniture.spaceUsed(p.hooks[p.hooks.length - 1]);
      guardUsed(losing, () => changePiece(q => { q.count = next; Furniture.sizeHooks(q); }));
    },
    'closet-side'() {
      closetOutside = !closetOutside;
      selectedPart = null;
      Effects.pop();
      redrawPiece();
    },
    'closet-doors'(el) {
      changePiece(p => {
        p.doors = el.dataset.value;
        if (p.doors === 'none') closetOutside = false;
        // A curtain starts in a soft color; doors start white.
        if (p.doors === 'curtain' && p.doorColor === '#ffffff') p.doorColor = '#b9a2ff';
        else if (p.doors !== 'curtain' && p.doorColor === '#b9a2ff') p.doorColor = '#ffffff';
      });
    },
    'map-stretch'(el) {
      const r = room();
      const dir = Number(el.dataset.dir);
      const it = r.wallItems.find(x => x.id === mapSelected);
      if (it) {
        const w = RoomMap.itemW(it) + dir * (it.type === 'switch' ? 0.2 : 0.5);
        it.w = Math.round(Math.max(it.type === 'switch' ? 0.6 : 1.5, Math.min(RoomMap.wallLength(r, it.wall), w)) * 10) / 10;
        RoomMap.settleWallItem(r, it);
      } else {
        const p = pieceById(mapSelected);
        if (!p || !p.place) return;
        Furniture.setWidth(p, Furniture.footprint(p).w + dir * 0.5);
        RoomMap.settle(r, p);
      }
      saveOrWarn();
      Effects.pop();
      drawMapAll();
    },
    'map-depth'(el) {
      const p = pieceById(mapSelected);
      if (!p || !p.place) return;
      Furniture.setDepth(p, Furniture.footprint(p).d + Number(el.dataset.dir) * 0.3);
      RoomMap.settle(room(), p);
      saveOrWarn();
      Effects.pop();
      drawMapAll();
    },
    'rows'(el) {
      const p = pieceById(pagePieceId);
      if (!p) return;
      const rows = Math.max(...p.cols.map(c => c.cells.length));
      if (Number(el.dataset.dir) > 0) {
        if (rows >= 8) { wiggle(el); return; }
        changePiece(q => {
          q.cols.forEach(c => c.cells.push(Furniture.cell('open', c.cells[c.cells.length - 1].h)));
          q.h = clampSize(q.h * (rows + 1) / rows);
        });
        return;
      }
      if (rows <= 1) { wiggle(el); return; }
      const bottom = p.cols.map(c => c.cells[c.cells.length - 1]).filter(Boolean);
      guardUsed(bottom.some(Furniture.cellUsed), () => changePiece(q => {
        q.cols.forEach(c => { if (c.cells.length > 1) c.cells.pop(); });
        q.h = clampSize(q.h * (rows - 1) / rows);
        if (selectedPart && !Furniture.findCell(q, selectedPart)) selectedPart = null;
      }));
    },
    'wheels'(el) {
      changePiece(p => { p.wheels = el.dataset.value === 'on'; });
    },
    'piece-save'() {
      const p = pieceById(pagePieceId);
      if (!saveOrWarn()) return;
      Effects.chime();
      location.hash = pieceBack(p);
    },
    'map-flip'() {
      const it = room().wallItems.find(x => x.id === mapSelected);
      if (it) it.flip = !it.flip;
      saveOrWarn();
      Effects.pop();
      drawMapAll();
    },
    'map-remove'() {
      const r = room();
      r.pieces.forEach(p => { if (p.hangOn === mapSelected) delete p.hangOn; });
      r.wallItems = r.wallItems.filter(x => x.id !== mapSelected);
      mapSelected = null;
      saveOrWarn();
      Effects.pop();
      drawMapAll();
    },

    // My Room furniture
    'add-piece'(el) {
      const p = Furniture.make(el.dataset.key);
      if (!p) return;
      if (catalogCloset) p.insideId = catalogCloset;
      if (catalogHang) p.hangOn = catalogHang;
      room().pieces.push(p);
      if (!saveOrWarn()) return;
      Effects.chime();
      location.hash = `#/rooms/my-room/piece/${p.id}`;
    },
    'job-open'(el) {
      Effects.pop();
      openJob(el.dataset.id);
    },
    'job-done'(el) {
      closeModal();
      markJobDone(el.dataset.id);
      renderJobs();
    },
    'noop'() {},
    'tidy-tab'(el) {
      tidyTab = el.dataset.value;
      rerender();
    },
    'where-show'(el) {
      showWhere(el.dataset.id, el.dataset.sid);
    },
    'today-tab'(el) {
      todayTab = el.dataset.value;
      renderToday();
    },
    'job-toggle'(el) {
      const r = room();
      const set = r.jobs[el.dataset.id] || (r.jobs[el.dataset.id] = {});
      set.on = set.on === false;
      saveOrWarn();
      rerender();
    },
    'job-freq'(el) {
      const r = room();
      const set = r.jobs[el.dataset.id] || (r.jobs[el.dataset.id] = {});
      set.freq = el.dataset.value;
      set.on = true;
      saveOrWarn();
      rerender();
    },
    'job-who'(el) {
      const r = room();
      const set = r.jobs[el.dataset.id] || (r.jobs[el.dataset.id] = {});
      const who = set.who || [];
      set.who = who.includes(el.dataset.pid) ? who.filter(x => x !== el.dataset.pid) : [...who, el.dataset.pid];
      saveOrWarn();
      rerender();
    },
    'tidy-pick'(el) {
      const v = el.dataset.value;
      tidy.picks = tidy.picks.includes(v) ? tidy.picks.filter(x => x !== v) : [...tidy.picks, v];
      Effects.pop();
      const y = window.scrollY;
      renderTidy();
      window.scrollTo(0, y);
    },
    'tidy-mode'(el) {
      tidy.mode = el.dataset.value;
      Effects.pop();
      const y = window.scrollY;
      renderTidy();
      window.scrollTo(0, y);
    },
    'tidy-go'() {
      if (!tidy.picks.length) return;
      tidy.steps = buildSteps();
      tidy.i = 0;
      tidy.done = new Set();
      Effects.chime();
      location.hash = '#/tidy/go';
    },
    'tidy-next'() {
      nextStep();
    },
    'tidy-set-home'(el) {
      location.hash = `#/thing/${el.dataset.value.split(':')[1]}`;
    },
    'home-piece'(el) {
      homePiece = el.dataset.id;
      Effects.pop();
      renderThingHome();
      window.scrollTo(0, 0);
    },
    'home-spot'(el) {
      const hp = pieceById(homePiece);
      if (hp) setThingHome(hp, el.dataset.sid);
    },
    'thing-kind'(el) {
      thingDraft.kind = el.dataset.key;
      delete thingDraft.photo;
      thingDraft.color = null;
      Effects.pop();
      redrawThing();
    },
    'thing-color'(el) {
      thingDraft.color = el.dataset.value;
      Effects.pop();
      redrawThing();
    },
    'thing-pattern'(el) {
      thingDraft.pattern = el.dataset.value;
      Effects.pop();
      redrawThing();
    },
    'thing-owner'(el) {
      const pid = el.dataset.pid;
      const owners = thingDraft.owners || [];
      const saved = things().find(t => t.id === thingDraft.id);
      const apply = () => {
        thingDraft.owners = owners.includes(pid) ? owners.filter(x => x !== pid) : [...owners, pid];
        Effects.pop();
        redrawThing();
      };
      // Taking a thing away from someone else needs the parent PIN.
      const wasTheirs = saved && (saved.owners || []).includes(pid);
      if (owners.includes(pid) && pid !== currentId && wasTheirs) askPin(apply); else apply();
    },
    'thing-home'() {
      homePiece = null;
      location.hash = '#/thing-home';
    },
    'thing-home-clear'() {
      thingDraft.home = null;
      redrawThing();
    },
    'thing-save'() {
      const input = document.getElementById('thing-label');
      if (input) thingDraft.label = input.value.trim();
      const list = things();
      const i = list.findIndex(t => t.id === thingDraft.id);
      if (i >= 0) list[i] = clone(thingDraft); else list.push(clone(thingDraft));
      if (!saveOrWarn()) return;
      Effects.celebrate();
      thingDraft = null;
      location.hash = '#/things';
    },
    'thing-delete'() {
      const id = thingDraft.id;
      confirmBox(thingArt(thingDraft), 'Delete this?', () => {
        S.data.things = things().filter(t => t.id !== id);
        saveOrWarn();
        thingDraft = null;
        location.hash = '#/things';
      });
    },
    'open-piece'(el) {
      if (location.hash === '#/tidy/go') return;
      if (location.hash === '#/thing-home') { homePiece = el.dataset.id; renderThingHome(); return; }
      Effects.pop();
      location.hash = `#/rooms/my-room/piece/${el.dataset.id}`;
    },
    'closet-add'() {
      location.hash = `#/rooms/my-room/add/${pagePieceId}`;
    },
    'part'(el) {
      if (location.hash === '#/tidy/go') {
        const pk = pickFor(el.dataset.id);
        if (pk) putAway(pk); else { Effects.pop(); wiggle(el.closest('.piece-stage')); }
        return;
      }
      if (location.hash === '#/thing-home' && homePiece) {
        const hp = pieceById(homePiece);
        const spaces = hp ? spacesIn(hp, el.dataset.id) : [];
        if (spaces.length === 1) { setThingHome(hp, spaces[0].id); return; }
        if (spaces.length > 1) {
          openModal(`<div class="inside-view">${Furniture.renderInside(hp, el.dataset.id)}</div>
            <div class="spot-row">${spaces.map((sp, i) => `<button type="button" class="spot-btn" data-act="home-spot" data-sid="${sp.id}" aria-label="Space ${i + 1}">${i + 1}</button>`).join('')}</div>`);
        }
        return;
      }
      const p = pieceById(pagePieceId);
      if (!p) return;
      const id = el.dataset.id;
      if (partsMode && ((Furniture.hasParts(p) && p.style !== 'plastic' && p.style !== 'wire') || p.kind === 'closet')) {
        selectedPart = selectedPart === id ? null : id;
        Effects.pop();
        redrawPiece();
        return;
      }
      Effects.pop();
      insideCtx = null;
      openPartInside(p, id);
    },
    'parts-mode'() {
      partsMode = !partsMode;
      selectedPart = null;
      Effects.pop();
      redrawPiece();
    },
    'piece-color'(el) {
      changePiece(p => {
        if (p.kind === 'closet' && closetOutside) p.doorColor = el.dataset.value;
        else p.color = el.dataset.value;
      });
    },
    'piece-delete'() {
      const p = pieceById(pagePieceId);
      if (!p) return;
      const used = Furniture.spacesOf(p).some(Furniture.spaceUsed);
      confirmBox(Furniture.render(p), 'Delete this?', () => guardUsed(used, () => {
        const r = room();
        // Things standing in a deleted closet move out into the room.
        r.pieces.forEach(q => { if (q.insideId === p.id) delete q.insideId; });
        r.pieces = r.pieces.filter(q => q.id !== p.id);
        saveOrWarn();
        location.hash = p.insideId ? `#/rooms/my-room/piece/${p.insideId}` : '#/rooms/my-room';
      }));
    },
    'size-scale'(el) {
      changePiece(p => {
        p.hs = Math.round(Math.max(0.5, Math.min(2.5, (p.hs || 1) + Number(el.dataset.dir) * 0.15)) * 100) / 100;
      });
    },
    'size'(el) {
      const dim = el.dataset.dim, dir = Number(el.dataset.dir);
      changePiece(p => {
        if (p.kind === 'closet' && dim === 'w') {
          // A wider or narrower closet stretches every section a little.
          Furniture.fixCloset(p);
          const total = p.sections.reduce((a, x) => a + x.w, 0);
          const next = clampSize(total + dir);
          p.sections.forEach(x => { x.w = Math.max(1, Math.round(x.w * next / total * 10) / 10); });
          p.w = p.sections.reduce((a, x) => a + x.w, 0);
          return;
        }
        p[dim] = clampSize(p[dim] + dir * 0.5);
      });
    },
    'cols'(el) {
      const p = pieceById(pagePieceId);
      if (!p) return;
      const dir = Number(el.dataset.dir);
      if (dir > 0) {
        changePiece(q => {
          const last = q.cols[q.cols.length - 1];
          const cells = last.cells.map(k => Furniture.cell(k.type, k.h, { insert: k.insert, count: k.count, binColor: k.binColor, shelves: k.shelves, hinge: k.hinge }));
          q.w = clampSize(q.w + q.w / q.cols.length);
          q.cols.push(Furniture.col(cells, last.w));
        });
        return;
      }
      if (p.cols.length <= 1) { wiggle(el); return; }
      const last = p.cols[p.cols.length - 1];
      guardUsed(last.cells.some(Furniture.cellUsed), () => changePiece(q => {
        q.w = clampSize(q.w - q.w / q.cols.length);
        q.cols.pop();
        if (selectedPart && !Furniture.findCell(q, selectedPart)) selectedPart = null;
      }));
    },
    'part-type'(el) {
      const p = pieceById(pagePieceId);
      const k = p && Furniture.findCell(p, selectedPart);
      if (!k || k.type === el.dataset.value) return;
      const type = el.dataset.value;
      guardUsed(Furniture.cellUsed(k), () => changePiece(q => {
        const place = partPlace(q, k.id);
        if (!place) return;
        const hinge = k.hinge || (q.cols.indexOf(place.col) < q.cols.length / 2 ? 'l' : 'r');
        const fresh = Furniture.cell(type, k.h, { hinge, binColor: k.binColor || Furniture.BIN_COLORS[1] });
        fresh.id = k.id;
        place.col.cells[place.i] = fresh;
      }));
    },
    'part-insert'(el) {
      const p = pieceById(pagePieceId);
      const k = p && Furniture.findCell(p, selectedPart);
      if (!k || k.type !== 'open' || k.insert === el.dataset.value) return;
      const insert = el.dataset.value;
      // Trays or paper drawers that already hold things would go away.
      const losing = (k.spots || []).some(Furniture.spaceUsed);
      guardUsed(losing, () => changePiece(() => {
        Furniture.setInsert(k, insert);
        if (insert === 'drawers' && !['#3d4a45', '#ffffff'].includes(k.binColor)) k.binColor = '#3d4a45';
      }));
    },
    'insert-count'(el) {
      const p = pieceById(pagePieceId);
      const k = p && Furniture.findCell(p, selectedPart);
      if (!k || !k.spots) return;
      const next = k.count + Number(el.dataset.dir);
      const [, lo, hi] = Furniture.INSERT_COUNTS[k.insert];
      if (next < lo || next > hi) { wiggle(el); return; }
      const losing = next < k.count && Furniture.spaceUsed(k.spots[k.spots.length - 1]);
      guardUsed(losing, () => changePiece(() => { Furniture.setInsert(k, k.insert, next); }));
    },
    'bin-color'(el) {
      changePiece(p => {
        const k = Furniture.findCell(p, selectedPart);
        if (k) k.binColor = el.dataset.value;
      });
    },
    'cup-shelves'(el) {
      const p = pieceById(pagePieceId);
      const k = p && Furniture.findCell(p, selectedPart);
      if (!k || k.type !== 'cupboard') return;
      const dir = Number(el.dataset.dir);
      if (dir > 0) {
        if (k.shelves >= 4) { wiggle(el); return; }
        changePiece(() => { k.shelves += 1; k.spots.push({ id: Furniture.uid() }); });
        return;
      }
      if (k.shelves <= 0) { wiggle(el); return; }
      guardUsed(Furniture.spaceUsed(k.spots[k.spots.length - 1]), () => changePiece(q => {
        const kk = Furniture.findCell(q, k.id);
        kk.shelves -= 1;
        kk.spots.pop();
      }));
    },
    'part-size'(el) {
      changePiece(p => {
        const k = Furniture.findCell(p, selectedPart);
        if (k) k.h = Math.max(0.4, Math.min(4, Math.round((k.h + Number(el.dataset.dir) * 0.2) * 10) / 10));
      });
    },
    'part-add'() {
      changePiece(p => {
        const place = partPlace(p, selectedPart);
        if (!place) return;
        const k = place.col.cells[place.i];
        const n = place.col.cells.length;
        const fresh = Furniture.cell(k.type, k.h, { insert: k.insert, count: k.count, binColor: k.binColor, shelves: k.shelves, hinge: k.hinge });
        place.col.cells.splice(place.i + 1, 0, fresh);
        p.h = clampSize(p.h * (n + 1) / n);
        selectedPart = fresh.id;
      });
    },
    'part-remove'(el) {
      const p = pieceById(pagePieceId);
      const place = p && partPlace(p, selectedPart);
      if (!place) return;
      const k = place.col.cells[place.i];
      const lastInCol = place.col.cells.length === 1;
      if (lastInCol && p.cols.length === 1) { wiggle(el); return; }
      guardUsed(Furniture.cellUsed(k), () => changePiece(q => {
        const pl = partPlace(q, k.id);
        if (!pl) return;
        if (pl.col.cells.length === 1) {
          q.w = clampSize(q.w - q.w / q.cols.length);
          q.cols = q.cols.filter(c => c !== pl.col);
        } else {
          const n = pl.col.cells.length;
          pl.col.cells.splice(pl.i, 1);
          q.h = clampSize(q.h * (n - 1) / n);
        }
        selectedPart = null;
      }));
    },
    'tower-drawers'(el) {
      const p = pieceById(pagePieceId);
      if (!p) return;
      const cells = p.cols[0].cells;
      const dir = Number(el.dataset.dir);
      if (dir > 0) {
        if (cells.length >= 8) { wiggle(el); return; }
        changePiece(q => { q.cols[0].cells.push(Furniture.cell('drawer')); q.h = clampSize(q.h + 1.1); });
        return;
      }
      if (cells.length <= 1) { wiggle(el); return; }
      guardUsed(Furniture.cellUsed(cells[cells.length - 1]), () => changePiece(q => {
        q.cols[0].cells.pop();
        q.h = clampSize(q.h - 1.1);
      }));
    },
    'closet-shelves'(el) {
      const p = pieceById(pagePieceId);
      if (!p) return;
      const dir = Number(el.dataset.dir);
      if (dir > 0) {
        if (p.shelves.length >= 3) { wiggle(el); return; }
        changePiece(q => { q.shelves.push({ id: Furniture.uid() }); q.h = clampSize(q.h + 1.3); });
        return;
      }
      if (!p.shelves.length) { wiggle(el); return; }
      guardUsed(Furniture.spaceUsed(p.shelves[p.shelves.length - 1]), () => changePiece(q => {
        q.shelves.pop();
        q.h = clampSize(q.h - 1.3);
      }));
    },
    'sections'(el) {
      const p = pieceById(pagePieceId);
      if (!p) return;
      Furniture.fixCloset(p);
      if (Number(el.dataset.dir) > 0) {
        if (p.sections.length >= 4) { wiggle(el); return; }
        changePiece(q => {
          const sec = Furniture.section('high', 5);
          q.sections.push(sec);
          q.w = q.sections.reduce((a, x) => a + x.w, 0);
          selectedPart = sec.id;
        });
        return;
      }
      if (p.sections.length <= 1) { wiggle(el); return; }
      const sel = Furniture.findSection(p, selectedPart);
      const gone = sel || p.sections[p.sections.length - 1];
      guardUsed(Furniture.sectionSpaces(gone).some(Furniture.spaceUsed), () => changePiece(q => {
        q.sections = q.sections.filter(x => x.id !== gone.id);
        q.w = q.sections.reduce((a, x) => a + x.w, 0);
        selectedPart = null;
      }));
    },
    'section-kind'(el) {
      const p = pieceById(pagePieceId);
      const sec = p && Furniture.findSection(p, selectedPart);
      if (!sec || sec.kind === el.dataset.value) return;
      const kind = el.dataset.value;
      // Spaces the section stops using: shelves, or the lower rod.
      const after = { ...sec, kind };
      if (kind === 'shelves' && !sec.shelves.length) after.shelves = [1, 2, 3, 4].map(() => ({ id: Furniture.uid() }));
      const keep = new Set(Furniture.sectionSpaces(after).map(x => x.id));
      const losing = Furniture.sectionSpaces(sec).some(x => !keep.has(x.id) && Furniture.spaceUsed(x));
      guardUsed(losing, () => changePiece(() => {
        sec.kind = kind;
        sec.shelves = after.shelves;
      }));
    },
    'section-width'(el) {
      const p = pieceById(pagePieceId);
      const sec = p && Furniture.findSection(p, selectedPart);
      if (!sec) return;
      const d = Number(el.dataset.dir);
      if (d < 0 && sec.w <= 2) { wiggle(el); return; }
      if (d > 0 && p.w >= 28) { wiggle(el); return; }
      changePiece(q => { sec.w += d; q.w = q.sections.reduce((a, x) => a + x.w, 0); });
    },
    'section-shelves'(el) {
      const p = pieceById(pagePieceId);
      const sec = p && Furniture.findSection(p, selectedPart);
      if (!sec || sec.kind !== 'shelves') return;
      if (Number(el.dataset.dir) > 0) {
        if (sec.shelves.length >= 7) { wiggle(el); return; }
        changePiece(() => { sec.shelves.push({ id: Furniture.uid() }); });
        return;
      }
      if (sec.shelves.length <= 1) { wiggle(el); return; }
      guardUsed(Furniture.spaceUsed(sec.shelves[sec.shelves.length - 1]), () => changePiece(() => { sec.shelves.pop(); }));
    },

    // Parent mode (Rewards and sticker pages)
    'unlock'() {
      askPin(() => { parentUnlocked = true; rerender(); });
    },
    'lock'() {
      parentUnlocked = false;
      rerender();
    },

    // Rewards
    'reward-tap'(el) {
      const r = S.data.rewards.find(x => x.id === el.dataset.id);
      if (!r) return;
      const { ready } = rewardProgress(r);
      if (r.collected) { wiggle(el); return; }
      if (!ready) { wiggle(el); Effects.pop(); return; }
      r.collected = true;
      saveOrWarn();
      Effects.celebrate();
      renderRewards();
    },
    'reward-earned'(el) {
      const r = S.data.rewards.find(x => x.id === el.dataset.id);
      if (!r) return;
      r.earned = !r.earned;
      saveOrWarn();
      if (r.earned) Effects.chime();
      renderRewards();
    },
    'reward-again'(el) {
      const r = S.data.rewards.find(x => x.id === el.dataset.id);
      if (!r) return;
      r.collected = false;
      r.earned = false;
      r.startCount = S.data.cleanups;
      saveOrWarn();
      renderRewards();
    },
    'reward-new'() {
      openRewardEditor(null);
    },
    'reward-edit'(el) {
      openRewardEditor(el.dataset.id);
    },
    'reward-emoji'(el) {
      rewardDraft.picture = { type: 'emoji', value: el.dataset.value };
      syncRewardLabel();
      drawRewardEditor();
    },
    'goal-down'() {
      rewardDraft.goal = Math.max(1, rewardDraft.goal - 1);
      document.getElementById('goal-num').textContent = rewardDraft.goal;
    },
    'goal-up'() {
      rewardDraft.goal = Math.min(50, rewardDraft.goal + 1);
      document.getElementById('goal-num').textContent = rewardDraft.goal;
    },
    'reward-save'() {
      syncRewardLabel();
      const list = S.data.rewards;
      const i = list.findIndex(r => r.id === rewardDraft.id);
      if (i >= 0) list[i] = clone(rewardDraft); else list.push(clone(rewardDraft));
      if (!saveOrWarn()) return;
      closeModal();
      renderRewards();
    },
    'reward-delete'() {
      const id = rewardDraft.id;
      confirmBox('🗑️', 'Delete this reward?', () => {
        S.data.rewards = S.data.rewards.filter(r => r.id !== id);
        saveOrWarn();
        renderRewards();
      });
    },

    // PIN
    'pin-digit'(el) {
      if (pinEntry.length >= 4) return;
      pinEntry += el.dataset.value;
      Effects.pop();
      drawPinDots();
      if (pinEntry.length === 4) pinComplete();
    },
    'pin-back'() {
      pinEntry = pinEntry.slice(0, -1);
      drawPinDots();
    },
  };

  function drawPinDots() {
    const dots = document.querySelectorAll('.pin-dot');
    dots.forEach((d, i) => d.classList.toggle('on', i < pinEntry.length));
  }

  function syncRewardLabel() {
    const input = document.getElementById('reward-label');
    if (input && rewardDraft) rewardDraft.label = input.value.trim();
  }

  document.addEventListener('click', e => {
    if (suppressClick) { suppressClick = false; return; }
    const el = e.target.closest('[data-act]');
    if (!el) {
      if (e.target === $modal) closeModal();
      return;
    }
    const fn = actions[el.dataset.act];
    if (fn) fn(el, e);
  });

  document.addEventListener('input', e => {
    if (e.target.id === 'thing-label') {
      if (thingDraft) thingDraft.label = e.target.value.trim();
      return;
    }
    if (e.target.id === 'door-label') {
      const door = room().wallItems.find(it => it.id === pageDoorId);
      if (door) { door.label = e.target.value.trim(); S.save(); }
      return;
    }
    if (e.target.id === 'piece-label') {
      const p = pieceById(pagePieceId);
      if (p) { p.label = e.target.value.trim(); S.save(); }
      return;
    }
    if (e.target.id !== 'person-name') return;
    const name = e.target.value.trim();
    if (pagePersonId === 'new') {
      pendingName = name;
    } else {
      const p = S.data.people.find(x => x.id === pagePersonId);
      if (p) { p.name = name; S.save(); }
    }
  });

  document.addEventListener('change', async e => {
    if (e.target.matches('[data-thing-photo]') && e.target.files[0]) {
      try {
        thingDraft.photo = await readPhoto(e.target.files[0]);
        thingDraft.kind = 'photo';
        Effects.pop();
        redrawThing();
      } catch (err) {
        infoBox('🤔', 'That picture could not be used. Please try another one.');
      }
      return;
    }
    if (e.target.matches('[data-hold-photo]') && e.target.files[0]) {
      const sid = e.target.dataset.holdPhoto;
      try {
        const photo = await readPhoto(e.target.files[0]);
        if (!S.data.customHolds) S.data.customHolds = [];
        const key = 'own-' + S.uid();
        S.data.customHolds.push({ key, photo });
        const p = pieceById(pagePieceId);
        const space = p && findSpace(p, sid);
        if (space) space.holds = [...(space.holds || []), key];
        if (!saveOrWarn()) return;
        Effects.pop();
        redrawPiece();
        reopenInside();
      } catch (err) {
        infoBox('🤔', 'That picture could not be used. Please try another one.');
      }
      return;
    }
    if (e.target.matches('[data-restore-file]') && e.target.files[0]) {
      try { askRestore(await e.target.files[0].text()); } catch (err) { infoBox('🤔', 'That file could not be read.'); }
      e.target.value = '';
      return;
    }
    if (!e.target.matches('[data-photo]') || !e.target.files[0]) return;
    try {
      const data = await readPhoto(e.target.files[0]);
      syncRewardLabel();
      rewardDraft.picture = { type: 'photo', data };
      drawRewardEditor();
    } catch (err) {
      alert('That picture could not be used. Please try another one.');
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$modal.hidden) closeModal();
  });

  // ---------- Starter stickers ----------
  // Added to the shared collection once, so there's always something to pick.
  function addStarterStickers() {
    if (S.data.startersAdded) return;
    S.data.startersAdded = true;
    Stickers.STARTERS.forEach(st => {
      const full = { ...clone(Stickers.DEFAULTS[st.type]), ...st, id: S.uid() };
      // Skip a starter if someone already made one that looks exactly the same.
      if (!S.data.stickers.some(x => lookKey(x) === lookKey(full))) S.data.stickers.push(full);
    });
    S.save();
  }
  addStarterStickers();

  // ---------- Router ----------

  const routes = [
    [/^#\/?$/, renderHome],
    [/^#\/rooms$/, renderRooms],
    [/^#\/rooms\/my-room$/, renderMap],
    [/^#\/rooms\/my-room\/furniture$/, renderFurnitureList],
    [/^#\/rooms\/my-room\/add$/, () => renderCatalog('room')],
    [/^#\/rooms\/my-room\/add-closet$/, () => renderCatalog('closets')],
    [/^#\/rooms\/my-room\/hang\/([\w-]+)$/, m => renderCatalog('hang', m[1])],
    [/^#\/rooms\/my-room\/door\/([\w-]+)$/, m => renderDoorPage(m[1])],
    [/^#\/rooms\/my-room\/add\/([\w-]+)$/, m => renderCatalog('floor', m[1])],
    [/^#\/rooms\/my-room\/piece\/([\w-]+)$/, m => renderPiece(m[1])],
    [/^#\/rooms\/my-room\/piece\/([\w-]+)\/outside$/, m => renderPiece(m[1], true)],
    [/^#\/who$/, renderWho],
    [/^#\/people\/(new|[\w-]+)$/, m => renderPersonPage(m[1])],
    [/^#\/sticker\/new$/, () => renderStickerBuilder(null)],
    [/^#\/sticker\/([\w-]+)$/, m => renderStickerBuilder(m[1])],
    [/^#\/rewards$/, renderRewards],
    [/^#\/clean$/, renderClean],
    [/^#\/jobs$/, renderJobs],
    [/^#\/today$/, renderToday],
    [/^#\/where$/, renderWhere],
    [/^#\/tidy$/, () => { if (tidy.i >= tidy.steps.length && tidy.steps.length) tidy = { mode: tidy.mode, picks: [], steps: [], i: 0, done: new Set() }; renderTidy(); }],
    [/^#\/tidy\/go$/, renderTidyGo],
    [/^#\/things$/, () => { thingDraft = null; renderThings(); }],
    [/^#\/thing\/(new|[\w-]+)$/, m => renderThing(m[1])],
    [/^#\/thing-home$/, renderThingHome],
    [/^#\/backup$/, renderBackup],
  ];

  // These pages work before someone has picked who they are.
  const openToEveryone = /^#\/(who|people\/.+|sticker\/.+)$/;

  function renderRoute(hash) {
    for (const [re, fn] of routes) {
      const m = hash.match(re);
      if (m) { fn(m); return true; }
    }
    return false;
  }

  // Redraw the current page without leaving it (keeps parent mode on).
  function rerender() {
    const y = window.scrollY;
    renderRoute(location.hash || '#/');
    window.scrollTo(0, y);
  }

  let lastHash = null;

  function router() {
    const hash = location.hash || '#/';
    // Parent mode turns off whenever you leave the page.
    if (hash !== lastHash) parentUnlocked = false;
    if (hash !== '#/backup') backupUnlocked = false;
    if (hash !== lastHash && !hash.startsWith('#/rooms/my-room')) mapStep = null;
    if (hash !== lastHash) mapSelected = null;
    lastHash = hash;
    closeModal();
    if (!currentPerson() && !openToEveryone.test(hash)) {
      location.replace('#/who');
      return;
    }
    if (renderRoute(hash)) {
      window.scrollTo(0, 0);
    } else {
      location.hash = '#/';
    }
  }

  window.addEventListener('hashchange', router);
  // The app always opens on "Who are you?"
  if (location.hash !== '#/who') location.replace('#/who');
  router();
})();
