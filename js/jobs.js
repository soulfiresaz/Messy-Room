// Deep-clean jobs, suggested from what's in the room.
// A job: { id, key, tool, label, freq, pieceId | itemId, owners }
// Its settings (on/off, how often, who) live in room.jobs[id], set by a parent.
const Jobs = (() => {
  const INK = '#3a2a2a';
  const L = (w = 2.6) => `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

  // Tools, on a 60 x 60 grid
  const TOOLS = {
    vacuum: `<rect x="34" y="4" width="6" height="34" rx="3" fill="#9aa7b8" ${L()}/><rect x="30" y="2" width="14" height="7" rx="3" fill="#4a4a5a" ${L(2)}/><path d="M8 44 Q8 34 22 34 L40 34 Q52 34 52 44 L52 48 L8 48 Z" fill="#b9a2ff" ${L()}/><circle cx="16" cy="51" r="5" fill="#4a4a5a" ${L(2)}/><circle cx="44" cy="51" r="5" fill="#4a4a5a" ${L(2)}/>`,
    rag: `<path d="M8 22 Q18 14 30 20 Q42 26 52 18 L54 42 Q42 50 30 44 Q18 38 8 46 Z" fill="#ffd54a" ${L()}/><path d="M14 30 Q22 26 30 30 M30 34 Q40 38 48 32" fill="none" stroke="#e0b030" stroke-width="2.4" stroke-linecap="round"/>`,
    spray: `<rect x="16" y="26" width="24" height="30" rx="6" fill="#7fd8c0" ${L()}/><rect x="22" y="18" width="12" height="9" fill="#fff" ${L(2)}/><path d="M18 18 L18 10 L42 10 L46 16 L34 16 L34 18 Z" fill="#4f8fe0" ${L(2)}/><path d="M50 8 l6 -3 M50 13 l7 0 M50 18 l6 3" ${L(2)}/><path d="M18 34 H38" stroke="#fff" stroke-width="3"/>`,
    trashbag: `<path d="M16 18 Q10 30 12 46 Q14 56 30 56 Q46 56 48 46 Q50 30 44 18 Z" fill="#4a4a5a" ${L()}/><path d="M22 18 L26 8 L30 14 L34 8 L38 18" fill="#4a4a5a" ${L()}/><path d="M20 30 Q30 34 40 28" fill="none" stroke="#8a8a9a" stroke-width="2"/>`,
    hands: `<path d="M18 50 L14 26 Q14 22 18 22 Q21 22 21 26 L22 34 L21 14 Q21 10 25 10 Q28 10 28 14 L29 30 L29 10 Q29 6 33 6 Q36 6 36 10 L36 30 L37 14 Q37 10 40 10 Q44 10 44 14 L43 36 Q48 30 52 32 Q54 34 50 40 L42 52 Q38 56 30 56 L24 56 Q20 56 18 50 Z" fill="#f6c9a0" ${L()}/>`,
  };

  const toolSvg = key => `<svg viewBox="0 0 60 60">${TOOLS[key] || ''}</svg>`;

  // How often, by default
  const FREQ = { tidy: 'daily', makebed: 'daily', laundry: 'daily', vacuum: 'weekly', dust: 'weekly', bedframe: 'weekly', switch: 'weekly', doorknob: 'weekly', trash: 'weekly', recycle: 'weekly' };

  const DUSTY = ['dresser', 'table', 'cubby', 'bookshelf', 'wire', 'wallshelf', 'tower'];

  // Every job this room suggests.
  function suggest(room) {
    const out = [];
    const pieces = room.pieces || [];
    const add = (key, tool, extra) => out.push({ key, tool, freq: FREQ[key], ...extra });
    add('tidy', 'hands', { id: 'tidy' });
    add('vacuum', 'vacuum', { id: 'vacuum' });
    if (pieces.some(p => p.kind === 'container' && /^hamper/.test(p.sub))) add('laundry', 'hands', { id: 'laundry' });
    pieces.forEach(p => {
      if (p.kind === 'bed') {
        add('makebed', 'hands', { id: `makebed:${p.id}`, pieceId: p.id });
        add('bedframe', 'rag', { id: `bedframe:${p.id}`, pieceId: p.id });
      }
      if (DUSTY.includes(p.kind) && !p.insideId) add('dust', 'rag', { id: `dust:${p.id}`, pieceId: p.id });
      if (p.kind === 'container' && /^trash/.test(p.sub)) add('trash', 'trashbag', { id: `trash:${p.id}`, pieceId: p.id });
      if (p.kind === 'container' && p.sub === 'recycle') add('recycle', 'trashbag', { id: `recycle:${p.id}`, pieceId: p.id });
    });
    (room.wallItems || []).forEach(it => {
      if (it.type === 'switch') add('switch', 'spray', { id: `switch:${it.id}`, itemId: it.id });
      if (it.type === 'door') add('doorknob', 'spray', { id: `doorknob:${it.id}`, itemId: it.id });
    });
    return out;
  }

  // A picture of what the job is for (the floor, the bed, the switch...).
  const PLACE = {
    tidy: '🧸', vacuum: `<svg viewBox="0 0 60 60"><rect x="6" y="14" width="48" height="36" rx="4" fill="#f3dfbf" ${L()}/><path d="M6 26 H54 M6 38 H54" stroke="#e0c08a" stroke-width="2"/></svg>`,
    laundry: '🧺',
  };

  const LABEL = {
    tidy: 'Tidy the floor', vacuum: 'Vacuum the floor', laundry: 'Dirty clothes to the laundry', makebed: 'Make the bed',
    bedframe: 'Wipe the bed frame', dust: 'Dust it', switch: 'Disinfect the light switch', doorknob: 'Disinfect the doorknob',
    trash: 'Empty the trash', recycle: 'Take out the recycling',
  };

  const today = () => new Date().toISOString().slice(0, 10);

  // Is a job due? Daily: not done today. Weekly: not done in the last 7 days.
  function isDue(freq, lastDone) {
    if (freq === 'off') return false;
    if (!lastDone) return true;
    if (freq === 'daily') return lastDone.slice(0, 10) !== today();
    return (Date.now() - new Date(lastDone).getTime()) > 6.5 * 24 * 3600 * 1000;
  }

  return { TOOLS, toolSvg, suggest, PLACE, LABEL, isDue, today };
})();
