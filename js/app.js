(() => {
  const $app = document.getElementById('app');
  const $modal = document.getElementById('modal');
  const S = Store;

  // Parent mode stays unlocked only while on the Rewards page.
  let parentUnlocked = false;

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

  // ---------- Home ----------

  function renderHome() {
    const latest = S.data.stickers[S.data.stickers.length - 1];
    const stickerIcon = latest ? Stickers.render(latest) : '😀';
    $app.innerHTML = `
      <header class="home-head">
        <h1 class="logo">Messy Room</h1>
      </header>
      <main class="circle-grid home-grid">
        ${circle({ href: '#/rooms', icon: '🏠', label: 'Rooms', color: 'var(--c-rooms)' })}
        ${circle({ href: '#/stickers', icon: stickerIcon, label: 'Stickers', color: 'var(--c-stickers)' })}
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

  function renderMyRoom() {
    $app.innerHTML = `
      ${topBar('My Room', '#/rooms')}
      <main class="placeholder">
        <div class="placeholder-art" aria-hidden="true">🛏️🚧</div>
        <p>The room builder is coming next.</p>
      </main>`;
  }

  // ---------- Stickers ----------

  function renderStickers() {
    const items = S.data.stickers.map(s =>
      circle({ href: `#/stickers/edit/${s.id}`, icon: Stickers.render(s), label: s.name || '', extraClass: 'sticker-circle' })
    ).join('');
    $app.innerHTML = `
      ${topBar('Stickers', '#/')}
      <main class="circle-grid">
        ${items}
        ${circle({ href: '#/stickers/new', icon: '➕', label: 'New', color: 'var(--c-stickers)', extraClass: 'add-circle' })}
      </main>`;
  }

  let draft = null;      // sticker being built
  let draftIsNew = true;

  function renderStickerBuilder(id) {
    const existing = id ? S.data.stickers.find(s => s.id === id) : null;
    if (id && !existing) { location.hash = '#/stickers'; return; }
    draftIsNew = !existing;
    draft = existing ? clone(existing) : { ...clone(Stickers.DEFAULTS.person), id: S.uid(), name: '' };
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

    const optionRows = Stickers.OPTIONS[draft.type].map(opt => {
      let choices;
      if (opt.colors) {
        choices = opt.colors.map(c =>
          `<button type="button" class="swatch ${draft[opt.key] === c ? 'picked' : ''}" style="--swatch:${c}" data-act="sticker-opt" data-key="${opt.key}" data-value="${c}" aria-label="${opt.label} ${c}" aria-pressed="${draft[opt.key] === c}"></button>`
        ).join('');
      } else {
        choices = opt.styles.map(v =>
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
      ${topBar(draftIsNew ? 'New sticker' : 'My sticker', '#/stickers')}
      <main class="builder">
        <div class="builder-preview">${Stickers.render(draft)}</div>
        <div class="type-row">${typeRow}</div>
        ${optionRows}
        <section class="opt-row">
          <h2 class="opt-head"><span aria-hidden="true">✏️</span> Name (optional)</h2>
          <input class="text-input" id="sticker-name" type="text" maxlength="20" value="${esc(draft.name)}" placeholder="Name">
        </section>
        <div class="action-row">
          ${draftIsNew ? '' : `<button type="button" class="big-btn delete" data-act="sticker-delete" aria-label="Delete sticker">🗑️</button>`}
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
      draft = { ...clone(Stickers.DEFAULTS[type]), bg: draft.bg, id: draft.id, name: draft.name };
      Effects.pop();
      drawBuilder();
    },
    'sticker-opt'(el) {
      const value = el.dataset.num === 'true' ? Number(el.dataset.value) : el.dataset.value;
      draft[el.dataset.key] = value;
      Effects.pop();
      const y = window.scrollY;
      drawBuilder();
      window.scrollTo(0, y);
    },
    'sticker-save'() {
      const list = S.data.stickers;
      const i = list.findIndex(s => s.id === draft.id);
      if (i >= 0) list[i] = clone(draft); else list.push(clone(draft));
      if (!saveOrWarn()) return;
      Effects.celebrate();
      location.hash = '#/stickers';
    },
    'sticker-delete'() {
      confirmBox(Stickers.render(draft), 'Delete this sticker?', () => {
        S.data.stickers = S.data.stickers.filter(s => s.id !== draft.id);
        saveOrWarn();
        location.hash = '#/stickers';
      });
    },

    // Rewards
    'unlock'() {
      askPin(() => { parentUnlocked = true; renderRewards(); });
    },
    'lock'() {
      parentUnlocked = false;
      renderRewards();
    },
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
    if (e.target.id === 'sticker-name' && draft) draft.name = e.target.value.trim();
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

  // ---------- Router ----------

  const routes = [
    [/^#\/?$/, renderHome],
    [/^#\/rooms$/, renderRooms],
    [/^#\/rooms\/my-room$/, renderMyRoom],
    [/^#\/stickers$/, renderStickers],
    [/^#\/stickers\/new$/, () => renderStickerBuilder(null)],
    [/^#\/stickers\/edit\/([\w-]+)$/, m => renderStickerBuilder(m[1])],
    [/^#\/rewards$/, renderRewards],
  ];

  function router() {
    const hash = location.hash || '#/';
    if (hash !== '#/rewards') parentUnlocked = false;
    closeModal();
    for (const [re, fn] of routes) {
      const m = hash.match(re);
      if (m) {
        fn(m);
        window.scrollTo(0, 0);
        return;
      }
    }
    location.hash = '#/';
  }

  window.addEventListener('hashchange', router);
  router();
})();
