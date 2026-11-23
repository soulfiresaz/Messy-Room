// Draws round stickers for people, aliens and animals.
const Stickers = (() => {
  const COLORS = {
    bg: ['#ffd6e0', '#ffe9a8', '#c8f0c0', '#bfe3ff', '#e2d4ff', '#ffd2b0', '#ffffff', '#ff8fb1', '#7fd1ff', '#9be7c4'],
    skin: ['#ffe0c7', '#f6c9a0', '#e0a878', '#c68642', '#a0662f', '#6e4423', '#4a2c17'],
    hair: ['#2b1b12', '#5a3825', '#a0522d', '#e0b050', '#f3d98b', '#d94f2b', '#9b9b9b', '#ff69b4', '#6a5acd', '#2fa8a0'],
    eye: ['#3b2a20', '#4a7bd0', '#3f9b5a', '#7a5230', '#222222', '#8a5cc7'],
    alien: ['#7ee081', '#8fd3ff', '#c79bff', '#ff9ecf', '#ffd36b', '#ff8a65', '#5ee0c8'],
    animal: ['#f4a259', '#8d6e63', '#fafafa', '#9e9e9e', '#3e3e3e', '#f6d365', '#ffb3c6', '#a5d8ff', '#b5e48c'],
  };

  // What each kind of sticker lets you choose. Icons keep it picture-first.
  const OPTIONS = {
    person: [
      { key: 'skin', icon: '🖐️', label: 'Skin', colors: COLORS.skin },
      { key: 'hair', icon: '💇', label: 'Hair', styles: ['short', 'long', 'curly', 'bun', 'pigtails', 'spiky', 'bald'] },
      { key: 'hairColor', icon: '🖍️', label: 'Hair color', colors: COLORS.hair },
      { key: 'eyes', icon: '👀', label: 'Eyes', styles: ['dots', 'big', 'happy', 'wink'] },
      { key: 'eyeColor', icon: '🔵', label: 'Eye color', colors: COLORS.eye },
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
    alien: [
      { key: 'color', icon: '👽', label: 'Alien color', colors: COLORS.alien },
      { key: 'head', icon: '🥚', label: 'Head', styles: ['round', 'tall', 'wide'] },
      { key: 'eyeCount', icon: '👀', label: 'Eyes', styles: [1, 2, 3] },
      { key: 'antennae', icon: '📡', label: 'Antennae', styles: [0, 1, 2] },
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
    animal: [
      { key: 'kind', icon: '🐾', label: 'Animal', styles: ['cat', 'dog', 'bunny', 'bear'] },
      { key: 'color', icon: '🖍️', label: 'Animal color', colors: COLORS.animal },
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
  };

  const DEFAULTS = {
    person: { type: 'person', bg: '#bfe3ff', skin: '#f6c9a0', hair: 'short', hairColor: '#5a3825', eyes: 'big', eyeColor: '#3b2a20' },
    alien: { type: 'alien', bg: '#e2d4ff', color: '#7ee081', head: 'round', eyeCount: 3, antennae: 2 },
    animal: { type: 'animal', bg: '#ffe9a8', kind: 'cat', color: '#f4a259' },
  };

  // Mix a hex color toward white (amt > 0) or black (amt < 0).
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    const target = amt > 0 ? 255 : 0;
    const a = Math.abs(amt);
    r = Math.round(r + (target - r) * a);
    g = Math.round(g + (target - g) * a);
    b = Math.round(b + (target - b) * a);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  const INK = '#3a2a2a';
  const smile = `<path d="M43 64 Q50 71 57 64" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const cheeks = `<circle cx="35" cy="61" r="4" fill="#ff7f9f" opacity=".45"/><circle cx="65" cy="61" r="4" fill="#ff7f9f" opacity=".45"/>`;

  function bigEye(x, y, r, color) {
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/>` +
      `<circle cx="${x}" cy="${y + r * 0.1}" r="${r * 0.62}" fill="${color}"/>` +
      `<circle cx="${x}" cy="${y + r * 0.1}" r="${r * 0.32}" fill="#111"/>` +
      `<circle cx="${x - r * 0.25}" cy="${y - r * 0.2}" r="${r * 0.2}" fill="#fff"/>`;
  }

  function personEye(style, x, y, color) {
    if (style === 'dots') return `<circle cx="${x}" cy="${y}" r="3.4" fill="${color}"/><circle cx="${x - 1}" cy="${y - 1.2}" r="1" fill="#fff"/>`;
    if (style === 'happy') return `<path d="M${x - 4.5} ${y + 1.5} Q${x} ${y - 4} ${x + 4.5} ${y + 1.5}" stroke="${color}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    return bigEye(x, y, 5.6, color);
  }

  function person(s) {
    const skin = s.skin, hc = s.hairColor;
    let back = '', front = '';
    const shortTop = `<path d="M25 48 Q24 21 50 21 Q76 21 75 48 Q68 33 50 33 Q33 33 25 48Z" fill="${hc}"/>`;
    switch (s.hair) {
      case 'short':
        front = shortTop;
        break;
      case 'long':
        back = `<path d="M23 50 Q22 19 50 19 Q78 19 77 50 L80 86 Q50 94 20 86Z" fill="${hc}"/>`;
        front = `<path d="M25 49 Q23 21 50 21 Q77 21 75 49 Q71 35 61 33 Q50 41 39 33 Q29 35 25 49Z" fill="${hc}"/>`;
        break;
      case 'curly':
        front = [[29, 38], [37, 29], [50, 25], [63, 29], [71, 38], [25, 48], [75, 48]]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9.5" fill="${hc}"/>`).join('');
        break;
      case 'bun':
        back = `<circle cx="50" cy="16" r="10" fill="${hc}"/>`;
        front = shortTop;
        break;
      case 'pigtails':
        back = `<circle cx="20" cy="56" r="10" fill="${hc}"/><circle cx="80" cy="56" r="10" fill="${hc}"/>`;
        front = shortTop;
        break;
      case 'spiky':
        front = `<path d="M25 46 L27 27 L35 33 L39 18 L47 29 L53 16 L59 29 L65 20 L67 33 L75 28 L75 46 Q50 31 25 46Z" fill="${hc}"/>`;
        break;
      default:
        break; // bald
    }
    let eyes;
    if (s.eyes === 'wink') {
      eyes = personEye('big', 41, 52, s.eyeColor) + personEye('happy', 59, 52, s.eyeColor);
    } else {
      eyes = personEye(s.eyes, 41, 52, s.eyeColor) + personEye(s.eyes, 59, 52, s.eyeColor);
    }
    return back +
      `<circle cx="26" cy="53" r="5" fill="${skin}"/><circle cx="74" cy="53" r="5" fill="${skin}"/>` +
      `<ellipse cx="50" cy="51" rx="24" ry="26" fill="${skin}"/>` +
      front + eyes + cheeks + smile;
  }

  function alien(s) {
    const c = s.color, dark = shade(c, -0.25);
    const heads = {
      round: { cx: 50, cy: 54, rx: 25, ry: 24, top: 30 },
      tall: { cx: 50, cy: 52, rx: 21, ry: 30, top: 22 },
      wide: { cx: 50, cy: 56, rx: 31, ry: 21, top: 35 },
    };
    const h = heads[s.head] || heads.round;
    let ant = '';
    if (s.antennae === 1) {
      ant = `<line x1="50" y1="${h.top + 2}" x2="50" y2="${h.top - 14}" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="${h.top - 16}" r="4.5" fill="${dark}"/>`;
    } else if (s.antennae === 2) {
      ant = `<line x1="41" y1="${h.top + 4}" x2="31" y2="${h.top - 12}" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="${h.top - 14}" r="4.5" fill="${dark}"/>` +
        `<line x1="59" y1="${h.top + 4}" x2="69" y2="${h.top - 12}" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><circle cx="70" cy="${h.top - 14}" r="4.5" fill="${dark}"/>`;
    }
    const ey = h.cy - 4;
    let eyes = '';
    if (s.eyeCount === 1) eyes = bigEye(50, ey, 9.5, '#222');
    else if (s.eyeCount === 2) eyes = bigEye(41, ey, 7, '#222') + bigEye(59, ey, 7, '#222');
    else eyes = bigEye(37, ey + 2, 6, '#222') + bigEye(50, ey - 6, 6, '#222') + bigEye(63, ey + 2, 6, '#222');
    const mouthY = h.cy + h.ry * 0.45;
    return ant +
      `<ellipse cx="${h.cx}" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}" fill="${c}"/>` +
      `<circle cx="${h.cx - h.rx * 0.55}" cy="${h.cy + h.ry * 0.5}" r="2.4" fill="${dark}" opacity=".5"/>` +
      `<circle cx="${h.cx + h.rx * 0.6}" cy="${h.cy - h.ry * 0.5}" r="2" fill="${dark}" opacity=".5"/>` +
      eyes +
      `<path d="M43 ${mouthY} Q50 ${mouthY + 6} 57 ${mouthY}" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  }

  function animal(s) {
    const c = s.color, light = shade(c, 0.55), dark = shade(c, -0.3);
    const eyes = `<circle cx="41" cy="52" r="3.6" fill="#1a1a1a"/><circle cx="59" cy="52" r="3.6" fill="#1a1a1a"/>` +
      `<circle cx="40" cy="50.8" r="1.1" fill="#fff"/><circle cx="58" cy="50.8" r="1.1" fill="#fff"/>`;
    const head = `<circle cx="50" cy="56" r="26" fill="${c}"/>`;
    switch (s.kind) {
      case 'dog':
        return '' +
          head +
          `<ellipse cx="26" cy="54" rx="9" ry="18" fill="${dark}" transform="rotate(14 26 54)"/>` +
          `<ellipse cx="74" cy="54" rx="9" ry="18" fill="${dark}" transform="rotate(-14 74 54)"/>` +
          `<ellipse cx="50" cy="66" rx="13" ry="10" fill="${light}"/>` + eyes +
          `<ellipse cx="50" cy="61" rx="5" ry="3.6" fill="#1a1a1a"/>` +
          `<path d="M45 68 Q50 72 55 68" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>` +
          `<path d="M48 70 Q50 77 52 70Z" fill="#ff7f9f"/>`;
      case 'bunny':
        return '' +
          `<ellipse cx="39" cy="22" rx="7.5" ry="20" fill="${c}"/><ellipse cx="61" cy="22" rx="7.5" ry="20" fill="${c}"/>` +
          `<ellipse cx="39" cy="23" rx="3.5" ry="14" fill="#ffb3c6"/><ellipse cx="61" cy="23" rx="3.5" ry="14" fill="#ffb3c6"/>` +
          head + eyes + cheeks +
          `<ellipse cx="50" cy="61" rx="3.6" ry="2.6" fill="#ff7f9f"/>` +
          `<rect x="46.5" y="65" width="7" height="6" rx="1.5" fill="#fff" stroke="${INK}" stroke-width="1"/>`;
      case 'bear':
        return '' +
          `<circle cx="29" cy="35" r="10" fill="${c}"/><circle cx="71" cy="35" r="10" fill="${c}"/>` +
          `<circle cx="29" cy="35" r="5" fill="${light}"/><circle cx="71" cy="35" r="5" fill="${light}"/>` +
          head +
          `<ellipse cx="50" cy="65" rx="12" ry="9" fill="${light}"/>` + eyes +
          `<ellipse cx="50" cy="61" rx="4.5" ry="3.2" fill="#1a1a1a"/>` +
          `<path d="M45 67 Q50 71 55 67" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      default: // cat
        return '' +
          `<path d="M27 44 L29 17 L47 33Z" fill="${c}"/><path d="M73 44 L71 17 L53 33Z" fill="${c}"/>` +
          `<path d="M31 37 L32 24 L41 32Z" fill="#ffb3c6"/><path d="M69 37 L68 24 L59 32Z" fill="#ffb3c6"/>` +
          head + eyes + cheeks +
          `<path d="M47 60 L53 60 L50 63.5Z" fill="#ff7f9f"/>` +
          `<path d="M50 63.5 Q47 67 44 65 M50 63.5 Q53 67 56 65" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>` +
          `<g stroke="${INK}" stroke-width="1.2" opacity=".6" stroke-linecap="round"><line x1="22" y1="60" x2="36" y2="62"/><line x1="22" y1="66" x2="36" y2="65"/><line x1="78" y1="60" x2="64" y2="62"/><line x1="78" y1="66" x2="64" y2="65"/></g>`;
    }
  }

  // Where the middle of each floating face is, and how much to enlarge it,
  // so every face sits centered in its circle.
  function frame(s) {
    if (s.type === 'alien') {
      return { round: [44, 1.08], tall: [42, 1.0], wide: [47, 1.1] }[s.head] || [44, 1.08];
    }
    if (s.type === 'animal') {
      return { cat: [50, 1.12], dog: [55, 1.15], bunny: [43, 0.98], bear: [53, 1.12] }[s.kind] || [50, 1.12];
    }
    return [49, 1.15];
  }

  let clipCounter = 0;

  // Returns an SVG string for a sticker, clipped to a circle.
  function render(sticker) {
    const s = { ...DEFAULTS[sticker.type || 'person'], ...sticker };
    const id = 'stk' + (++clipCounter);
    let art;
    if (s.type === 'alien') art = alien(s);
    else if (s.type === 'animal') art = animal(s);
    else art = person(s);
    const [cy, scale] = frame(s);
    return `<svg class="sticker-svg" viewBox="0 0 100 100" aria-hidden="true">` +
      `<defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs>` +
      `<g clip-path="url(#${id})"><rect width="100" height="100" fill="${s.bg}"/>` +
      `<g transform="translate(50 50) scale(${scale}) translate(-50 ${-cy})">${art}</g></g></svg>`;
  }

  return { COLORS, OPTIONS, DEFAULTS, render };
})();
