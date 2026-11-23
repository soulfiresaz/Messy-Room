// Saves everything on this device. No accounts, no internet needed.
const Store = (() => {
  const KEY = 'messyroom.v1';

  const defaults = () => ({
    version: 2,
    people: [],     // everyone who uses the app: { id, name, stickerId }
    stickers: [],   // shared sticker collection (person, alien, animal)
    rewards: [],    // rewards parents promised
    cleanups: 0,    // finished cleanups, counted automatically
    pin: null,      // parent PIN
  });

  let data;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? { ...defaults(), ...JSON.parse(raw) } : defaults();
    } catch (e) {
      data = defaults();
    }
    upgrade();
  }

  // Version 1 kept each person as a sticker with a name.
  // Version 2 keeps people separate, each using one sticker from a shared collection.
  function upgrade() {
    if (!data.version || data.version < 2) {
      data.people = data.stickers.map(s => ({ id: s.id, name: s.name || '', stickerId: s.id }));
      data.stickers.forEach(s => { delete s.name; });
      data.version = 2;
      save();
    }
  }

  // Returns false if the device is out of space or storage is blocked.
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // Called when a child finishes putting a room away or a deep clean.
  function addCleanup() {
    data.cleanups += 1;
    save();
  }

  // Replace everything with a backup. Returns false if it didn't fit on the device.
  function restore(saved) {
    const before = data;
    data = { ...defaults(), ...saved };
    upgrade();
    if (!save()) { data = before; save(); return false; }
    return true;
  }

  load();

  return {
    get data() { return data; },
    save,
    restore,
    uid,
    addCleanup,
  };
})();
