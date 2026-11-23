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
    patch: ['#f5a54a', '#e8925a', '#4a4545', '#a47551', '#fbf8f3', '#9e9e9e', '#f6e3c3'],
  };

  const FEELINGS = ['happy', 'cute', 'silly', 'love', 'shy', 'sleepy', 'surprised', 'nervous', 'confused', 'grumpy'];

  // What each kind of sticker lets you choose. Icons keep it picture-first.
  // "when" hides a choice that doesn't apply (like patch color on a plain coat).
  const OPTIONS = {
    person: [
      { key: 'feeling', icon: '😊', label: 'Feeling', styles: FEELINGS },
      { key: 'skin', icon: '🖐️', label: 'Skin', colors: COLORS.skin },
      { key: 'hair', icon: '💇', label: 'Hair', styles: ['short', 'long', 'curly', 'bun', 'pigtails', 'spiky', 'bald'] },
      { key: 'hairColor', icon: '🖍️', label: 'Hair color', colors: COLORS.hair },
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
    alien: [
      { key: 'feeling', icon: '😊', label: 'Feeling', styles: FEELINGS },
      { key: 'color', icon: '👽', label: 'Alien color', colors: COLORS.alien },
      { key: 'head', icon: '🥚', label: 'Head', styles: ['round', 'tall', 'wide'] },
      { key: 'eyeCount', icon: '👀', label: 'Eyes', styles: [1, 2, 3] },
      { key: 'antennae', icon: '📡', label: 'Antennae', styles: [0, 1, 2] },
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
    animal: [
      { key: 'kind', icon: '🐾', label: 'Animal', styles: ['cat', 'dog', 'bunny', 'bear'] },
      { key: 'feeling', icon: '😊', label: 'Feeling', styles: FEELINGS },
      { key: 'coat', icon: '🎀', label: 'Coat', styles: ['plain', 'tabby', 'patch', 'twotone', 'calico'] },
      { key: 'color', icon: '🖍️', label: 'Fur color', colors: COLORS.animal },
      { key: 'patchColor', icon: '🟠', label: 'Patch color', colors: COLORS.patch, when: s => s.coat !== 'plain' && s.coat !== 'tabby' },
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
  };

  const DEFAULTS = {
    person: { type: 'person', bg: '#bfe3ff', skin: '#f6c9a0', hair: 'short', hairColor: '#5a3825', feeling: 'happy' },
    alien: { type: 'alien', bg: '#e2d4ff', color: '#7ee081', head: 'round', eyeCount: 3, antennae: 2, feeling: 'happy' },
    animal: { type: 'animal', bg: '#bfe3ff', kind: 'cat', coat: 'calico', color: '#fbf8f3', patchColor: '#f5a54a', feeling: 'happy' },
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
    return outline(back + head + front) + back + head + front +
      face(s.feeling, { eyes: [[41, 54], [59, 54]], size: 1.05, mouthAt: [50, 62], cheeks: [[35, 62], [65, 62]], top: [70, 28], human: true });
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
    return outline(ant + headShape) + ant + headShape + spots +
      face(s.feeling, { eyes, size, mouthAt: [50, h.cy + h.ry * 0.38], cheeks: [[50 - h.rx * 0.62, ey + 9], [50 + h.rx * 0.62, ey + 9]], top: [50 + h.rx * 0.7, top + 4], human: true });
  }

  // ---------- Animals ----------

  // Shapes for each animal: ears behind, head, and ears in front (dog).
  function animalShapes(kind) {
    switch (kind) {
      case 'dog':
        return {
          head: 'M50 31 C68 31 80 42 80 58 C80 74 67 83 50 83 C33 83 20 74 20 58 C20 42 32 31 50 31Z',
          earsBack: '',
          earsFront: 'M24 40 C14 42 10 56 14 68 C16 74 22 72 25 64 C27 56 30 46 24 40Z M76 40 C86 42 90 56 86 68 C84 74 78 72 75 64 C73 56 70 46 76 40Z',
          inner: '',
          nose: 'black',
          eyes: [[38, 56], [62, 56]], mouthAt: [50, 65], cheeks: [[31, 66], [69, 66]], top: [72, 33],
        };
      case 'bunny':
        return {
          head: 'M50 38 C68 38 79 48 79 62 C79 76 67 84 50 84 C33 84 21 76 21 62 C21 48 32 38 50 38Z',
          earsBack: 'M33 44 C27 30 28 12 35 9 C42 7 45 24 44 42Z M67 44 C73 30 72 12 65 9 C58 7 55 24 56 42Z',
          earsFront: '',
          inner: 'M35 40 C31 29 32 17 36 15 C40 14 41 27 40 39Z M65 40 C69 29 68 17 64 15 C60 14 59 27 60 39Z',
          nose: 'pink',
          eyes: [[39, 60], [61, 60]], mouthAt: [50, 67], cheeks: [[32, 69], [68, 69]], top: [72, 40],
        };
      case 'bear':
        return {
          head: 'M50 32 C69 32 82 43 82 59 C82 75 68 84 50 84 C32 84 18 75 18 59 C18 43 31 32 50 32Z',
          earsBack: 'M17 34 A10 10 0 1 1 37 34 A10 10 0 1 1 17 34Z M63 34 A10 10 0 1 1 83 34 A10 10 0 1 1 63 34Z',
          earsFront: '',
          inner: 'M22 34 A5 5 0 1 1 32 34 A5 5 0 1 1 22 34Z M68 34 A5 5 0 1 1 78 34 A5 5 0 1 1 68 34Z',
          nose: 'black',
          muzzle: true,
          eyes: [[37, 55], [63, 55]], mouthAt: [50, 65], cheeks: [[29, 66], [71, 66]], top: [74, 34],
        };
      default: // cat
        return {
          head: 'M50 31 C72 31 86 41 86 59 C86 75 72 83 50 83 C28 83 14 75 14 59 C14 41 28 31 50 31Z',
          earsBack: 'M17 47 L19 20 Q20 15 25 17 L45 33Z M83 47 L81 20 Q80 15 75 17 L55 33Z',
          earsFront: '',
          inner: 'M22 40 L23.5 24 L36 32Z M78 40 L76.5 24 L64 32Z',
          nose: 'pink',
          whiskers: true,
          eyes: [[36, 57], [64, 57]], mouthAt: [50, 63], cheeks: [[27, 66], [73, 66]], top: [74, 33],
        };
    }
  }

  // Coat patterns, clipped to the head so they never spill over.
  function coat(s, clipId) {
    const c = s.color, p = s.patchColor;
    let shapes = '';
    switch (s.coat) {
      case 'tabby': {
        const d = lightness(c) < 0.4 ? shade(c, 0.25) : shade(c, -0.22);
        shapes = `<g stroke="${d}" stroke-width="3.4" stroke-linecap="round" fill="none">` +
          `<path d="M50 30 L50 40"/><path d="M42.5 31 L44 38"/><path d="M57.5 31 L56 38"/>` +
          `<path d="M12 56 L22 58"/><path d="M12 63 L21 63"/><path d="M88 56 L78 58"/><path d="M88 63 L79 63"/></g>`;
        break;
      }
      case 'patch':
        shapes = `<ellipse cx="68" cy="42" rx="21" ry="17" transform="rotate(20 68 42)" fill="${p}"/>`;
        break;
      case 'twotone':
        shapes = `<path d="M50 46 C57 54 72 60 76 90 L24 90 C28 60 43 54 50 46Z" fill="${p}"/>`;
        break;
      case 'calico':
        shapes = `<ellipse cx="27" cy="44" rx="19" ry="15" transform="rotate(-15 27 44)" fill="${p}"/>` +
          `<ellipse cx="77" cy="78" rx="16" ry="11" transform="rotate(-20 77 78)" fill="#4a4545"/>`;
        break;
      default:
        break;
    }
    return shapes ? `<g clip-path="url(#${clipId})">${shapes}</g>` : '';
  }

  function animal(s, uid) {
    const k = animalShapes(s.kind);
    const c = s.color;
    const clipId = uid + 'h';
    // Ear colors follow the coat: calico and patch color one ear.
    const earL = s.coat === 'calico' ? s.patchColor : c;
    const earR = s.coat === 'patch' ? s.patchColor : c;
    const [leftEar, rightEar] = k.earsBack ? k.earsBack.split(' M').map((d, i) => (i ? 'M' + d : d)) : ['', ''];
    const [frontL, frontR] = k.earsFront ? k.earsFront.split(' M').map((d, i) => (i ? 'M' + d : d)) : ['', ''];
    const earsBack = k.earsBack ? `<path d="${leftEar}" fill="${earL}"/><path d="${rightEar}" fill="${earR}"/>` : '';
    const earsFront = k.earsFront ? `<path d="${frontL}" fill="${s.coat === 'plain' ? shade(c, -0.2) : earL}"/><path d="${frontR}" fill="${s.coat === 'plain' ? shade(c, -0.2) : earR}"/>` : '';
    const inner = k.inner ? `<path d="${k.inner}" fill="${s.kind === 'bear' ? shade(c, 0.45) : PINK}" opacity="${s.kind === 'bear' ? 1 : .9}"/>` : '';
    const head = `<path d="${k.head}" fill="${c}"/>`;
    const muzzle = k.muzzle ? `<ellipse cx="50" cy="66" rx="11" ry="8" fill="${shade(c, 0.5)}"/>` : '';
    const whiskers = k.whiskers ? `<g ${line(1.1)}><path d="M17 60 L28 62"/><path d="M17 66 L28 65.5"/><path d="M83 60 L72 62"/><path d="M83 66 L72 65.5"/></g>` : '';
    const outlineShapes = `<path d="${k.earsBack || 'M0 0'}"/><path d="${k.head}"/>${k.earsFront ? `<path d="${k.earsFront}"/>` : ''}`;
    let features = whiskers + face(s.feeling, { eyes: k.eyes, size: 1.05, nose: k.nose, mouthAt: k.mouthAt, cheeks: k.cheeks, top: k.top });
    // On dark fur, draw the face in a light color so it can be seen.
    if (lightness(c) < 0.4 && !muzzle) features = features.split(INK).join(LIGHT_INK);
    return `<defs><clipPath id="${clipId}"><path d="${k.head}"/></clipPath></defs>` +
      outline(outlineShapes) +
      earsBack + inner + head + coat(s, clipId) + earsFront + muzzle + features;
  }

  // Where the middle of each floating face is, and how much to enlarge it,
  // so every face sits centered in its circle.
  function frame(s) {
    if (s.type === 'alien') {
      return { round: [44, 1.08], tall: [42, 1.0], wide: [47, 1.1] }[s.head] || [44, 1.08];
    }
    if (s.type === 'animal') {
      return { cat: [52, 0.98], dog: [57, 1.02], bunny: [47, 0.95], bear: [57, 1.0] }[s.kind] || [52, 0.98];
    }
    return [50, 1.13];
  }

  let clipCounter = 0;

  // Returns an SVG string for a sticker, clipped to a circle.
  function render(sticker) {
    const s = { ...DEFAULTS[sticker.type || 'person'], ...sticker };
    if (!FEELING_PARTS[s.feeling]) s.feeling = 'happy';
    const id = 'stk' + (++clipCounter);
    let art;
    if (s.type === 'alien') art = alien(s);
    else if (s.type === 'animal') art = animal(s, id);
    else art = person(s);
    const [cy, scale] = frame(s);
    return `<svg class="sticker-svg" viewBox="0 0 100 100" aria-hidden="true">` +
      `<defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs>` +
      `<g clip-path="url(#${id})"><rect width="100" height="100" fill="${s.bg}"/>` +
      `<g transform="translate(50 50) scale(${scale}) translate(-50 ${-cy})">${art}</g></g></svg>`;
  }

  return { COLORS, OPTIONS, DEFAULTS, FEELINGS, render };
})();
