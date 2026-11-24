// Draws round stickers: floating faces of people, aliens and animals.
// Style: flat shapes, a white sticker outline, and simple line faces
// whose eyes and mouth show a feeling.
const Stickers = (() => {
  const COLORS = {
    bg: ['#bfe3ff', '#c8f0c0', '#ffd6e0', '#ffe9a8', '#e2d4ff', '#ffd2b0', '#9be7c4', '#7fd1ff', '#ff8fb1', '#ffffff'],
    skin: ['#ffe0c7', '#f6c9a0', '#e0a878', '#c68642', '#a0662f', '#6e4423', '#4a2c17'],
    hair: ['#2b1b12', '#5a3825', '#a0522d', '#e0b050', '#f3d98b', '#d94f2b', '#9b9b9b', '#ff69b4', '#6a5acd', '#2fa8a0'],
    alien: ['#7ee081', '#9be35a', '#8fd3ff', '#5aa9c9', '#c79bff', '#ff9ecf', '#ffd36b', '#ff8a65', '#5ee0c8', '#b9c4c9', '#2f3b2f'],
    animal: ['#fbf8f3', '#f6e3c3', '#f5b04a', '#e8925a', '#a47551', '#b9a89a', '#9e9e9e', '#4a4545', '#ffc2d1', '#7ccf7c', '#6fa8dc', '#e8655a', '#b48ee0'],
    patch: ['#f5a54a', '#e8925a', '#4a4545', '#6b4a3a', '#a47551', '#fbf8f3', '#9e9e9e', '#f6e3c3'],
  };

  // ---------- Expression parts ----------
  // Kids build an expression from these pieces. Quick feelings just fill them in.

  const EYES = ['dot', 'shiny', 'big', 'almond', 'slit', 'wide', 'happy', 'sleepy', 'wink', 'up', 'down', 'side', 'cross', 'cry', 'heart', 'angry', 'sad'];
  const MOUTHS = ['smile', 'open', 'teeth', 'small', 'tongue', 'o', 'frown', 'wobble', 'flat'];
  const CHEEKS = ['none', 'blush', 'shy'];
  const EXTRAS = ['none', 'sweat', 'zzz', 'question', 'heart', 'sparkle', 'anger'];

  const PRESETS = {
    happy: { eyes: 'happy', mouth: 'smile', cheeks: 'blush', extra: 'none' },
    laugh: { eyes: 'happy', mouth: 'teeth', cheeks: 'blush', extra: 'none' },
    cute: { eyes: 'shiny', mouth: 'smile', cheeks: 'blush', extra: 'none' },
    silly: { eyes: 'cross', mouth: 'tongue', cheeks: 'none', extra: 'none' },
    love: { eyes: 'heart', mouth: 'smile', cheeks: 'blush', extra: 'heart' },
    shy: { eyes: 'down', mouth: 'small', cheeks: 'shy', extra: 'none' },
    sleepy: { eyes: 'sleepy', mouth: 'small', cheeks: 'none', extra: 'zzz' },
    surprised: { eyes: 'wide', mouth: 'o', cheeks: 'none', extra: 'none' },
    nervous: { eyes: 'side', mouth: 'wobble', cheeks: 'none', extra: 'sweat' },
    confused: { eyes: 'up', mouth: 'wobble', cheeks: 'none', extra: 'question' },
    sad: { eyes: 'cry', mouth: 'frown', cheeks: 'none', extra: 'none' },
    grumpy: { eyes: 'angry', mouth: 'flat', cheeks: 'none', extra: 'anger' },
  };
  const FEELINGS = Object.keys(PRESETS);

  // Old stickers kept one "feeling" or old eye names; turn them into parts.
  const OLD_EYES = { dots: 'dot', big: 'shiny', happy: 'happy', wink: 'wink' };

  const HAT = { key: 'hat', icon: '🎩', label: 'Hat', styles: ['none', 'party', 'crown', 'bowler', 'beanie', 'cap', 'bow', 'flower', 'tophat', 'nightcap'] };
  const NECK = { key: 'neck', icon: '🎀', label: 'Bow tie', styles: ['none', 'bowtie', 'bowtie-blue'] };
  const GLASSES = { key: 'glasses', icon: '👓', label: 'Glasses', styles: ['none', 'round', 'sun', 'heart', 'star'] };
  const FACE_PARTS = [
    { key: 'preset', icon: '✨', label: 'Quick feelings', presets: FEELINGS },
    { key: 'eyes', icon: '👀', label: 'Eyes', styles: EYES },
    { key: 'mouth', icon: '👄', label: 'Mouth', styles: MOUTHS },
    { key: 'cheeks', icon: '🌸', label: 'Cheeks', styles: CHEEKS },
    { key: 'extra', icon: '💦', label: 'Extras', styles: EXTRAS },
  ];

  // What each kind of sticker lets you choose. Icons keep it picture-first.
  // "when" hides a choice that doesn't apply (like patch color on a plain coat).
  const OPTIONS = {
    person: [
      ...FACE_PARTS,
      { key: 'faceShape', icon: '🙂', label: 'Face shape', styles: ['oval', 'round', 'long', 'square', 'heart'] },
      { key: 'skin', icon: '🖐️', label: 'Skin', colors: COLORS.skin },
      { key: 'hair', icon: '💇', label: 'Hair', styles: ['short', 'long', 'curly', 'longcurly', 'braids', 'bun', 'pigtails', 'spiky', 'bald'] },
      { key: 'hairColor', icon: '🖍️', label: 'Hair color', colors: COLORS.hair },
      HAT, GLASSES, NECK,
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
    alien: [
      ...FACE_PARTS,
      { key: 'color', icon: '👽', label: 'Alien color', colors: COLORS.alien },
      { key: 'head', icon: '🥚', label: 'Head', styles: ['round', 'tall', 'wide', 'xwide', 'bulb', 'classic'] },
      { key: 'skinPattern', icon: '✨', label: 'Skin', styles: ['plain', 'spots', 'stars'] },
      { key: 'eyeCount', icon: '👁️', label: 'How many eyes', styles: [1, 2, 3] },
      { key: 'antennae', icon: '📡', label: 'Antennae', styles: [0, 1, 2] },
      { key: 'antennaStyle', icon: '🌀', label: 'Antenna shape', styles: ['straight', 'spiral', 'zigzag', 'crooked'], when: s => s.antennae > 0 },
      HAT, GLASSES, NECK,
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
    animal: [
      { key: 'kind', icon: '🐾', label: 'Animal', styles: ['cat', 'dog', 'chihuahua', 'bunny', 'bear', 'mouse', 'fox', 'sheep', 'dragon'] },
      ...FACE_PARTS,
      { key: 'face', icon: '🙂', label: 'Face shape', styles: s => (s.kind === 'dragon' ? ['round', 'chubby'] : ['round', 'wide', 'fluffy']), when: s => s.kind === 'cat' || s.kind === 'dragon' },
      { key: 'ears', icon: '👂', label: 'Ears', styles: s => (s.face === 'wide' ? ['pointy', 'big'] : ['pointy', 'big', 'folded']), when: s => s.kind === 'cat' },
      { key: 'tuft', icon: '🌱', label: 'Tuft', styles: ['none', 'sprout', 'single', 'curl', 'spikes', 'puff'], when: s => s.kind === 'dragon' },
      { key: 'horns', icon: '🐲', label: 'Horns', styles: ['none', 'tiny'], when: s => s.kind === 'dragon' },
      { key: 'coat', icon: '🎀', label: 'Coat', styles: ['plain', 'tabby', 'patch', 'twotone', 'calico', 'mask'] },
      { key: 'color', icon: '🖍️', label: 'Fur color', colors: COLORS.animal },
      { key: 'patchColor', icon: '🟠', label: 'Patch color', colors: COLORS.patch, when: s => s.coat !== 'plain' && s.coat !== 'tabby' },
      HAT, GLASSES, NECK,
      { key: 'bg', icon: '🎨', label: 'Background', colors: COLORS.bg },
    ],
  };

  const FACE_DEFAULT = { ...PRESETS.happy };
  const DEFAULTS = {
    person: { type: 'person', bg: '#bfe3ff', faceShape: 'oval', skin: '#f6c9a0', hair: 'short', hairColor: '#5a3825', ...FACE_DEFAULT, hat: 'none', glasses: 'none', neck: 'none' },
    alien: { type: 'alien', bg: '#e2d4ff', color: '#7ee081', head: 'round', eyeCount: 3, antennae: 2, antennaStyle: 'straight', skinPattern: 'spots', ...FACE_DEFAULT, hat: 'none', glasses: 'none', neck: 'none' },
    animal: { type: 'animal', bg: '#bfe3ff', kind: 'cat', face: 'round', ears: 'pointy', coat: 'calico', color: '#fbf8f3', patchColor: '#f5a54a', horns: 'none', tuft: 'sprout', ...FACE_DEFAULT, hat: 'none', glasses: 'none', neck: 'none' },
  };

  // Fill in a quick feeling's parts.
  function applyPreset(s, name) {
    const p = PRESETS[name];
    if (!p) return s;
    const out = { ...s, ...p };
    delete out.feeling;
    return out;
  }

  // Which quick feeling (if any) a sticker matches right now.
  function presetOf(s) {
    return FEELINGS.find(f => Object.entries(PRESETS[f]).every(([k, v]) => s[k] === v)) || null;
  }

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

  // ---------- Drawing the face ----------

  // An eye with a white part and a pupil looking in a direction (dx, dy).
  function lookEye(dx, dy) {
    return `<circle r="4.4" fill="#fff" stroke="${INK}" stroke-width="1.4"/><circle cx="${dx}" cy="${dy}" r="1.9" fill="${INK}"/>`;
  }

  // One eye drawn around (0,0). side is -1 for the left eye, 1 for the right.
  function eye(kind, side) {
    switch (kind) {
      case 'shiny': return `<ellipse rx="3.4" ry="4.2" fill="${INK}"/><circle cx="-1.1" cy="-1.5" r="1.4" fill="#fff"/><circle cx="1.2" cy="1.6" r=".6" fill="#fff"/>`;
      case 'big': return `<circle r="5" fill="#fff" stroke="${INK}" stroke-width=".9"/><circle cx=".3" cy="-.3" r="3.4" fill="#1f1f1f"/>` +
        `<circle cx="-1" cy="-1.8" r="1.3" fill="#fff"/><circle cx="1.6" cy="1.3" r=".65" fill="#fff"/>`;
      case 'almond': case 'slit': {
        // Big slanted eye: outer corner higher, inner corner lower. Mirrored for the right eye.
        const shape = `<path d="M-6.5 -2.6 C-3 -5.8 4 -2.4 5.6 2 C1 4.8 -5 3.2 -6.5 -2.6Z" fill="#1f1f1f"/>`;
        const shine = kind === 'slit'
          ? `<ellipse cx="-.4" cy="-.2" rx=".75" ry="2.8" transform="rotate(-20)" fill="#fff"/>`
          : `<ellipse cx="-2.8" cy="-1.6" rx="1.8" ry=".9" transform="rotate(-25 -2.8 -1.6)" fill="#fff" opacity=".9"/>`;
        return `<g transform="scale(${side > 0 ? -1.15 : 1.15} 1.15)">${shape}${shine}</g>`;
      }
      case 'wide': return lookEye(0, 0);
      case 'happy': return `<path d="M-4 1.6 Q0 -4 4 1.6" ${line(2)}/>`;
      case 'sleepy': return `<path d="M-4 -1 Q0 3.6 4 -1" ${line(2)}/><path d="M${side * 4} -1 l${side * 1.8} -1.8" ${line(1.4)}/>`;
      case 'wink': return side < 0 ? eye('shiny', side) : `<path d="M-4 0 L4 0" ${line(2)}/><path d="M-3.4 -.2 Q0 -3.5 3.4 -.2" ${line(1.6)}/>`;
      case 'up': return lookEye(0, -2.2);
      case 'down': return lookEye(0, 2.2);
      case 'side': return lookEye(-2.2, 0.4);
      case 'cross': return lookEye(side < 0 ? 2.2 : -2.2, 0.4);
      case 'cry':
        return `<path d="M-4 -.5 Q0 3.2 4 -.5" ${line(2)}/>` +
          `<path d="M${side * 1.5} 2.5 C${side * 1.5 + 2} 6 ${side * 1.5 + 2} 8 ${side * 1.5} 9 C${side * 1.5 - 2} 8 ${side * 1.5 - 2} 6 ${side * 1.5} 2.5Z" fill="#7fc8f0" stroke="#fff" stroke-width=".6"/>`;
      case 'heart': return `<path d="M0 3.6 C-6 -0.5 -4 -6 0 -2.6 C4 -6 6 -0.5 0 3.6Z" fill="#ff5d8f"/>`;
      case 'angry': return `<ellipse rx="2.5" ry="3" fill="${INK}"/><path d="${side < 0 ? 'M-4 -7 L3.5 -4.2' : 'M-3.5 -4.2 L4 -7'}" ${line(1.8)}/>`;
      case 'sad': return `<ellipse rx="2.5" ry="3" fill="${INK}"/><path d="${side < 0 ? 'M-4 -4.4 L3.5 -7' : 'M-3.5 -7 L4 -4.4'}" ${line(1.6)}/>`;
      default: return `<ellipse rx="2.5" ry="3.1" fill="${INK}"/>`; // dot
    }
  }

  // Nose and mouth drawn around the nose at (0,0).
  function mouth(kind, nose, human) {
    let n = '';
    if (nose === 'pink') n = `<path d="M-2.4 -1.3 L2.4 -1.3 L0 1.4Z" fill="${PINK}" stroke="${shade(PINK, -0.15)}" stroke-width=".5" stroke-linejoin="round"/>`;
    if (nose === 'bumps') n = `<g stroke="${INK}" stroke-width="1" fill="none" opacity=".45"><circle cx="-2" cy="-3" r="1.6"/><circle cx="2" cy="-3" r="1.6"/></g>`;
    if (nose === 'dots') n = `<ellipse cx="-2.4" cy="-1.4" rx=".7" ry=".9" fill="${INK}" opacity=".6"/><ellipse cx="2.4" cy="-1.4" rx=".7" ry=".9" fill="${INK}" opacity=".6"/>`;
    if (nose === 'nostrils') n = `<path d="M-5.6 -3.6 q1.2 -.6 1.6 .9" ${line(1.2)} opacity=".7"/><path d="M5.6 -3.6 q-1.2 -.6 -1.6 .9" ${line(1.2)} opacity=".7"/>`;
    if (nose === 'ball') n = `<circle r="2.8" fill="#ff8fa3" stroke="${shade('#ff8fa3', -0.15)}" stroke-width=".5"/><circle cx="-.9" cy="-.9" r=".8" fill="#fff" opacity=".7"/>`;
    if (nose === 'black') n = `<ellipse rx="3.6" ry="2.5" fill="${INK}"/><ellipse cx="-1" cy="-.8" rx="1.1" ry=".6" fill="#fff" opacity=".7"/>`;
    const y = human ? 0 : 1.2; // animal mouths sit just under the nose
    const closed = human ? `<path d="M-5 2.5 Q0 8 5 2.5" ${line(1.8)}/>` : `<path d="M-5 2.8 Q-2.5 6 0 2.3 Q2.5 6 5 2.8" ${line(1.6)}/>`;
    switch (kind) {
      case 'open':
        return n + `<path d="M-5 ${y + 2.2} Q0 ${y + 2.8} 5 ${y + 2.2} Q4.6 ${y + 10} 0 ${y + 10} Q-4.6 ${y + 10} -5 ${y + 2.2}Z" fill="#c94f5c" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>` +
          `<path d="M-2.6 ${y + 8.6} Q0 ${y + 5.8} 2.6 ${y + 8.6} Q0 ${y + 10} -2.6 ${y + 8.6}Z" fill="#ff8fa3"/>`;
      case 'teeth':
        return n + `<path d="M-5.4 ${y + 2.2} Q0 ${y + 2.8} 5.4 ${y + 2.2} Q5 ${y + 10.4} 0 ${y + 10.4} Q-5 ${y + 10.4} -5.4 ${y + 2.2}Z" fill="#fff" stroke="${INK}" stroke-width="1.3" stroke-linejoin="round"/>` +
          `<path d="M-5 ${y + 5.6} L5 ${y + 5.6}" stroke="${INK}" stroke-width=".9"/>`;
      case 'small': return n + `<path d="M-2.2 ${y + 3.4} Q0 ${y + 5} 2.2 ${y + 3.4}" ${line(1.5)}/>`;
      case 'tongue': return n + closed + `<path d="M-1.9 ${human ? 4.4 : 4.2} Q0 11 1.9 ${human ? 4.4 : 4.2}Z" fill="#ff7f9f" stroke="${INK}" stroke-width=".8"/>`;
      case 'o': return n + `<ellipse cy="${y + 5.2}" rx="2.4" ry="3" fill="#c94f5c" stroke="${INK}" stroke-width="1.3"/>`;
      case 'frown': return n + `<path d="M-3.8 ${y + 6} Q0 ${y + 2.6} 3.8 ${y + 6}" ${line(1.6)}/>`;
      case 'wobble': return n + `<path d="M-3.6 ${y + 4.8} Q-1.8 ${y + 3.2} 0 ${y + 4.8} Q1.8 ${y + 6.4} 3.6 ${y + 4.8}" ${line(1.5)}/>`;
      case 'flat': return n + `<path d="M-3.4 ${y + 4.6} L3.4 ${y + 4.6}" ${line(1.6)}/>`;
      default: return n + closed; // closed smile
    }
  }

  // Draw a face from its parts. eyes: [[x, y], ...], size: eye size, nose: 'pink' | 'black' | 'none',
  // mouthAt: [x, y], cheeks: [[x, y], [x, y]], top: [x, y] place for extras like Zzz.
  function face(s, { eyes, size = 1, nose = 'none', mouthAt, cheeks, top, human = false }) {
    let out = '';
    eyes.forEach(([x, y], i) => {
      let side = x < 50 ? -1 : x > 50 ? 1 : (i % 2 ? 1 : -1);
      if (eyes.length === 1) side = -1; // one eye: a wink shows the open eye
      out += `<g transform="translate(${x} ${y}) scale(${size})">${eye(s.eyes, side)}</g>`;
    });
    if (s.cheeks === 'blush') {
      out += cheeks.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4.4" ry="2.5" fill="#ff8fa3" opacity=".55"/>`).join('');
    }
    if (s.cheeks === 'shy') {
      out += cheeks.map(([x, y]) => `<g ${line(1.2)} stroke="#ff6f8f"><path d="M${x - 3.5} ${y + 1.5} l2 -3"/><path d="M${x - .5} ${y + 1.5} l2 -3"/><path d="M${x + 2.5} ${y + 1.5} l2 -3"/></g>`).join('');
    }
    out += `<g transform="translate(${mouthAt[0]} ${mouthAt[1]})">${mouth(s.mouth, nose, human)}</g>`;
    const [tx, ty] = top;
    const font = 'font-family="Arial Rounded MT Bold, Arial, sans-serif" font-weight="700"';
    switch (s.extra) {
      case 'zzz':
        out += `<g fill="#6a7fdb" ${font}><text x="${tx}" y="${ty}" font-size="7">z</text><text x="${tx + 5}" y="${ty - 5}" font-size="9">Z</text></g>`;
        break;
      case 'sweat':
        out += `<path transform="translate(${tx + 2} ${ty})" d="M0 -6 C1.8 -2.6 3.6 0 3.6 2 A3.6 3.6 0 0 1 -3.6 2 C-3.6 0 -1.8 -2.6 0 -6Z" fill="#8fd3ff" stroke="#fff" stroke-width="1.2"/>`;
        break;
      case 'question':
        out += `<g fill="${INK}" ${font}><text x="${tx - 22}" y="${ty + 2}" font-size="8">?</text><text x="${tx - 15}" y="${ty - 3}" font-size="10">?</text><text x="${tx - 6}" y="${ty + 1}" font-size="8">?</text></g>`;
        break;
      case 'heart':
        out += `<path transform="translate(${tx + 2} ${ty}) scale(1.1)" d="M0 3.6 C-6 -0.5 -4 -6 0 -2.6 C4 -6 6 -0.5 0 3.6Z" fill="#ff5d8f" stroke="#fff" stroke-width="1"/>`;
        break;
      case 'sparkle':
        out += `<path transform="translate(${tx + 2} ${ty})" d="M0 -6 Q.8 -.8 6 0 Q.8 .8 0 6 Q-.8 .8 -6 0 Q-.8 -.8 0 -6Z" fill="#ffd54a" stroke="#fff" stroke-width="1"/>` +
          `<path transform="translate(${tx - 5} ${ty + 6}) scale(.5)" d="M0 -6 Q.8 -.8 6 0 Q.8 .8 0 6 Q-.8 .8 -6 0 Q-.8 -.8 0 -6Z" fill="#ffd54a"/>`;
        break;
      case 'anger':
        out += `<g transform="translate(${tx + 2} ${ty})" stroke="#e5484d" stroke-width="1.6" fill="none" stroke-linecap="round">` +
          `<path d="M-4 -1 Q-1 -1 -1 -4"/><path d="M1 -4 Q1 -1 4 -1"/><path d="M4 1 Q1 1 1 4"/><path d="M-1 4 Q-1 1 -4 1"/></g>`;
        break;
      default:
        break;
    }
    return out;
  }

  // White sticker outline drawn behind a set of shapes.
  function outline(shapes, width = 6) {
    return `<g fill="#fff" stroke="#fff" stroke-width="${width}" stroke-linejoin="round">${shapes}</g>`;
  }

  // ---------- People ----------

  // Human face shapes. Each has its outline, where the ears go, and where the chin is.
  const PERSON_FACES = {
    oval: { d: 'M50 26 C64 26 74 36 74 50 C74 62 69 71 62 76 C58 79 54 80 50 80 C46 80 42 79 38 76 C31 71 26 62 26 50 C26 36 36 26 50 26Z', ear: 26, chin: 80 },
    round: { d: 'M50 27 C65 27 76 38 76 52 C76 67 64 78 50 78 C36 78 24 67 24 52 C24 38 35 27 50 27Z', ear: 24.5, chin: 78 },
    long: { d: 'M50 25 C62 25 71 34 71 48 C71 62 68 73 61 78 C57 81 53 82 50 82 C47 82 43 81 39 78 C32 73 29 62 29 48 C29 34 38 25 50 25Z', ear: 29, chin: 82 },
    square: { d: 'M50 26 C66 26 74 34 74 48 C74 60 73 70 68 75 C63 79 57 80 50 80 C43 80 37 79 32 75 C27 70 26 60 26 48 C26 34 34 26 50 26Z', ear: 26, chin: 80 },
    heart: { d: 'M50 26 C65 26 75 36 75 48 C75 57 72 64 66 70 C61.5 75 57 80 50 80 C43 80 38.5 75 34 70 C28 64 25 57 25 48 C25 36 35 26 50 26Z', ear: 25.5, chin: 80 },
  };

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
      case 'longcurly': {
        // A big cloud of curls down past the shoulders, with curly bangs.
        const mass = [[24, 38], [19, 48], [17, 58], [18, 68], [21, 77], [27, 85], [30, 28], [40, 21], [50, 19], [60, 21], [70, 28], [76, 38], [81, 48], [83, 58], [82, 68], [79, 77], [73, 85]];
        back = mass.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${hc}"/>`).join('');
        front = [[30, 36], [37, 29], [45, 26], [55, 26], [63, 29], [70, 36]]
          .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7.5" fill="${hc}"/>`).join('');
        break;
      }
      case 'braids': {
        // Two braids hanging down past the ears, tied with a little band.
        const tie = '#ff86ab';
        const braid = side => {
          const x = side < 0 ? 22 : 78;
          let o = '';
          [58, 66, 74, 82].forEach((y, i) => {
            o += `<ellipse cx="${x + side * (i % 2 ? 1.2 : -1.2)}" cy="${y}" rx="6.4" ry="5.2" fill="${hc}" stroke="${shade(hc, -0.25)}" stroke-width=".9"/>`;
          });
          o += `<rect x="${x - 4}" y="86" width="8" height="4" rx="2" fill="${tie}"/>`;
          o += `<path d="M${x - 3.5} 90 L${x} 97 L${x + 3.5} 90Z" fill="${hc}"/>`;
          return o;
        };
        back = braid(-1) + braid(1);
        front = shortTop;
        break;
      }
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
    // Under a beanie or nightcap the hair on top is hidden; only what hangs down shows.
    if (s.hat === 'beanie' || s.hat === 'nightcap') {
      const below = 38;
      const keepLow = svgStr => svgStr.replace(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"([^>]*)\/>/g, (m, x, y) => (Number(y) >= below ? m : ''));
      if (s.hair === 'curly' || s.hair === 'longcurly') { back = keepLow(back); front = keepLow(front); }
      else if (s.hair === 'bun') { back = ''; front = ''; }
      else if (s.hair === 'long') { back = `<path d="M22 44 L78 44 L79 80 Q50 87 21 80Z" fill="${hc}"/>`; front = ''; }
      else front = '';
    }
    const f = PERSON_FACES[s.faceShape] || PERSON_FACES.oval;
    const head = `<circle cx="${f.ear}" cy="54" r="5" fill="${skin}"/><circle cx="${100 - f.ear}" cy="54" r="5" fill="${skin}"/>` +
      `<path d="${f.d}" fill="${skin}"/>`;
    const eyes = [[41, 54], [59, 54]];
    const art = outline(back + head + front) + back + head + front +
      face(s, { eyes, size: 1.05, mouthAt: [50, 62], cheeks: [[35, 62], [65, 62]], top: [70, 28], human: true });
    const hatY = s.hair === 'spiky' ? 25 : s.hair === 'curly' || s.hair === 'longcurly' ? 24 : 27;
    // Beanies and nightcaps are pulled down over the hair, not perched on top of it.
    const big = s.hair === 'curly' || s.hair === 'longcurly' || s.hair === 'spiky';
    return { art, eyes, eyeSize: 1.05, hat: [50, hatY, 44], worn: [50, big ? 35 : 37, big ? 62 : 58], hairTop: big ? 14 : 18, chin: [50, f.chin] };
  }

  // ---------- Aliens ----------

  // One antenna from the head (bx, by) up to the tip (tx, ty).
  // side flips curls and bends so a pair looks mirrored.
  // w is the line width; the white sticker outline is the same antenna drawn wider in white.
  function antenna(bx, by, tx, ty, style, color, side, w = 3) {
    const extra = (w - 3) / 2;
    const stroke = `stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"`;
    const ball = `<circle cx="${tx}" cy="${ty - 2}" r="${4.5 + extra}" fill="${color}"/>`;
    const dx = tx - bx, dy = ty - by;
    const len = Math.hypot(dx, dy);
    const px = -dy / len, py = dx / len; // sideways direction
    const at = (t, off) => `${(bx + dx * t + px * off).toFixed(1)} ${(by + dy * t + py * off).toFixed(1)}`;
    switch (style) {
      case 'zigzag':
        return `<path d="M${at(0, 0)} L${at(0.25, 3.2)} L${at(0.5, -3.2)} L${at(0.75, 3.2)} L${at(1, 0)}" ${stroke}/>` + ball;
      case 'crooked':
        // Bends sharply partway up, like a bent straw.
        return `<path d="M${at(0, 0)} L${at(0.45, 0)} L${at(0.7, 9 * side)} L${at(1, 7 * side)}" ${stroke}/>` +
          `<circle cx="${(bx + dx + px * 7 * side).toFixed(1)}" cy="${(by + dy + py * 7 * side - 2).toFixed(1)}" r="${4.5 + extra}" fill="${color}"/>`;
      case 'spiral': {
        // Stem, then a big curl that winds inward instead of a ball.
        const cx = tx, cy = ty - 6, turns = 1.6, steps = 40;
        let d = `M${at(0, 0)} L${cx} ${cy + 9}`;
        for (let n = 0; n <= steps; n++) {
          const t = n / steps;
          const a = Math.PI / 2 + side * t * turns * Math.PI * 2;
          const r = 9 - 7 * t;
          d += ` L${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`;
        }
        return `<path d="${d}" stroke="${color}" stroke-width="${w > 3 ? 5.4 : 2.4}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
      }
      default:
        return `<path d="M${at(0, 0)} L${at(1, 0)}" ${stroke}/>` + ball;
    }
  }

  function alien(s, uid) {
    const c = s.color, dark = shade(c, -0.25);
    const heads = {
      round: { cy: 54, rx: 26, ry: 26 },
      tall: { cy: 52, rx: 21, ry: 30 },
      wide: { cy: 56, rx: 31, ry: 21 },
      // Extra wide: almost twice as wide as it is tall, a little flatter on the bottom.
      xwide: { cy: 57, rx: 35, ry: 19, d: 'M50 38 C72 38 85 45 85 56 C85 68 70 76 50 76 C30 76 15 68 15 56 C15 45 28 38 50 38Z' },
      // Big forehead tapering to a small chin.
      bulb: { cy: 52, rx: 28, ry: 27, d: 'M50 25 C68 25 78 36 78 49 C78 61 67 71 59 77 C56 79 53 81 50 81 C47 81 44 79 41 77 C33 71 22 61 22 49 C22 36 32 25 50 25Z' },
      // Classic alien: tall rounded forehead and a narrow pointed chin.
      classic: { cy: 52, rx: 28, ry: 30, eyeY: 54, d: 'M50 22 C68 22 79 34 78 48 C77 60 66 72 56 80 C53 82.5 51.5 83 50 83 C48.5 83 47 82.5 44 80 C34 72 23 60 22 48 C21 34 32 22 50 22Z' },
    };
    const h = heads[s.head] || heads.round;
    const top = h.cy - h.ry;
    const ants = color => {
      const w = color === '#fff' ? 7 : 3;
      if (s.antennae === 1) return antenna(50, top + 2, 50, top - 14, s.antennaStyle, color, 1, w);
      if (s.antennae === 2) return antenna(41, top + 4, 31, top - 12, s.antennaStyle, color, -1, w) + antenna(59, top + 4, 69, top - 12, s.antennaStyle, color, 1, w);
      return '';
    };
    const ant = ants(dark);
    const antOutline = ants('#fff');
    const headD = h.d || `M50 ${h.cy - h.ry} A${h.rx} ${h.ry} 0 1 1 49.99 ${h.cy - h.ry}Z`;
    const headShape = `<path d="${headD}" fill="${c}"/>`;

    // Skin: a few spots, lots of freckles, or twinkling stars.
    const clipId = uid + 'a';
    let skin = '';
    if (s.skinPattern === 'spots') {
      skin = [[-0.6, 0.45, 2.4], [0.62, -0.45, 2], [-0.25, -0.62, 1.5], [0.15, -0.7, 1.1], [0.38, -0.58, 1.4]]
        .map(([fx, fy, r]) => `<circle cx="${50 + h.rx * fx}" cy="${h.cy + h.ry * fy}" r="${r}" fill="${dark}" opacity=".45"/>`).join('');
    } else if (s.skinPattern === 'stars') {
      const star = (x, y, r, col) => `<path transform="translate(${x} ${y}) scale(${r / 6})" d="M0 -6 Q.8 -.8 6 0 Q.8 .8 0 6 Q-.8 .8 -6 0 Q-.8 -.8 0 -6Z" fill="${col}"/>`;
      skin = [[-0.55, -0.55, 3.2], [0.5, -0.65, 2], [0.7, 0.05, 1.6], [-0.75, 0.2, 1.8], [-0.2, -0.82, 1.3], [0.25, 0.7, 1.6], [-0.45, 0.62, 1.2]]
        .map(([fx, fy, r], n) => star(50 + h.rx * fx, h.cy + h.ry * fy, r, n % 2 ? '#fff' : shade(c, 0.6))).join('') +
        [[-0.3, -0.3], [0.32, -0.38], [0.6, 0.4], [-0.62, -0.1], [0.05, -0.55], [-0.1, 0.8]]
          .map(([fx, fy]) => `<circle cx="${50 + h.rx * fx}" cy="${h.cy + h.ry * fy}" r=".8" fill="#fff" opacity=".85"/>`).join('');
    }
    const skinLayer = skin ? `<defs><clipPath id="${clipId}"><path d="${headD}"/></clipPath></defs><g clip-path="url(#${clipId})">${skin}</g>` : '';

    const ey = h.eyeY || h.cy - 3;
    let eyes, size;
    if (s.eyeCount === 1) { eyes = [[50, ey]]; size = 1.9; }
    else if (s.eyeCount === 2) { const dx = Math.max(9.5, h.rx * 0.36); eyes = [[50 - dx, ey], [50 + dx, ey]]; size = 1.4; }
    else { const dx = Math.max(13, h.rx * 0.48); eyes = [[50 - dx, ey + 2], [50, ey - 7], [50 + dx, ey + 2]]; size = 1.15; }
    let features = face(s, { eyes, size, mouthAt: [50, h.cy + h.ry * 0.42], cheeks: [[50 - h.rx * 0.62, ey + 9], [50 + h.rx * 0.62, ey + 9]], top: [50 + h.rx * 0.7, top + 4], human: true });
    // On a dark alien, draw the face lines light so they can be seen.
    if (lightness(c) < 0.4) features = features.split(INK).join(LIGHT_INK);
    const art = antOutline + outline(headShape) + ant + headShape + skinLayer + features;
    return { art, eyes, eyeSize: size * 0.8, hat: [50, top + 5, h.rx * 1.25], chin: [50, h.cy + h.ry - 1] };
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

  // Dragon hair tuft. fill is an attribute string ('' lets the white outline fill it).
  function tuftShapes(style, fill) {
    switch (style) {
      case 'sprout':
        return `<ellipse cx="50" cy="23" rx="3.2" ry="7.5" ${fill}/>` +
          `<ellipse cx="44.5" cy="28" rx="2.6" ry="5.8" transform="rotate(-55 44.5 28)" ${fill}/>` +
          `<ellipse cx="55.5" cy="28" rx="2.6" ry="5.8" transform="rotate(55 55.5 28)" ${fill}/>`;
      case 'single':
        return `<path d="M50 33 C45 27 46 19 50 14 C54 19 55 27 50 33Z" ${fill}/>`;
      case 'curl':
        return `<path d="M50 33 C43 29 43 20 50 17 C56 15 60 20 57 24 C55 26 51.5 25 52.5 22 C49 23 48 28 53 32Z" ${fill}/>`;
      case 'spikes':
        return `<path d="M41 34 L44 22 L47 31 L50 19 L53 31 L56 22 L59 34Z" ${fill}/>`;
      case 'puff':
        return `<circle cx="44" cy="30" r="4.6" ${fill}/><circle cx="50" cy="26.5" r="5" ${fill}/><circle cx="56" cy="30" r="4.6" ${fill}/>`;
      default:
        return '';
    }
  }

  // Dragon wing on the left side of the head (the right one is a mirror).
  // A thick arm bone rises from the top corner of the head to an elbow above the head,
  // then runs straight out to the tip. Two thin ribs fan down from the elbow to a scalloped
  // edge, and a fairly straight edge runs from the lowest point back to the head.
  const WING = { base: [33, 34.5], elbow: [26, 25.5], tip: [5, 26], s1: [10.5, 36], low: [18.5, 44.5], join: [25, 43.5] };
  const WING_PATH = (() => {
    const { base, elbow, tip, s1, low, join } = WING;
    return `M${base} L${elbow} L${tip} Q11.5 30 ${s1} Q17.5 38 ${low} L${join}Z`.replace(/,/g, ' ');
  })();
  function wingArt(c) {
    const { base, elbow, tip, s1, low } = WING;
    const p = ([x, y]) => `${x} ${y}`;
    return `<path d="${WING_PATH}" fill="#f9e7b0" stroke="${c}" stroke-width="1" stroke-linejoin="round"/>` +
      `<path d="M${p(elbow)} L${p(s1)}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M${p(elbow)} L${p(low)}" stroke="${c}" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M${p(base)} L${p(elbow)} L${p(tip)}" stroke="${c}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
  }

  // Shapes for dogs, bunnies and bears.
  function otherAnimal(kind, s = {}) {
    switch (kind) {
      case 'dog':
        // Puppy: long floppy ears, a big light muzzle, nose on top of the muzzle.
        return {
          head: 'M50 29 C66 29 77 38 79 51 C81 62 79 72 72 78 C66 83 58 84 50 84 C42 84 34 83 28 78 C21 72 19 62 21 51 C23 38 34 29 50 29Z',
          earsFront: ['M31 33 C17 30 8 44 10 61 C11 71 19 74 24 66 C28 57 30 45 35 37Z', 'M69 33 C83 30 92 44 90 61 C89 71 81 74 76 66 C72 57 70 45 65 37Z'],
          nose: 'black',
          muzzle: [50, 67, 14, 10.5],
          eyes: [[39, 51], [61, 51]], mouthAt: [50, 62], cheeks: [[30, 62], [70, 62]], top: [72, 31], hat: [50, 30, 30], chin: [50, 82],
        };
      case 'bunny':
        // Puffy cheeks, tall upright ears close together, little buck teeth.
        return {
          head: 'M50 37 C65 37 75 46 76 57 C82 62 82 73 73 78 C66 83 58 84 50 84 C42 84 34 83 27 78 C18 73 18 62 24 57 C25 46 35 37 50 37Z',
          earsBack: ['M38 42 C31 30 31 11 37 7 C43 4 47 22 46 40Z', 'M62 42 C69 30 69 11 63 7 C57 4 53 22 54 40Z'],
          inner: 'M39 37 C35 28 35 15 38 12 C41 11 43 24 43 36Z M61 37 C65 28 65 15 62 12 C59 11 57 24 57 36Z',
          nose: 'pink',
          teeth: true,
          eyes: [[39, 59], [61, 59]], mouthAt: [50, 66], cheeks: [[30, 70], [70, 70]], top: [72, 38], hat: [50, 40, 24], chin: [50, 84],
        };
      case 'chihuahua':
        // Tall upright ears with rounded tips, a domed head with a light stripe,
        // huge glossy eyes with darker marks above them, and a short light muzzle.
        return {
          head: 'M50 27 C68 27 80 38 80 52 C80 62 74 69 66 73 C61 77 56 81 50 81 C44 81 39 77 34 73 C26 69 20 62 20 52 C20 38 32 27 50 27Z',
          earsBack: ['M23 45 C17 34 13 17 14 9 Q15 3 21 5 C30 10 38 19 43 30Z', 'M77 45 C83 34 87 17 86 9 Q85 3 79 5 C70 10 62 19 57 30Z'],
          inner: 'M25 39 C21 30 18 19 19 12 C26 15 32 22 37 31Z M75 39 C79 30 82 19 81 12 C74 15 68 22 63 31Z',
          innerColor: 'peach',
          extraArt: c => {
            const light = '#fbf8f3', dark = shade(c, -0.25);
            return `<ellipse cx="36" cy="44" rx="6" ry="3.2" fill="${dark}" opacity=".55"/><ellipse cx="64" cy="44" rx="6" ry="3.2" fill="${dark}" opacity=".55"/>` +
              `<path d="M50 30 C54 36 55 45 54 54 L46 54 C45 45 46 36 50 30Z" fill="${light}"/>`;
          },
          muzzle: [50, 66, 10.5, 9],
          muzzleColor: '#fbf8f3',
          nose: 'black',
          eyeSize: 1.9,
          eyes: [[36, 53], [64, 53]], mouthAt: [50, 62.5], cheeks: [[27, 63], [73, 63]], top: [74, 30], hat: [50, 28, 26], chin: [50, 80],
        };
      case 'mouse':
        // Big round ears and a pointed snout with a round pink nose at the tip.
        return {
          head: 'M50 41 C67 41 78 52 75 63 C72 73 60 81 52 84 Q50 85 48 84 C40 81 28 73 25 63 C22 52 33 41 50 41Z',
          earsBack: ['M12 38 A14 14 0 1 1 40 38 A14 14 0 1 1 12 38Z', 'M60 38 A14 14 0 1 1 88 38 A14 14 0 1 1 60 38Z'],
          inner: 'M17 38 A9 9 0 1 1 35 38 A9 9 0 1 1 17 38Z M65 38 A9 9 0 1 1 83 38 A9 9 0 1 1 65 38Z',
          nose: 'ball',
          whiskers: 'short',
          eyes: [[41, 60], [59, 60]], mouthAt: [50, 75], cheeks: [[33, 67], [67, 67]], top: [70, 42], hat: [50, 43, 24], chin: [50, 85],
        };
      case 'fox':
        // A narrow pointed face, white lower fur, dark inside the ears.
        return {
          head: 'M50 34 C66 34 82 43 87 53 C79 64 63 77 50 86 C37 77 21 64 13 53 C18 43 34 34 50 34Z',
          earsBack: ['M20 47 L22 12 Q23 7 28 10 L46 35Z', 'M80 47 L78 12 Q77 7 72 10 L54 35Z'],
          inner: 'M24 41 L25.5 19 L39 34Z M76 41 L74.5 19 L61 34Z',
          innerColor: 'dark',
          cheeksFur: 'M13 53 C26 59 40 61 50 69 C60 61 74 59 87 53 C79 64 63 77 50 86 C37 77 21 64 13 53Z',
          nose: 'black',
          eyes: [[36, 54], [64, 54]], mouthAt: [50, 76], cheeks: [[26, 61], [74, 61]], top: [74, 35], hat: [50, 36, 30], chin: [50, 86],
        };
      case 'sheep':
        // Fluffy wool all around, a smooth face in the middle, ears sticking out over the wool.
        return {
          sheep: true,
          head: fluffyHead(50, 53, 32, 28, 14),
          earsFront: ['M35 55 C26 49 12 51 8 57 C12 63 26 64 35 60Z', 'M65 55 C74 49 88 51 92 57 C88 63 74 64 65 60Z'],
          nose: 'none',
          eyeSize: 0.95,
          eyes: [[43, 60], [57, 60]], mouthAt: [50, 69], cheeks: [[38, 68], [62, 68]], top: [72, 30], hat: [50, 28, 30], chin: [50, 80],
        };
      case 'dragon':
        // Baby dragon: big round head, a hair tuft (several shapes, or none), bat wings on the
        // upper sides of the head that hang down like an open fan, cream freckles, little brows,
        // a soft double-bump nose, and (optional) tiny horns.
        return {
          head: (s.face === 'chubby')
            ? 'M50 28 C65 28 76 37 78.5 49 C80.5 59 81.5 69 77 77 C71.5 85 61 88 50 88 C39 88 28.5 85 23 77 C18.5 69 19.5 59 21.5 49 C24 37 35 28 50 28Z'
            : 'M50 28 C68 28 80 41 80 57.5 C80 74 67 87 50 87 C33 87 20 74 20 57.5 C20 41 32 28 50 28Z',
          wing: true,
          outlineArt: s2 => `<g transform="translate(0 -2)">${tuftShapes(s2.tuft, '')}</g>`,
          extraArt: (c, s2) => {
            const tuft = shade(c, -0.06), dots = '#fbe3a0', brow = shade(c, -0.25);
            const horns = s2.horns === 'tiny'
              ? `<path d="M38 32 C37 27 38 24 40 22 C41 25 43 28 44 30Z" fill="#f3e2b3"/><path d="M62 32 C63 27 62 24 60 22 C59 25 57 28 56 30Z" fill="#f3e2b3"/>`
              : '';
            return horns + `<g transform="translate(0 -2)">${tuftShapes(s2.tuft, `fill="${tuft}"`)}</g>` +
              [[44, 45, 1.5], [50, 43, 2], [56, 45, 1.5], [47, 49, 1.2], [53, 49, 1.2], [41, 50, 1], [59, 50, 1], [50, 52, 1.3]]
                .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${dots}"/>`).join('') +
              `<ellipse cx="30" cy="49" rx="3.6" ry="1.6" transform="rotate(-12 30 49)" fill="${brow}" opacity=".7"/>` +
              `<ellipse cx="70" cy="49" rx="3.6" ry="1.6" transform="rotate(12 70 49)" fill="${brow}" opacity=".7"/>`;
          },
          nose: 'bumps',
          humanMouth: true,
          eyeSize: 1.75,
          eyes: [[36, 59.5], [64, 59.5]], mouthAt: [50, 71], cheeks: [[27, 69], [73, 69]], top: [76, 32], hat: [50, 28, 28], chin: [50, 87],
        };
      default: // bear
        // Small round ears high on the head, a wide face, a big light muzzle.
        return {
          head: 'M50 33 C65 33 77 41 80 53 C84 65 80 76 70 82 C64 85 57 86 50 86 C43 86 36 85 30 82 C20 76 16 65 20 53 C23 41 35 33 50 33Z',
          earsBack: ['M18 34 A9 9 0 1 1 36 34 A9 9 0 1 1 18 34Z', 'M64 34 A9 9 0 1 1 82 34 A9 9 0 1 1 64 34Z'],
          inner: 'M22.5 34 A4.5 4.5 0 1 1 31.5 34 A4.5 4.5 0 1 1 22.5 34Z M68.5 34 A4.5 4.5 0 1 1 77.5 34 A4.5 4.5 0 1 1 68.5 34Z',
          innerColor: 'light',
          nose: 'black',
          muzzle: [50, 68, 13, 10],
          eyeSize: 0.95,
          eyes: [[40, 55], [60, 55]], mouthAt: [50, 64], cheeks: [[28, 64], [72, 64]], top: [74, 35], hat: [50, 35, 32], chin: [50, 85],
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
    const isCat = !['dog', 'chihuahua', 'bunny', 'bear', 'mouse', 'fox', 'sheep', 'dragon'].includes(s.kind);
    const clipId = uid + 'h';
    let k, earsBack = '', earsFront = '', inner = '', outlineEars = '';

    // Which ears take the patch color.
    const earL = s.coat === 'calico' || s.coat === 'mask' ? p : c;
    const earR = s.coat === 'patch' || s.coat === 'mask' ? p : c;

    if (isCat) {
      k = { ...CAT_FACES[s.face] || CAT_FACES.round, nose: 'pink', whiskers: true };
      const ears = s.face === 'wide' && s.ears === 'folded' ? 'pointy' : (s.ears || 'pointy');
      const ed = earPath(ears, k.ear), idd = innerEarPath(ears, k.ear);
      const mirror = d => `<g transform="translate(100 0) scale(-1 1)">${d}</g>`;
      earsBack = `<path d="${ed}" fill="${earL}"/>` + mirror(`<path d="${ed}" fill="${earR}"/>`);
      inner = `<path d="${idd}" fill="${PINK}" opacity=".9"/>` + mirror(`<path d="${idd}" fill="${PINK}" opacity=".9"/>`);
      outlineEars = `<path d="${ed}"/>` + mirror(`<path d="${ed}"/>`);
    } else {
      k = otherAnimal(s.kind, s);
      if (k.wing) {
        const mirror = d => `<g transform="translate(100 0) scale(-1 1)">${d}</g>`;
        earsBack = wingArt(c) + mirror(wingArt(c));
        const wingOutline = `<path d="${WING_PATH}" stroke-width="7"/>`;
        outlineEars = wingOutline + mirror(wingOutline);
      }
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
      if (k.inner) {
        const ic = k.innerColor === 'dark' ? '#4a4545' : k.innerColor === 'peach' ? '#f4bfa6' : k.innerColor === 'wing' ? '#f6d58a' : k.innerColor ? shade(c, 0.45) : PINK;
        inner = `<path d="${k.inner}" fill="${ic}"/>`;
      }
    }

    let head = `<path d="${k.head}" fill="${c}"/>`;
    // Fox: white fur on the lower face.
    if (k.cheeksFur) head += `<path d="${k.cheeksFur}" fill="#fbf8f3"/>`;
    if (k.extraArt) head += k.extraArt(c, s);
    // Sheep: a smooth face in the middle of the wool, with a little tuft on top.
    let sheepFaceColor = null;
    if (k.sheep) {
      sheepFaceColor = lightness(c) > 0.6 ? '#4a4545' : '#f6e3c3';
      earsFront = `<path d="${k.earsFront[0]}" fill="${sheepFaceColor}"/><path d="${k.earsFront[1]}" fill="${sheepFaceColor}"/>`;
      head += `<ellipse cx="50" cy="62" rx="16" ry="18" fill="${sheepFaceColor}"/>` +
        `<circle cx="41" cy="46" r="7" fill="${c}"/><circle cx="50" cy="43" r="7.5" fill="${c}"/><circle cx="59" cy="46" r="7" fill="${c}"/>`;
    }
    const muzzle = k.muzzle ? `<ellipse cx="${k.muzzle[0]}" cy="${k.muzzle[1]}" rx="${k.muzzle[2]}" ry="${k.muzzle[3]}" fill="${k.muzzleColor || shade(c, 0.5)}"/>` : '';
    const [nx, ny] = k.mouthAt;
    const whiskers = k.whiskers === 'short'
      ? `<g ${line(1)}><path d="M${nx - 5} ${ny - 1} L${nx - 22} ${ny - 5}"/><path d="M${nx - 5} ${ny + 1.5} L${nx - 22} ${ny + 3}"/><path d="M${nx + 5} ${ny - 1} L${nx + 22} ${ny - 5}"/><path d="M${nx + 5} ${ny + 1.5} L${nx + 22} ${ny + 3}"/></g>`
      : k.whiskers
      ? `<g ${line(1)}><path d="M30 ${k.mouthAt[1] - 3} L2 ${k.mouthAt[1] - 8}"/><path d="M30 ${k.mouthAt[1]} L1 ${k.mouthAt[1] + 1}"/><path d="M30 ${k.mouthAt[1] + 3} L4 ${k.mouthAt[1] + 10}"/>` +
        `<path d="M70 ${k.mouthAt[1] - 3} L98 ${k.mouthAt[1] - 8}"/><path d="M70 ${k.mouthAt[1]} L99 ${k.mouthAt[1] + 1}"/><path d="M70 ${k.mouthAt[1] + 3} L96 ${k.mouthAt[1] + 10}"/></g>`
      : '';
    let features = face(s, { eyes: k.eyes, size: k.eyeSize || 1.05, nose: k.nose, mouthAt: k.mouthAt, cheeks: k.cheeks, top: k.top, human: !!k.humanMouth });
    // Dragon: two tiny fangs under a closed mouth.
    if (k.fangs && ['smile', 'small', 'flat', 'wobble'].includes(s.mouth)) {
      const fy = k.mouthAt[1] + (s.mouth === 'smile' ? 4.6 : 4);
      features += `<g fill="#fff" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"><path d="M44.5 ${fy} L46.5 ${fy} L45.5 ${fy + 3}Z"/><path d="M53.5 ${fy} L55.5 ${fy} L54.5 ${fy + 3}Z"/></g>`;
    }
    // On dark fur (or a dark colorpoint mask), draw the face in a light color so it can be seen.
    // Bunny buck teeth show under a closed mouth.
    if (k.teeth && ['smile', 'small', 'flat', 'wobble'].includes(s.mouth)) {
      features += `<g transform="translate(${nx} ${ny + 5.2})" stroke="${INK}" stroke-width=".8"><rect x="-2.6" y="0" width="2.6" height="3.6" rx=".6" fill="#fff"/><rect x="0" y="0" width="2.6" height="3.6" rx=".6" fill="#fff"/></g>`;
    }
    const faceColor = sheepFaceColor || (s.coat === 'mask' ? p : c);
    if (lightness(faceColor) < 0.4 && !muzzle) features = features.split(INK).join(LIGHT_INK);
    const art = `<defs><clipPath id="${clipId}"><path d="${k.head}"/></clipPath></defs>` +
      outline(outlineEars + `<path d="${k.head}"/>` + (k.outlineExtra ? `<path d="${k.outlineExtra}"/>` : '') + (k.outlineArt ? k.outlineArt(s) : '')) +
      earsBack + inner + head + coat(s, clipId, k) + earsFront + muzzle + features + whiskers;
    return { art, eyes: k.eyes, eyeSize: k.eyeSize || 1.05, hat: k.hat, chin: k.chin || [50, k.mouthAt[1] + 18] };
  }

  // ---------- Hats and glasses ----------

  // A hat drawn with its bottom middle at (0,0), about 30 wide.
  function hatArt(kind) {
    switch (kind) {
      case 'party':
        return `<g transform="rotate(-10)"><path d="M-11 0 L0 -27 L11 0Z" fill="#ff7aa2"/>` +
          `<circle cx="-3" cy="-7" r="2" fill="#ffd54a"/><circle cx="4" cy="-12" r="2" fill="#7fd1ff"/><circle cx="-1" cy="-18" r="1.7" fill="#ffd54a"/>` +
          `<circle cy="-28" r="3.6" fill="#ffd54a"/></g>`;
      case 'bowler':
        return `<g transform="rotate(-8)"><ellipse cy="-1" rx="16" ry="3.4" fill="#3a2f2a"/><path d="M-11 -1 C-11 -19 11 -19 11 -1Z" fill="#3a2f2a"/>` +
          `<rect x="-11" y="-5.5" width="22" height="3.4" fill="#a0785e"/></g>`;
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
      case 'nightcap':
        return `<path d="M-16 0 Q-14 -24 12 -20 Q22 -17 25 -3 L20.5 -3.5 Q18 -12 11 -12.5 Q12 -5 15 0Z" fill="#9fd3ec"/>` +
          `<g fill="#fff" opacity=".85"><circle cx="-6" cy="-9" r="1.4"/><circle cx="3" cy="-14" r="1.4"/><circle cx="6" cy="-6" r="1.4"/></g>` +
          `<rect x="-18" y="-4" width="35" height="6.5" rx="3.2" fill="#fff"/><circle cx="24" cy="-2" r="4.4" fill="#fff"/>`;
      case 'tophat':
        return `<ellipse cy="-1.5" rx="17" ry="3.4" fill="#333"/><rect x="-10.5" y="-25" width="21" height="24" rx="2" fill="#333"/>` +
          `<rect x="-10.5" y="-8" width="21" height="4.5" fill="#ff5d8f"/>`;
      case 'bow':
        return `<g transform="translate(17 -6) rotate(20)"><path d="M0 0 L-11 -7 L-11 7Z" fill="#ff5d8f"/><path d="M0 0 L11 -7 L11 7Z" fill="#ff5d8f"/>` +
          `<circle r="3.4" fill="#ff86ab"/></g>`;
      case 'flower':
        return `<g transform="translate(-13 -1)">` +
          [0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-5.5" rx="3.6" ry="5" fill="#fff" transform="rotate(${a})"/>`).join('') +
          `<circle r="3.6" fill="#ffd54a"/></g>`;
      default:
        return '';
    }
  }

  // Some hats are tiny on purpose (they're cuter that way).
  const HAT_SIZE = { crown: 0.55, bowler: 0.6, nightcap: 0.8 };

  function hatLayer(s, part) {
    if (part.worn && (s.hat === 'beanie' || s.hat === 'nightcap')) {
      const [x, y, w] = part.worn;
      return `<g transform="translate(${x} ${y}) scale(${w / 34})" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke">${hatArt(s.hat)}</g>`;
    }
    const [x, y, w] = part.hat;
    const art = hatArt(s.hat);
    if (!art) return '';
    const k = HAT_SIZE[s.hat] || 1;
    return `<g transform="translate(${x} ${y + (k < 1 ? 1 : 0)}) scale(${(w / 30) * k})" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" paint-order="stroke">${art}</g>`;
  }

  // A bow tie sitting just under the chin.
  function neckLayer(s, [x, y]) {
    if (!s.neck || s.neck === 'none') return '';
    const col = s.neck === 'bowtie-blue' ? '#5aa9e6' : '#ff86ab';
    const knot = shade(col, -0.15);
    return `<g transform="translate(${x} ${y})" stroke="#fff" stroke-width="2" stroke-linejoin="round" paint-order="stroke">` +
      `<path d="M0 0 L-9 -5 Q-10.5 0 -9 5Z" fill="${col}"/><path d="M0 0 L9 -5 Q10.5 0 9 5Z" fill="${col}"/>` +
      `<rect x="-2.6" y="-2.8" width="5.2" height="5.6" rx="1.6" fill="${knot}"/></g>`;
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
      f = { round: [44, 1.04], tall: [42, 1.0], wide: [47, 1.1], xwide: [50, 1.08], bulb: [46, 1.04], classic: [45, 0.98] }[s.head] || [44, 1.04];
    } else if (s.type === 'animal') {
      f = { cat: [52, 0.98], dog: [55, 1.0], chihuahua: [45, 0.88], bunny: [46, 0.94], bear: [58, 1.0], mouse: [58, 0.95], fox: [55, 0.98], sheep: [54, 0.98], dragon: [51, 0.9] }[s.kind] || [52, 0.98];
      if (s.kind === 'cat' && s.ears === 'big') f = [f[0] - 7, f[1] * 0.91];
    } else {
      f = [50, 1.13];
    }
    // Make room for a tall hat on top.
    if (s.hat && !['none', 'bow', 'flower', 'crown', 'bowler'].includes(s.hat)) f = [f[0] - 6, f[1] * 0.92];
    return f;
  }

  let clipCounter = 0;

  // Returns an SVG string for a sticker, clipped to a circle.
  function render(sticker) {
    let s = { ...DEFAULTS[sticker.type || 'person'], ...sticker };
    if (s.hat === 'pulled') s.hat = 'beanie';   // the pulled-down beanie was taken out
    // Older stickers: one "feeling", or old eye names.
    if (sticker.feeling && !sticker.mouth) s = applyPreset(s, PRESETS[sticker.feeling] ? sticker.feeling : 'happy');
    // Very old person stickers (before mouths existed) used different eye names.
    if (!sticker.mouth && OLD_EYES[sticker.eyes]) s.eyes = OLD_EYES[sticker.eyes];
    if (!EYES.includes(s.eyes)) s.eyes = 'happy';
    const id = 'stk' + (++clipCounter);
    let part;
    if (s.type === 'alien') part = alien(s, id);
    else if (s.type === 'animal') part = animal(s, id);
    else part = person(s);
    const [cy, scale] = frame(s);
    return `<svg class="sticker-svg" viewBox="0 0 100 100" aria-hidden="true">` +
      `<defs><clipPath id="${id}"><circle cx="50" cy="50" r="50"/></clipPath></defs>` +
      `<g clip-path="url(#${id})"><rect width="100" height="100" fill="${s.bg}"/>` +
      `<g transform="translate(50 50) scale(${scale}) translate(-50 ${-cy})">` +
      part.art + neckLayer(s, part.chin) + glassesLayer(s, part.eyes, part.eyeSize) + hatLayer(s, part) +
      `</g></g></svg>`;
  }

  // Starter stickers: at least one of every animal, plus people, aliens and dragons.
  // Kids can pick one and change it however they like.
  const STARTERS = [
    // Cats
    { type: 'animal', kind: 'cat', face: 'round', coat: 'calico', color: '#fbf8f3', patchColor: '#f5a54a', eyes: 'happy', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#bfe3ff' },
    { type: 'animal', kind: 'cat', face: 'wide', ears: 'pointy', coat: 'tabby', color: '#9e9e9e', eyes: 'happy', mouth: 'smile', cheeks: 'none', extra: 'none', bg: '#ffd2b0' },
    { type: 'animal', kind: 'cat', face: 'fluffy', coat: 'plain', color: '#fbf8f3', eyes: 'shiny', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#ffd6e0' },
    { type: 'animal', kind: 'cat', face: 'round', coat: 'mask', color: '#f6e3c3', patchColor: '#6b4a3a', eyes: 'big', mouth: 'small', cheeks: 'none', extra: 'none', bg: '#9be7c4' },
    { type: 'animal', kind: 'cat', face: 'wide', coat: 'twotone', color: '#4a4545', patchColor: '#fbf8f3', eyes: 'heart', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#ffe9a8' },
    // Other animals
    { type: 'animal', kind: 'dog', coat: 'patch', color: '#fbf8f3', patchColor: '#a47551', eyes: 'shiny', mouth: 'tongue', cheeks: 'none', extra: 'none', bg: '#ffe9a8' },
    { type: 'animal', kind: 'chihuahua', coat: 'plain', color: '#e0a878', eyes: 'shiny', mouth: 'smile', cheeks: 'none', extra: 'none', bg: '#bfe3ff' },
    { type: 'animal', kind: 'bunny', coat: 'plain', color: '#fbf8f3', eyes: 'shiny', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#ffd6e0' },
    { type: 'animal', kind: 'bear', coat: 'plain', color: '#a47551', eyes: 'happy', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#e2d4ff' },
    { type: 'animal', kind: 'mouse', coat: 'plain', color: '#b9a89a', eyes: 'shiny', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#ffe9a8' },
    { type: 'animal', kind: 'fox', coat: 'plain', color: '#e8925a', eyes: 'happy', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#bfe3ff' },
    { type: 'animal', kind: 'sheep', coat: 'plain', color: '#fbf8f3', eyes: 'happy', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#c8f0c0' },
    // Dragons
    { type: 'animal', kind: 'dragon', face: 'round', tuft: 'sprout', horns: 'none', coat: 'plain', color: '#e8655a', eyes: 'big', mouth: 'smile', cheeks: 'none', extra: 'none', bg: '#bfe3ff' },
    { type: 'animal', kind: 'dragon', face: 'round', tuft: 'curl', horns: 'none', coat: 'plain', color: '#7ccf7c', eyes: 'big', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#ffe9a8' },
    { type: 'animal', kind: 'dragon', face: 'chubby', tuft: 'puff', horns: 'tiny', coat: 'plain', color: '#6fa8dc', eyes: 'slit', mouth: 'smile', cheeks: 'none', extra: 'none', bg: '#ffd6e0' },
    // Aliens
    { type: 'alien', head: 'round', color: '#5aa9c9', eyeCount: 2, antennae: 2, antennaStyle: 'straight', skinPattern: 'spots', eyes: 'big', mouth: 'small', cheeks: 'none', extra: 'none', bg: '#e2d4ff' },
    { type: 'alien', head: 'classic', color: '#7ee081', eyeCount: 2, antennae: 0, antennaStyle: 'straight', skinPattern: 'plain', eyes: 'almond', mouth: 'smile', cheeks: 'none', extra: 'none', bg: '#bfe3ff' },
    { type: 'alien', head: 'bulb', color: '#c79bff', eyeCount: 2, antennae: 2, antennaStyle: 'spiral', skinPattern: 'spots', eyes: 'big', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#ffe9a8' },
    { type: 'alien', head: 'xwide', color: '#9be35a', eyeCount: 3, antennae: 1, antennaStyle: 'straight', skinPattern: 'spots', eyes: 'wide', mouth: 'open', cheeks: 'none', extra: 'none', bg: '#bfe3ff' },
    { type: 'alien', head: 'tall', color: '#2f3b2f', eyeCount: 2, antennae: 2, antennaStyle: 'zigzag', skinPattern: 'stars', eyes: 'slit', mouth: 'small', cheeks: 'none', extra: 'none', bg: '#ffd6e0' },
    // People
    { type: 'person', faceShape: 'oval', skin: '#f6c9a0', hair: 'short', hairColor: '#5a3825', eyes: 'shiny', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#bfe3ff' },
    { type: 'person', faceShape: 'round', skin: '#f6c9a0', hair: 'pigtails', hairColor: '#d94f2b', eyes: 'shiny', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#ffd6e0' },
    { type: 'person', faceShape: 'long', skin: '#c68642', hair: 'long', hairColor: '#2b1b12', eyes: 'shiny', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#ffe9a8' },
    { type: 'person', faceShape: 'square', skin: '#ffe0c7', hair: 'spiky', hairColor: '#e0b050', eyes: 'shiny', mouth: 'teeth', cheeks: 'blush', extra: 'none', bg: '#c8f0c0' },
    { type: 'person', faceShape: 'heart', skin: '#6e4423', hair: 'bun', hairColor: '#2b1b12', eyes: 'shiny', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#e2d4ff' },
    { type: 'person', faceShape: 'round', skin: '#4a2c17', hair: 'curly', hairColor: '#2b1b12', eyes: 'big', mouth: 'smile', cheeks: 'blush', extra: 'none', bg: '#ffd2b0' },
  ];

  return { COLORS, OPTIONS, DEFAULTS, FEELINGS, PRESETS, STARTERS, applyPreset, presetOf, render };
})();
