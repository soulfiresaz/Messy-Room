(() => {
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal');
  const S = Store;

  // Parent mode stays unlocked only while on the Rewards page.
  let parentUnlocked = false;

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
      </header>
      <main class="circle-grid home-grid">
        ${circle({ href: '#/rooms', icon: '🏠', label: 'Rooms', color: 'var(--c-rooms)' })}
        ${circle({ href: `#/people/${me.id}`, icon: mine, label: 'Stickers', color: 'var(--c-stickers)', extraClass: 'sticker-circle' })}
        ${circle({ href: '#/rewards', icon: '🎁', label: 'Rewards', color: 'var(--c-rewards)' })}
        ${circle({ icon: '🧽', label: 'Clean', color: 'var(--c-clean)', disabled: true })}
      </main>`;
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

  function renderMyRoom() {
    const pieces = room().pieces.filter(p => !p.insideId);
    $app.innerHTML = `
      ${topBar('My Room', '#/rooms')}
      <main>
        <div class="furn-grid">
          <a class="furn-card add-card" href="#/rooms/my-room/add" aria-label="Add furniture">
            <span class="add-plus" aria-hidden="true">➕</span>
          </a>
          ${pieces.map(p => pieceCard(p)).join('')}
        </div>
      </main>`;
  }

  // Ready-made pieces, shown as pictures. Inside a closet, only pieces that stand on its floor.
  function renderCatalog(closetId) {
    const closet = closetId ? pieceById(closetId) : null;
    if (closetId && !closet) { location.replace('#/rooms/my-room'); return; }
    const back = closet ? `#/rooms/my-room/piece/${closet.id}` : '#/rooms/my-room';
    const groups = Furniture.GROUPS.map(g => {
      const items = Furniture.CATALOG.filter(c => c.group === g.key)
        .map(c => ({ c, p: c.make() }))
        .filter(x => !closet || Furniture.fitsInCloset(x.p));
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
  let partsMode = false;     // "change the parts" is open
  let selectedPart = null;   // part picked while changing the parts
  let pagePieceId = null;

  // Removing or changing a space that already has things assigned needs the parent PIN.
  function guardUsed(used, fn) {
    if (used) askPin(fn); else fn();
  }

  function renderPiece(id) {
    const p = pieceById(id);
    if (!p) { location.replace('#/rooms/my-room'); return; }
    if (pagePieceId !== id) { partsMode = false; selectedPart = null; }
    pagePieceId = id;
    const back = p.insideId && pieceById(p.insideId) ? `#/rooms/my-room/piece/${p.insideId}` : '#/rooms/my-room';
    const inside = p.kind === 'closet' ? piecesIn(p.id) : [];
    const canChange = Furniture.hasParts(p) || p.kind === 'closet' || p.kind === 'wallshelf';
    const pic = Furniture.render(p, {
      interactive: true,
      selected: partsMode ? selectedPart : null,
      inside,
      addInside: p.kind === 'closet',
      pickSection: partsMode && p.kind === 'closet',
    });
    const colors = Furniture.COLORS.map(c =>
      `<button type="button" class="swatch ${p.color === c ? 'picked' : ''}" style="--swatch:${c}" data-act="piece-color" data-value="${c}" aria-label="Color" aria-pressed="${p.color === c}"></button>`).join('');
    $app.innerHTML = `
      ${topBar(p.label || '', back)}
      <main class="piece-page">
        <div class="piece-stage ${p.kind === 'closet' ? 'wide' : ''}">${pic}</div>
        <div class="piece-tools">
          ${canChange ? `<button type="button" class="round-btn ${partsMode ? 'on' : ''}" data-act="parts-mode" aria-label="Change the parts" aria-pressed="${partsMode}">🔧</button>` : ''}
          <button type="button" class="round-btn" data-act="piece-delete" aria-label="Delete">🗑️</button>
        </div>
        ${partsMode ? partsPanel(p) : ''}
        <section class="opt-row">
          <h2 class="opt-head"><span aria-hidden="true">🎨</span></h2>
          <div class="opt-choices">${colors}</div>
        </section>
        <section class="opt-row">
          <h2 class="opt-head"><span aria-hidden="true">🏷️</span> Label (optional)</h2>
          <input class="text-input" id="piece-label" type="text" maxlength="24" value="${esc(p.label)}" placeholder="Label">
        </section>
      </main>`;
  }

  const stepBtn = (act, icon, label, extra = '') =>
    `<button type="button" class="tool-btn step" data-act="${act}" ${extra} aria-label="${label}">${icon}</button>`;

  function partsPanel(p) {
    const rows = [];
    const size = `<div class="step-group"><span class="step-icon" aria-hidden="true">↔️</span>${stepBtn('size', '➖', 'Narrower', 'data-dim="w" data-dir="-1"')}${stepBtn('size', '➕', 'Wider', 'data-dim="w" data-dir="1"')}</div>` +
      (p.kind === 'wallshelf' ? '' : `<div class="step-group"><span class="step-icon" aria-hidden="true">↕️</span>${stepBtn('size', '➖', 'Shorter', 'data-dim="h" data-dir="-1"')}${stepBtn('size', '➕', 'Taller', 'data-dim="h" data-dir="1"')}</div>`);
    rows.push(`<section class="opt-row"><h2 class="opt-head">Size</h2><div class="opt-choices">${size}</div></section>`);

    if (p.kind === 'closet') {
      Furniture.fixCloset(p);
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
    if (!Furniture.hasParts(p)) return `<div class="parts-panel">${rows.join('')}</div>`;

    if (p.style === 'plastic') {
      const n = p.cols[0].cells.length;
      rows.push(`<section class="opt-row"><h2 class="opt-head">Drawers</h2><div class="opt-choices">
        <div class="step-group"><span class="step-num">${n}</span>${stepBtn('tower-drawers', '➖', 'Fewer drawers', 'data-dir="-1"')}${stepBtn('tower-drawers', '➕', 'More drawers', 'data-dir="1"')}</div></div></section>`);
      return `<div class="parts-panel">${rows.join('')}</div>`;
    }

    rows.push(`<section class="opt-row"><h2 class="opt-head">Columns</h2><div class="opt-choices">
      <div class="step-group"><span class="step-num">${p.cols.length}</span>${stepBtn('cols', '➖', 'Fewer columns', 'data-dir="-1"')}${stepBtn('cols', '➕', 'More columns', 'data-dir="1"')}</div></div></section>`);

    const k = selectedPart && Furniture.findCell(p, selectedPart);
    if (!k) {
      rows.push(`<p class="parts-hint"><span aria-hidden="true">👆</span> Tap a part to change it</p>`);
    } else {
      const types = [['drawer', 'Drawer'], ['open', 'Cubby'], ['cupboard', 'Cupboard']].map(([t, label]) =>
        `<button type="button" class="pick small square ${k.type === t ? 'picked' : ''}" data-act="part-type" data-value="${t}" aria-label="${label}" aria-pressed="${k.type === t}">${Furniture.partIcon(t)}</button>`).join('');
      rows.push(`<section class="opt-row"><h2 class="opt-head">This part</h2><div class="opt-choices">${types}</div></section>`);
      if (k.type === 'open') {
        const ins = [['empty', 'Empty'], ['bin', 'Bin'], ['sorter', 'Paper sorter']].map(([v, label]) =>
          `<button type="button" class="pick small square ${k.insert === v ? 'picked' : ''}" data-act="part-insert" data-value="${v}" aria-label="${label}" aria-pressed="${k.insert === v}">${Furniture.partIcon('open', v)}</button>`).join('');
        rows.push(`<section class="opt-row"><h2 class="opt-head">Inside</h2><div class="opt-choices">${ins}</div></section>`);
        if (k.insert === 'bin') {
          const bins = Furniture.BIN_COLORS.map(c =>
            `<button type="button" class="swatch ${k.binColor === c ? 'picked' : ''}" style="--swatch:${c}" data-act="bin-color" data-value="${c}" aria-label="Bin color" aria-pressed="${k.binColor === c}"></button>`).join('');
          rows.push(`<section class="opt-row"><h2 class="opt-head">Bin color</h2><div class="opt-choices">${bins}</div></section>`);
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
    openModal(`
      <div class="inside-view">${Furniture.renderInside(p, partId)}</div>
      <div class="confirm-row">
        <button type="button" class="big-btn yes" data-act="modal-close" aria-label="Close">👍</button>
      </div>`);
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
    draftIsNew = !existing;
    draft = existing ? clone(existing) : { ...clone(Stickers.DEFAULTS.person), id: S.uid() };
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
        choices = opt.colors.map(c =>
          `<button type="button" class="swatch ${draft[opt.key] === c ? 'picked' : ''}" style="--swatch:${c}" data-act="sticker-opt" data-key="${opt.key}" data-value="${c}" aria-label="${opt.label} ${c}" aria-pressed="${draft[opt.key] === c}"></button>`
        ).join('');
      } else {
        choices = (typeof opt.styles === 'function' ? opt.styles(draft) : opt.styles).map(v =>
          `<button type="button" class="pick small ${draft[opt.key] === v ? 'picked' : ''}" data-act="sticker-opt" data-key="${opt.key}" data-value="${v}" data-num="${typeof v === 'number'}" aria-label="${opt.label} ${v}" aria-pressed="${draft[opt.key] === v}">
            ${Stickers.render({ ...draft, [opt.key]: v })}</button>`
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

    // My Room furniture
    'add-piece'(el) {
      const p = Furniture.make(el.dataset.key);
      if (!p) return;
      if (catalogCloset) p.insideId = catalogCloset;
      room().pieces.push(p);
      if (!saveOrWarn()) return;
      Effects.chime();
      location.hash = `#/rooms/my-room/piece/${p.id}`;
    },
    'open-piece'(el) {
      Effects.pop();
      location.hash = `#/rooms/my-room/piece/${el.dataset.id}`;
    },
    'closet-add'() {
      location.hash = `#/rooms/my-room/add/${pagePieceId}`;
    },
    'part'(el) {
      const p = pieceById(pagePieceId);
      if (!p) return;
      const id = el.dataset.id;
      if (partsMode && ((Furniture.hasParts(p) && p.style !== 'plastic') || p.kind === 'closet')) {
        selectedPart = selectedPart === id ? null : id;
        Effects.pop();
        redrawPiece();
        return;
      }
      Effects.pop();
      openPartInside(p, id);
    },
    'parts-mode'() {
      partsMode = !partsMode;
      selectedPart = null;
      Effects.pop();
      redrawPiece();
    },
    'piece-color'(el) {
      changePiece(p => { p.color = el.dataset.value; });
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
          const cells = last.cells.map(k => Furniture.cell(k.type, k.h, { insert: k.insert, binColor: k.binColor, shelves: k.shelves, hinge: k.hinge }));
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
      changePiece(p => {
        const k = Furniture.findCell(p, selectedPart);
        if (k && k.type === 'open') k.insert = el.dataset.value;
      });
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
        const fresh = Furniture.cell(k.type, k.h, { insert: k.insert, binColor: k.binColor, shelves: k.shelves, hinge: k.hinge });
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
    const el = e.target.closest('[data-act]');
    if (!el) {
      if (e.target === $modal) closeModal();
      return;
    }
    const fn = actions[el.dataset.act];
    if (fn) fn(el, e);
  });

  document.addEventListener('input', e => {
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
    [/^#\/rooms\/my-room$/, renderMyRoom],
    [/^#\/rooms\/my-room\/add$/, () => renderCatalog(null)],
    [/^#\/rooms\/my-room\/add\/([\w-]+)$/, m => renderCatalog(m[1])],
    [/^#\/rooms\/my-room\/piece\/([\w-]+)$/, m => renderPiece(m[1])],
    [/^#\/who$/, renderWho],
    [/^#\/people\/(new|[\w-]+)$/, m => renderPersonPage(m[1])],
    [/^#\/sticker\/new$/, () => renderStickerBuilder(null)],
    [/^#\/sticker\/([\w-]+)$/, m => renderStickerBuilder(m[1])],
    [/^#\/rewards$/, renderRewards],
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
