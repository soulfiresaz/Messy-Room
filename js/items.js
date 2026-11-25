// What goes where: the pictures a child picks for what each space holds.
// Most are emoji (big, colorful, no reading needed). A few things have no emoji,
// so they're drawn here in the sticker style. Kids can also take a photo of their own.
const Items = (() => {
  const INK = '#3a2a2a';
  const L = (w = 3) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  // Drawn pictures, on a 60 x 60 grid.
  const DRAWN = {
    tablet: `<rect x="12" y="6" width="36" height="48" rx="6" fill="#4a4a5a" ${L()}/><rect x="16" y="11" width="28" height="36" rx="2" fill="#8fd3ff"/><circle cx="30" cy="50.5" r="2" fill="#c9cfd8"/>`,
    belt: `<path d="M6 34 Q30 22 54 34" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/><path d="M6 34 Q30 22 54 34" fill="none" stroke="#a0522d" stroke-width="8" stroke-linecap="round"/><rect x="22" y="20" width="16" height="16" rx="3" fill="none" stroke="#e0b050" stroke-width="4"/>`,
    apron: `<path d="M22 8 L38 8 L40 22 L50 26 L46 54 L14 54 L10 26 L20 22 Z" fill="#ff9fb8" ${L()}/><rect x="22" y="34" width="16" height="10" rx="2" fill="#ff7aa2" ${L(2)}/><path d="M10 26 L4 30 M50 26 L56 30" ${L(3)}/>`,
    pajamas: `<path d="M14 10 L24 6 Q30 12 36 6 L46 10 L52 22 L44 26 L42 22 L42 54 L18 54 L18 22 L16 26 L8 22 Z" fill="#b9a2ff" ${L()}/><g fill="#fff"><circle cx="24" cy="28" r="2.2"/><circle cx="35" cy="34" r="2.2"/><circle cx="26" cy="44" r="2.2"/><path d="M33 14 l1.2 2.6 2.8 .3 -2.1 1.9 .6 2.8 -2.5 -1.4 -2.5 1.4 .6 -2.8 -2.1 -1.9 2.8 -.3z"/></g>`,
    blanket: `<rect x="6" y="14" width="48" height="34" rx="6" fill="#7fd8c0" ${L()}/><path d="M6 24 H54 M6 38 H54" stroke="#fff" stroke-width="3"/><path d="M14 14 V48 M30 14 V48 M46 14 V48" stroke="#5fb8a0" stroke-width="2"/><path d="M8 48 l-2 5 M16 48 l-1 5 M24 48 v5 M32 48 v5 M40 48 l1 5 M48 48 l2 5" ${L(2)}/>`,
  };

  // key: [picture, label]. A picture starting with "d:" is drawn above.
  const GROUPS = [
    { key: 'clothes', icon: '👕', label: 'Clothes', items: [
      ['shirts', '👕', 'Shirts'], ['pants', '👖', 'Pants'], ['shorts', '🩳', 'Shorts'], ['dresses', '👗', 'Dresses'],
      ['pajamas', 'd:pajamas', 'Pajamas'], ['socks', '🧦', 'Socks'], ['underwear', '🩲', 'Underwear'], ['jackets', '🧥', 'Jackets'],
      ['shoes', '👟', 'Shoes'], ['hats', '🧢', 'Hats'], ['belts', 'd:belt', 'Belts'],
    ] },
    { key: 'play', icon: '🧸', label: 'Play', items: [
      ['toys', '🪀', 'Toys'], ['stuffies', '🧸', 'Stuffed animals'], ['games', '🧩', 'Games and puzzles'], ['books', '📚', 'Books'],
      ['art', '🎨', 'Art supplies'], ['music', '🎸', 'Music'], ['electronics', '🎮', 'Electronics'],
    ] },
    { key: 'everyday', icon: '🎒', label: 'Everyday', items: [
      ['papers', '📄', 'School papers'], ['backpacks', '🎒', 'Backpacks'], ['aprons', 'd:apron', 'Aprons'], ['keys', '🔑', 'Keys'],
      ['purse', '👜', 'Purse'], ['phone', '📱', 'Phone'], ['tablet', 'd:tablet', 'Tablet'], ['charger', '🔌', 'Charger'],
      ['medicine', '💊', 'Medicine'], ['lotion', '🧴', 'Lotion'], ['creams', '🫙', 'Creams'], ['makeup', '💄', 'Make-up'],
      ['hair', '🎀', 'Hair things'], ['candle', '🕯️', 'Candle'],
    ] },
    { key: 'other', icon: '🛏️', label: 'Other', items: [
      ['blankets', 'd:blanket', 'Blankets'], ['mix', '❓', 'A mix of things'],
    ] },
  ];

  const ALL = {};
  GROUPS.forEach(g => g.items.forEach(([key, pic, label]) => { ALL[key] = { key, pic, label }; }));

  // A picture as a whole <svg> (for buttons). custom: the person's own photo items.
  function icon(key, custom = []) {
    const own = custom.find(c => c.key === key);
    if (own) return `<svg viewBox="0 0 60 60"><clipPath id="c-${key}"><rect width="60" height="60" rx="12"/></clipPath><image href="${own.photo}" width="60" height="60" preserveAspectRatio="xMidYMid slice" clip-path="url(#c-${key})"/></svg>`;
    const it = ALL[key];
    if (!it) return '';
    if (typeof ItemArt !== 'undefined' && ItemArt.has(key)) return ItemArt.svg(key);
    if (it.pic.startsWith('d:')) return `<svg viewBox="0 0 60 60">${DRAWN[it.pic.slice(2)]}</svg>`;
    return `<svg viewBox="0 0 60 60"><text x="30" y="33" font-size="44" text-anchor="middle" dominant-baseline="central">${it.pic}</text></svg>`;
  }

  // The same picture placed inside another drawing, at (x, y), s wide.
  function place(key, x, y, s, custom = []) {
    const own = custom.find(c => c.key === key);
    if (own) return `<image href="${own.photo}" x="${x}" y="${y}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid slice"/>`;
    const it = ALL[key];
    if (!it) return '';
    if (typeof ItemArt !== 'undefined' && ItemArt.has(key)) return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 60 60">${ItemArt.inner(key)}</svg>`;
    if (it.pic.startsWith('d:')) return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 60 60">${DRAWN[it.pic.slice(2)]}</svg>`;
    return `<text x="${x + s / 2}" y="${y + s / 2 + 1}" font-size="${s * 0.8}" text-anchor="middle" dominant-baseline="central">${it.pic}</text>`;
  }

  const label = (key, custom = []) => (ALL[key] ? ALL[key].label : (custom.find(c => c.key === key) ? 'My photo' : ''));

  return { GROUPS, ALL, icon, place, label };
})();
