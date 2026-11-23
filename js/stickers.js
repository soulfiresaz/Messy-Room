// Draws round stickers: floating faces of people, aliens and animals.
// Style: flat shapes, a white sticker outline, and simple line faces
// whose eyes and mouth show a feeling.
const Stickers = (() => {
  const COLORS = {
    bg: ['#bfe3ff', '#c8f0c0', '#ffd6e0', '#ffe9a8', '#e2d4ff', '#ffd2b0', '#9be7c4', '#7fd1ff', '#ff8fb1', '#ffffff'],
    skin: ['#ffe0c7', '#f6c9a0', '#e0a878', '#c68642', '#a0662f', '#6e4423', '#4a2c17'],
    hair: ['#2b1b12', '#5a3825', '#a0522d', '#e0b050', '#f3d98b', '#d94f2b', '#9b9b9b', '#ff69b4', '#6a5acd', '#2fa8a0'],
    alien: ['#7ee081', '#8fd3ff', '#c79bff', '#ff9ecf', '#ffd36b', '#ff8a65', '#5ee0c8'],
    animal: ['#fbf8f3', '#f6e3c3', '#f5b04a', '#e8925a', '#a47551', '#b9a89a', '#9e9e9e', '#4a4545', '#ffc2d1'],
    patch: ['#f5a54a', '#e8925a', '#4a4545', '#6b4a3a', '#a47551', '#fbf8f3', '#9e9e9e', '#f6e3c3'],
  };

  const FEELINGS = ['happy', 'cute', 'silly', 'love', 'shy', 'sleepy', 'surprised', 'nervous', 'confused', 'grumpy'];

  const HAT = { key: 'hat', icon: '🎩', label: 'Hat', styles: ['none', 'party', 'crown', 'beanie', 'cap', 'bow', 'flower', 'tophat'] };
  const GLASSES = { key: 'glasses', icon: '👓', label: 'Glasses', styles: ['none', 'round', 'sun', 'heart', 'star'] };

  // What each kind of sticker lets you choose. Icons keep it picture-first.
  // "when" hides a choice that doesn't apply (like patch color on a plain coat).
  const OPTIONS = {
    person: [
      { key: 'feeling', icon: '😊', label: 'Feeling', styles: FEELINGS },
      { key: 'skin', icon: '🖐️', label: 'Skin', colors: COLORS.skin },
      { key: 'hair', icon: '💇', label: 'Hair', styles: ['short', 'long', 'curly', 'bun', 'pigtails', 'spiky', 'bald'] },
      { key: 'hairColor', icon: '🖍️', label: 'Hair color', colors: COLORS.hair },
      HAT, GLASSES,
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
    alien: [
      { key: 'feeling', icon: '😊', label: 'Feeling', styles: FEELINGS },
      { key: 'color', icon: '👽', label: 'Alien color', colors: COLORS.alien },
      { key: 'head', icon: '🥚', label: 'Head', styles: ['round', 'tall', 'wide'] },
      { key: 'eyeCount', icon: '👀', label: 'Eyes', styles: [1, 2, 3] },
      { key: 'antennae', icon: '📡', label: 'Antennae', styles: [0, 1, 2] },
      HAT, GLASSES,
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
    animal: [
      { key: 'kind', icon: '🐾', label: 'Animal', styles: ['cat', 'dog', 'bunny', 'bear'] },
      { key: 'feeling', icon: '😊', label: 'Feeling', styles: FEELINGS },
      { key: 'face', icon: '🐱', label: 'Face shape', styles: ['round', 'wide', 'tall', 'fluffy'], when: s => s.kind === 'cat' },
      { key: 'ears', icon: '👂', label: 'Ears', styles: ['pointy', 'big', 'folded'], when: s => s.kind === 'cat' },
      { key: 'coat', icon: '🎀', label: 'Coat', styles: ['plain', 'tabby', 'patch', 'twotone', 'calico', 'mask'] },
      { key: 'color', icon: '🖍️', label: 'Fur color', colors: COLORS.animal },
      { key: 'patchColor', icon: '🟠', label: 'Patch color', colors: COLORS.patch, when: s => s.coat !== 'plain' && s.coat !== 'tabby' },
      HAT, GLASSES,
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
  };

  const DEFAULTS = {
    person: { type: 'person', bg: '#bfe3ff', skin: '#f6c9a0', hair: 'short', hairColor: '#5a3825', feeling: 'happy', hat: 'none', glasses: 'none' },
    alien: { type: 'alien', bg: '#e2d4ff', color: '#7ee081', head: 'round', eyeCount: 3, antennae: 2, feeling: 'happy', hat: 'none', glasses: 'none' },
    animal: { type: 'animal', bg: '#bfe3ff', kind: 'cat', face: 'round', ears: 'pointy', coat: 'calico', color: '#fbf8f3', patchColor: '#f5a54a', feeling: 'happy', hat: 'none', glasses: 'none' },
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

  // How light a color is, from 0 (black) to 1 (white).
  function lightness(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  }

  const INK = '#3a2a2a';
  const LIGHT_INK = '#f7efe6';
  const PINK = '#f4a0a8';
  const line = (w = 1.7) => `stroke="${INK}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;

  // ---------- Faces: eyes, mouth and little extras for each feeling ----------

  const FEELING_PARTS = {
    happy: { eyes: ['happy', 'happy'], mouth: 'smile', extra: 'blush' },
    cute: { eyes: ['shiny', 'shiny'], mouth: 'smile', extra: 'blush' },
    silly: { eyes: ['dot', 'happy'], mouth: 'tongue' },
    love: { eyes: ['heart', 'heart'], mouth: 'smile', extra: 'blush' },
    shy: { eyes: ['dot', 'dot'], mouth: 'small', extra: 'shy' },
    sleepy: { eyes: ['sleepy', 'sleepy'], mouth: 'small', extra: 'zzz' },
    surprised: { eyes: ['wide', 'wide'], mouth: 'open' },
    nervous: { eyes: ['dot', 'dot'], mouth: 'wobble', extra: 'sweat' },
    confused: { eyes: ['dot', 'wide'], mouth: 'wobble', extra: 'question' },
    grumpy: { eyes: ['grumpy', 'grumpy'], mouth: 'frown' },
  };

  // One eye drawn around (0,0). side is -1 for the left eye, 1 for the right.
  function eye(kind, side) {
    switch (kind) {
      case 'happy': return `<path d="M-4 1.6 Q0 -4 4 1.6" ${line(2)}/>`;
      case 'sleepy': return `<path d="M-4 -1 Q0 3.6 4 -1" ${line(2)}/><path d="M${side * 4} -1 l${side * 1.8} -1.8" ${line(1.4)}/>`;
      case 'wide': return `<circle r="4.3" fill="#fff" stroke="${INK}" stroke-width="1.5"/><circle r="1.4" fill="${INK}"/>`;
      case 'shiny': return `<ellipse rx="3.4" ry="4.2" fill="${INK}"/><circle cx="-1.1" cy="-1.5" r="1.4" fill="#fff"/><circle cx="1.2" cy="1.6" r=".6" fill="#fff"/>`;
      case 'heart': return `<path d="M0 3.6 C-6 -0.5 -4 -6 0 -2.6 C4 -6 6 -0.5 0 3.6Z" fill="#ff5d8f"/>`;
      case 'grumpy': return `<ellipse rx="2.5" ry="3" fill="${INK}"/><path d="${side < 0 ? 'M-4 -7 L3.5 -4.2' : 'M-3.5 -4.2 L4 -7'}" ${line(1.8)}/>`;
      default: return `<ellipse rx="2.5" ry="3.1" fill="${INK}"/>`; // dot
    }
  }

  // Nose and mouth drawn around the nose at (0,0).
  function mouth(kind, nose, human) {
    let n = '';
    if (nose === 'pink') n = `<path d="M-2.4 -1.3 L2.4 -1.3 L0 1.4Z" fill="${PINK}" stroke="${shade(PINK, -0.15)}" stroke-width=".5" stroke-linejoin="round"/>`;
    if (nose === 'black') n = `<ellipse rx="3.6" ry="2.5" fill="${INK}"/><ellipse cx="-1" cy="-.8" rx="1.1" ry=".6" fill="#fff" opacity=".7"/>`;
    const smileW = human ? `<path d="M-5 2.5 Q0 8 5 2.5" ${line(1.8)}/>` : `<path d="M-5 2.8 Q-2.5 6 0 2.3 Q2.5 6 5 2.8" ${line(1.6)}/>`;
    switch (kind) {
      case 'tongue': return n + smileW + `<path d="M-1.7 ${human ? 4.6 : 4.2} Q0 10 1.7 ${human ? 4.6 : 4.2}Z" fill="#ff7f9f" stroke="${INK}" stroke-width=".8"/>`;
      case 'small': return n + `<path d="M-2.2 3.6 Q0 5.2 2.2 3.6" ${line(1.5)}/>`;
      case 'open': return n + `<ellipse cy="5.6" rx="2.6" ry="3.3" fill="#e57373" stroke="${INK}" stroke-width="1.3"/>`;
      case 'wobble': return n + `<path d="M-3.6 5 Q-1.8 3.4 0 5 Q1.8 6.6 3.6 5" ${line(1.5)}/>`;
      case 'frown': return n + `<path d="M-3.6 6 Q0 2.8 3.6 6" ${line(1.6)}/>`;
      default: return n + smileW; // smile
    }
  }

  // Draw a face. eyes: [[x, y], ...], size: eye size, nose: 'pink' | 'black' | 'none',
  // mouthAt: [x, y], cheeks: [[x, y], [x, y]], top: [x, y] place for extras like Zzz.
  function face(feeling, { eyes, size = 1, nose = 'none', mouthAt, cheeks, top, human = false }) {
    const parts = FEELING_PARTS[feeling] || FEELING_PARTS.happy;
    let out = '';
    eyes.forEach(([x, y], i) => {
      const side = x < 50 ? -1 : x > 50 ? 1 : (i % 2 ? 1 : -1);
      const kind = parts.eyes[eyes.length === 1 ? 0 : (side < 0 ? 0 : 1)];
      out += `<g transform="translate(${x} ${y}) scale(${size})">${eye(kind, side)}</g>`;
    });
    if (parts.extra === 'blush') {
      out += cheeks.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4.4" ry="2.5" fill="#ff8fa3" opacity=".55"/>`).join('');
    }
    if (parts.extra === 'shy') {
      out += cheeks.map(([x, y]) => `<g ${line(1.2)} stroke="#ff6f8f"><path d="M${x - 3.5} ${y + 1.5} l2 -3"/><path d="M${x - .5} ${y + 1.5} l2 -3"/><path d="M${x + 2.5} ${y + 1.5} l2 -3"/></g>`).join('');
    }
    out += `<g transform="translate(${mouthAt[0]} ${mouthAt[1]})">${mouth(parts.mouth, nose, human)}</g>`;
    const [tx, ty] = top;
    if (parts.extra === 'zzz') {
      out += `<g fill="#6a7fdb" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="700">` +
        `<text x="${tx}" y="${ty}" font-size="7">z</text><text x="${tx + 5}" y="${ty - 5}" font-size="9">Z</text></g>`;
    }
    if (parts.extra === 'sweat') {
      out += `<path transform="translate(${tx + 2} ${ty})" d="M0 -6 C1.8 -2.6 3.6 0 3.6 2 A3.6 3.6 0 0 1 -3.6 2 C-3.6 0 -1.8 -2.6 0 -6Z" fill="#8fd3ff" stroke="#fff" stroke-width="1.2"/>`;
    }
    if (parts.extra === 'question') {
      out += `<g fill="${INK}" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="700">` +
        `<text x="${tx - 22}" y="${ty + 2}" font-size="8">?</text><text x="${tx - 15}" y="${ty - 3}" font-size="10">?</text><text x="${tx - 6}" y="${ty + 1}" font-size="8">?</text></g>`;
    }
    return out;
  }

  // White sticker outline drawn behind a set of shapes.
  function outline(shapes, width = 6) {
    return `<g fill="#fff" stroke="#fff" stroke-width="${width}" stroke-linejoin="round">${shapes}</g>`;
  }

  // ---------- People ----------

  function person(s) {
    const skin = s.skin, hc = s.hairColor;
    let back = '', front = '';
    const shortTop = `<path d="M25 48 Q24 21 50 21 Q76 21 75 48 Q68 33 50 33 Q33 33 25 48Z" fill="${hc}"/>`;
    switch (s.hair) {
      case 'short':
        front = shortTop;
        break;
      case 'long':
        back = `<path d="M23 50 Q22 19 50 19 Q78 19 77 50 L79 80 Q50 87 21 80Z" fill="${hc}"/>`;
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
    const head = `<circle cx="26" cy="54" r="5" fill="${skin}"/><circle cx="74" cy="54" r="5" fill="${skin}"/>` +
      `<ellipse cx="50" cy="52" rx="24" ry="26" fill="${skin}"/>`;
    const eyes = [[41, 54], [59, 54]];
    const art = outline(back + head + front) + back + head + front +
      face(s.feeling, { eyes, size: 1.05, mouthAt: [50, 62], cheeks: [[35, 62], [65, 62]], top: [70, 28], human: true });
    const hatY = s.hair === 'spiky' ? 25 : s.hair === 'curly' ? 24 : 27;
    return { art, eyes, eyeSize: 1.05, hat: [50, hatY, 44] };
  }

  // ---------- Aliens ----------

  function alien(s) {
    const c = s.color, dark = shade(c, -0.25);
    const heads = {
      round: { cy: 54, rx: 25, ry: 24 },
      tall: { cy: 52, rx: 21, ry: 30 },
      wide: { cy: 56, rx: 31, ry: 21 },
    };
    const h = heads[s.head] || heads.round;
    const top = h.cy - h.ry;
    let ant = '';
    if (s.antennae === 1) {
      ant = `<line x1="50" y1="${top + 2}" x2="50" y2="${top - 13}" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="${top - 15}" r="4.5" fill="${dark}"/>`;
    } else if (s.antennae === 2) {
      ant = `<line x1="41" y1="${top + 4}" x2="31" y2="${top - 11}" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="${top - 13}" r="4.5" fill="${dark}"/>` +
        `<line x1="59" y1="${top + 4}" x2="69" y2="${top - 11}" stroke="${dark}" stroke-width="3" stroke-linecap="round"/><circle cx="70" cy="${top - 13}" r="4.5" fill="${dark}"/>`;
    }
    const headShape = `<ellipse cx="50" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}" fill="${c}"/>`;
    const spots = `<circle cx="${50 - h.rx * 0.6}" cy="${h.cy + h.ry * 0.45}" r="2.4" fill="${dark}" opacity=".45"/>` +
      `<circle cx="${50 + h.rx * 0.62}" cy="${h.cy - h.ry * 0.45}" r="2" fill="${dark}" opacity=".45"/>`;
    const ey = h.cy - 3;
    let eyes, size;
    if (s.eyeCount === 1) { eyes = [[50, ey]]; size = 1.9; }
    else if (s.eyeCount === 2) { eyes = [[41, ey], [59, ey]]; size = 1.35; }
    else { eyes = [[37, ey + 2], [50, ey - 6], [63, ey + 2]]; size = 1.15; }
    const art = outline(ant + headShape) + ant + headShape + spots +
      face(s.feeling, { eyes, size, mouthAt: [50, h.cy + h.ry * 0.38], cheeks: [[50 - h.rx * 0.62, ey + 9], [50 + h.rx * 0.62, ey + 9]], top: [50 + h.rx * 0.7, top + 4], human: true });
    return { art, eyes, eyeSize: size * 0.8, hat: [50, top + 5, h.rx * 1.25] };
  }

  // ---------- Animals ----------

  // Cat face shapes. Each has its own head, ear spot (left side; right is mirrored),
  // and where the eyes, mouth, cheeks, extras and hat go.
  function fluffyHead(cx, cy, rx, ry, bumps) {
    const pt = (a, k) => [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k].map(v => v.toFixed(1));
    let d = '';
    for (let i = 0; i < bumps; i++) {
      const a0 = (i / bumps) * Math.PI * 2, a1 = ((i + 1) / bumps) * Math.PI * 2, am = (a0 + a1) / 2;
      const p0 = pt(a0, 1), c = pt(am, 1.13), p1 = pt(a1, 1);
      d += (i === 0 ? `M${p0[0]} ${p0[1]}` : '') + ` Q${c[0]} ${c[1]} ${p1[0]} ${p1[1]}`;
    }
    return d + 'Z';
  }

  const CAT_FACES = {
    round: {
      head: 'M50 31 C72 31 86 41 86 59 C86 75 72 83 50 83 C28 83 14 75 14 59 C14 41 28 31 50 31Z',
      ear: { A: [16, 48], B: [46, 32], T: [20, 15] },
      eyes: [[36, 57], [64, 57]], mouthAt: [50, 63], cheeks: [[27, 66], [73, 66]], top: [74, 33], hat: [50, 35, 30],
    },
    wide: {
      head: 'M50 37 C76 37 91 47 91 61 C91 75 75 82 50 82 C25 82 9 75 9 61 C9 47 24 37 50 37Z',
      ear: { A: [13, 53], B: [42, 38], T: [16, 23] },
      eyes: [[34, 60], [66, 60]], mouthAt: [50, 66], cheeks: [[24, 68], [76, 68]], top: [76, 39], hat: [50, 40, 30],
    },
    tall: {
      head: 'M50 28 C66 28 77 40 77 58 C77 76 65 87 50 87 C35 87 23 76 23 58 C23 40 34 28 50 28Z',
      ear: { A: [24, 46], B: [45, 30], T: [24, 11] },
      eyes: [[40, 58], [60, 58]], mouthAt: [50, 66], cheeks: [[32, 68], [68, 68]], top: [70, 30], hat: [50, 31, 26],
    },
    fluffy: {
      head: fluffyHead(50, 58, 33, 26, 16),
      ear: { A: [17, 48], B: [45, 33], T: [20, 15] },
      eyes: [[37, 57], [63, 57]], mouthAt: [50, 64], cheeks: [[28, 66], [72, 66]], top: [74, 33], hat: [50, 34, 30],
    },
  };

  function earPath(style, { A, B, T }) {
    let [ax, ay] = A, [bx, by] = B, [tx, ty] = T;
    if (style === 'folded') {
      return `M${ax} ${ay} C${ax - 1} ${by - 11} ${bx - 8} ${by - 13} ${bx} ${by}Z`;
    }
    if (style === 'big') { tx -= 4; ty -= 9; ax -= 2; ay += 2; }
    return `M${ax} ${ay} L${tx - 1.5} ${ty + 4} Q${tx} ${ty - 1.5} ${tx + 4} ${ty + 1} L${bx} ${by}Z`;
  }

  // The pink inside of an ear: the same ear, shrunk toward its middle.
  function innerEarPath(style, { A, B, T }) {
    const style2 = style === 'big' ? 'big' : style;
    let t = T;
    if (style === 'big') t = [T[0] - 4, T[1] - 9];
    const cx = (A[0] + B[0] + t[0]) / 3, cy = (A[1] + B[1] + t[1]) / 3;
    const k = style === 'folded' ? 0.5 : 0.55;
    const sh = ([x, y]) => [cx + (x - cx) * k, cy + (y - cy) * k];
    return earPath(style2 === 'big' ? 'pointy' : style2, { A: sh(A), B: sh(B), T: sh(t) });
  }

  // Shapes for dogs, bunnies and bears.
  function otherAnimal(kind) {
    switch (kind) {
      case 'dog':
        return {
          head: 'M50 31 C68 31 80 42 80 58 C80 74 67 83 50 83 C33 83 20 74 20 58 C20 42 32 31 50 31Z',
          earsFront: ['M24 40 C14 42 10 56 14 68 C16 74 22 72 25 64 C27 56 30 46 24 40Z', 'M76 40 C86 42 90 56 86 68 C84 74 78 72 75 64 C73 56 70 46 76 40Z'],
          nose: 'black',
          eyes: [[38, 56], [62, 56]], mouthAt: [50, 65], cheeks: [[31, 66], [69, 66]], top: [72, 33], hat: [50, 34, 32],
        };
      case 'bunny':
        return {
          head: 'M50 38 C68 38 79 48 79 62 C79 76 67 84 50 84 C33 84 21 76 21 62 C21 48 32 38 50 38Z',
          earsBack: ['M33 44 C27 30 28 12 35 9 C42 7 45 24 44 42Z', 'M67 44 C73 30 72 12 65 9 C58 7 55 24 56 42Z'],
          inner: 'M35 40 C31 29 32 17 36 15 C40 14 41 27 40 39Z M65 40 C69 29 68 17 64 15 C60 14 59 27 60 39Z',
          nose: 'pink',
          eyes: [[39, 60], [61, 60]], mouthAt: [50, 67], cheeks: [[32, 69], [68, 69]], top: [72, 40], hat: [50, 41, 26],
        };
      default: // bear
        return {
          head: 'M50 32 C69 32 82 43 82 59 C82 75 68 84 50 84 C32 84 18 75 18 59 C18 43 31 32 50 32Z',
          earsBack: ['M17 34 A10 10 0 1 1 37 34 A10 10 0 1 1 17 34Z', 'M63 34 A10 10 0 1 1 83 34 A10 10 0 1 1 63 34Z'],
          inner: 'M22 34 A5 5 0 1 1 32 34 A5 5 0 1 1 22 34Z M68 34 A5 5 0 1 1 78 34 A5 5 0 1 1 68 34Z',
          innerColor: 'light',
          nose: 'black',
          muzzle: true,
          eyes: [[37, 55], [63, 55]], mouthAt: [50, 65], cheeks: [[29, 66], [71, 66]], top: [74, 34], hat: [50, 35, 34],
        };
    }
  }

  // Coat patterns, clipped to the head so they never spill over.
  function coat(s, clipId, k) {
    const c = s.color, p = s.patchColor;
    let shapes = '';
    switch (s.coat) {
      case 'tabby': {
        const d = lightness(c) < 0.4 ? shade(c, 0.25) : shade(c, -0.22);
        shapes = `<g stroke="${d}" stroke-width="3.4" stroke-linecap="round" fill="none">` +
          `<path d="M50 26 L50 40"/><path d="M42.5 28 L44 38"/><path d="M57.5 28 L56 38"/>` +
          `<path d="M6 56 L22 58"/><path d="M6 63 L21 63"/><path d="M94 56 L78 58"/><path d="M94 63 L79 63"/></g>`;
        break;
      }
      case 'patch':
        shapes = `<ellipse cx="68" cy="42" rx="22" ry="18" transform="rotate(20 68 42)" fill="${p}"/>`;
        break;
      case 'twotone':
        shapes = `<path d="M50 ${k.eyes[0][1] - 11} C57 ${k.eyes[0][1] - 3} 74 ${k.eyes[0][1] + 3} 78 95 L22 95 C26 ${k.eyes[0][1] + 3} 43 ${k.eyes[0][1] - 3} 50 ${k.eyes[0][1] - 11}Z" fill="${p}"/>`;
        break;
      case 'calico':
        shapes = `<ellipse cx="26" cy="44" rx="20" ry="16" transform="rotate(-15 26 44)" fill="${p}"/>` +
          `<ellipse cx="78" cy="79" rx="17" ry="12" transform="rotate(-20 78 79)" fill="#4a4545"/>`;
        break;
      case 'mask': {
        const [mx, my] = k.mouthAt;
        shapes = `<ellipse cx="${mx}" cy="${my - 1}" rx="${(k.eyes[1][0] - k.eyes[0][0]) * 0.62}" ry="15" fill="${p}"/>`;
        break;
      }
      default:
        break;
    }
    return shapes ? `<g clip-path="url(#${clipId})">${shapes}</g>` : '';
  }

  function animal(s, uid) {
    const c = s.color, p = s.patchColor;
    const isCat = s.kind === 'cat' || !['dog', 'bunny', 'bear'].includes(s.kind);
    const clipId = uid + 'h';
    let k, earsBack = '', earsFront = '', inner = '', outlineEars = '';

    // Which ears take the patch color.
    const earL = s.coat === 'calico' || s.coat === 'mask' ? p : c;
    const earR = s.coat === 'patch' || s.coat === 'mask' ? p : c;

    if (isCat) {
      k = { ...CAT_FACES[s.face] || CAT_FACES.round, nose: 'pink', whiskers: true };
      const ears = s.ears || 'pointy';
      const ed = earPath(ears, k.ear), idd = innerEarPath(ears, k.ear);
      const mirror = d => `<g transform="translate(100 0) scale(-1 1)">${d}</g>`;
      earsBack = `<path d="${ed}" fill="${earL}"/>` + mirror(`<path d="${ed}" fill="${earR}"/>`);
      inner = `<path d="${idd}" fill="${PINK}" opacity=".9"/>` + mirror(`<path d="${idd}" fill="${PINK}" opacity=".9"/>`);
      outlineEars = `<path d="${ed}"/>` + mirror(`<path d="${ed}"/>`);
    } else {
      k = otherAnimal(s.kind);
      if (k.earsBack) {
        earsBack = `<path d="${k.earsBack[0]}" fill="${earL}"/><path d="${k.earsBack[1]}" fill="${earR}"/>`;
        outlineEars = `<path d="${k.earsBack.join(' ')}"/>`;
      }
      if (k.earsFront) {
        const plain = s.coat === 'plain' || s.coat === 'tabby' || s.coat === 'twotone';
        const fl = plain ? shade(c, -0.2) : earL, fr = plain ? shade(c, -0.2) : earR;
        earsFront = `<path d="${k.earsFront[0]}" fill="${fl}"/><path d="${k.earsFront[1]}" fill="${fr}"/>`;
        outlineEars += `<path d="${k.earsFront.join(' ')}"/>`;
      }
      if (k.inner) inner = `<path d="${k.inner}" fill="${k.innerColor ? shade(c, 0.45) : PINK}"/>`;
    }

    const head = `<path d="${k.head}" fill="${c}"/>`;
    const muzzle = k.muzzle ? `<ellipse cx="50" cy="66" rx="11" ry="8" fill="${shade(c, 0.5)}"/>` : '';
    const whiskers = k.whiskers
      ? `<g ${line(1)}><path d="M30 ${k.mouthAt[1] - 3} L2 ${k.mouthAt[1] - 8}"/><path d="M30 ${k.mouthAt[1]} L1 ${k.mouthAt[1] + 1}"/><path d="M30 ${k.mouthAt[1] + 3} L4 ${k.mouthAt[1] + 10}"/>` +
        `<path d="M70 ${k.mouthAt[1] - 3} L98 ${k.mouthAt[1] - 8}"/><path d="M70 ${k.mouthAt[1]} L99 ${k.mouthAt[1] + 1}"/><path d="M70 ${k.mouthAt[1] + 3} L96 ${k.mouthAt[1] + 10}"/></g>`
      : '';
    let features = face(s.feeling, { eyes: k.eyes, size: 1.05, nose: k.nose, mouthAt: k.mouthAt, cheeks: k.cheeks, top: k.top });
    // On dark fur (or a dark colorpoint mask), draw the face in a light color so it can be seen.
    const faceColor = s.coat === 'mask' ? p : c;
    if (lightness(faceColor) < 0.4 && !muzzle) features = features.split(INK).join(LIGHT_INK);
    const art = `<defs><clipPath id="${clipId}"><path d="${k.head}"/></clipPath></defs>` +
      outline(outlineEars + `<path d="${k.head}"/>`) +
      earsBack + inner + head + coat(s, clipId, k) + earsFront + muzzle + features + whiskers;
    return { art, eyes: k.eyes, eyeSize: 1.05, hat: k.hat };
  }

  // ---------- Hats and glasses ----------

  // A hat drawn with its bottom middle at (0,0), about 30 wide.
  function hatArt(kind) {
    switch (kind) {
      case 'party':
        return `<g transform="rotate(-10)"><path d="M-11 0 L0 -27 L11 0Z" fill="#ff7aa2"/>` +
          `<circle cx="-3" cy="-7" r="2" fill="#ffd54a"/><circle cx="4" cy="-12" r="2" fill="#7fd1ff"/><circle cx="-1" cy="-18" r="1.7" fill="#ffd54a"/>` +
          `<circle cy="-28" r="3.6" fill="#ffd54a"/></g>`;
      case 'crown':
        return `<path d="M-14 0 L-15 -15 L-7.5 -8 L0 -19 L7.5 -8 L15 -15 L14 0Z" fill="#ffcf3f" stroke="#e0a800" stroke-width="1.2" stroke-linejoin="round"/>` +
          `<circle cx="-7" cy="-4" r="1.9" fill="#ff5d8f"/><circle cy="-5" r="2.2" fill="#3a86ff"/><circle cx="7" cy="-4" r="1.9" fill="#06d6a0"/>`;
      case 'beanie':
        return `<path d="M-16 0 C-16 -22 16 -22 16 0Z" fill="#5aa9e6"/>` +
          `<g stroke="#4a8fc4" stroke-width="1.4"><path d="M-8 -2 L-8 -14"/><path d="M0 -2 L0 -17"/><path d="M8 -2 L8 -14"/></g>` +
          `<rect x="-17.5" y="-4.5" width="35" height="7" rx="3.5" fill="#3d7fb8"/><circle cy="-19" r="4.5" fill="#fff"/>`;
      case 'cap':
        return `<path d="M-15 0 C-15 -19 15 -19 15 0Z" fill="#ff6b6b"/>` +
          `<path d="M9 -2 Q25 -4 28 1.5 Q17 3 8 2Z" fill="#d94f4f"/><circle cy="-15.5" r="2" fill="#d94f4f"/>`;
      case 'tophat':
        return `<ellipse cy="-1.5" rx="17" ry="3.4" fill="#333"/><rect x="-10.5" y="-25" width="21" height="24" rx="2" fill="#333"/>` +
          `<rect x="-10.5" y="-8" width="21" height="4.5" fill="#ff5d8f"/>`;
      case 'bow':
        return `<g transform="translate(13 -2) rotate(18)"><path d="M0 0 L-11 -7 L-11 7Z" fill="#ff5d8f"/><path d="M0 0 L11 -7 L11 7Z" fill="#ff5d8f"/>` +
          `<circle r="3.4" fill="#ff86ab"/></g>`;
      case 'flower':
        return `<g transform="translate(-13 -1)">` +
          [0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-5.5" rx="3.6" ry="5" fill="#fff" transform="rotate(${a})"/>`).join('') +
          `<circle r="3.6" fill="#ffd54a"/></g>`;
      default:
        return '';
    }
  }

  function hatLayer(s, [x, y, w]) {
    const art = hatArt(s.hat);
    if (!art) return '';
    return `<g transform="translate(${x} ${y}) scale(${w / 30})" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke">${art}</g>`;
  }

  function glassesLayer(s, eyes, eyeSize) {
    const kind = s.glasses;
    if (!kind || kind === 'none') return '';
    const pts = eyes.length === 3 ? [eyes[0], eyes[2]] : eyes;
    const r = 6.2 * eyeSize;
    const frame = INK;
    const lens = ([x, y]) => {
      switch (kind) {
        case 'sun':
          return `<rect x="${x - r}" y="${y - r * 0.8}" width="${r * 2}" height="${r * 1.6}" rx="${r * 0.6}" fill="#2b2b2b" stroke="${frame}" stroke-width="1.2"/>` +
            `<path d="M${x - r * 0.5} ${y - r * 0.35} l${r * 0.5} 0" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`;
        case 'heart':
          return `<path transform="translate(${x} ${y}) scale(${r / 6})" d="M0 6 C-10 -1 -6 -10 0 -4.5 C6 -10 10 -1 0 6Z" fill="#ff9fc0" fill-opacity=".55" stroke="#ff4f8b" stroke-width="1.6"/>`;
        case 'star':
          return `<path transform="translate(${x} ${y}) scale(${r / 6})" d="M0 -7.5 L2.2 -2.4 L7.6 -2.2 L3.4 1.2 L4.8 6.6 L0 3.6 L-4.8 6.6 L-3.4 1.2 L-7.6 -2.2 L-2.2 -2.4Z" fill="#ffd54a" fill-opacity=".6" stroke="#e0a800" stroke-width="1.4" stroke-linejoin="round"/>`;
        default: // round
          return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity=".25" stroke="${frame}" stroke-width="1.6"/>`;
      }
    };
    let out = pts.map(lens).join('');
    if (pts.length === 2) {
      const [[x1, y1], [x2, y2]] = pts;
      out += `<path d="M${x1 + r} ${y1} Q${(x1 + x2) / 2} ${y1 - 3} ${x2 - r} ${y2}" stroke="${frame}" stroke-width="1.5" fill="none"/>`;
    }
    return out;
  }

  // Where the middle of each floating face is, and how much to enlarge it,
  // so every face sits centered in its circle.
  function frame(s) {
    let f;
    if (s.type === 'alien') {
      f = { round: [44, 1.08], tall: [42, 1.0], wide: [47, 1.1] }[s.head] || [44, 1.08];
    } else if (s.type === 'animal') {
      f = { cat: [52, 0.98], dog: [57, 1.02], bunny: [47, 0.95], bear: [57, 1.0] }[s.kind] || [52, 0.98];
      if (s.kind === 'cat') {
        if (s.face === 'tall') f = [51, 0.94];
        if (s.ears === 'big') f = [f[0] - 7, f[1] * 0.91];
      }
    } else {
      f = [50, 1.13];
    }
    // Make room for a tall hat on top.
    if (s.hat && !['none', 'bow', 'flower'].includes(s.hat)) f = [f[0] - 6, f[1] * 0.92];
    return f;
  }

  let clipCounter = 0;

  // Returns an SVG string for a sticker, clipped to a circle.
  function render(sticker) {
    const s = { ...DEFAULTS[sticker.type || 'person'], ...sticker };
    if (!FEELING_PARTS[s.feeling]) s.feeling = 'happy';
    const id = 'stk' + (++clipCounter);
    let part;
    if (s.type === 'alien') part = alien(s);
    else if (s.type === 'animal') part = animal(s, id);
    else part = person(s);
    const [cy, scale] = frame(s);
    return `<svg class="sticker-svg" viewBox="0 0 100 100" aria-hidden="true">` +
      `<defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs>` +
      `<g clip-path="url(#${id})"><rect width="100" height="100" fill="${s.bg}"/>` +
      `<g transform="translate(50 50) scale(${scale}) translate(-50 ${-cy})">` +
      part.art + glassesLayer(s, part.eyes, part.eyeSize) + hatLayer(s, part.hat) +
      `</g></g></svg>`;
  }

  return { COLORS, OPTIONS, DEFAULTS, FEELINGS, render };
})();
