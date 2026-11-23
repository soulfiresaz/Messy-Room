// Saves everything on this device. No accounts, no internet needed.
const Store = (() => {
  const KEY = 'messyroom.v1';

  const defaults = () => ({
    version: 1,
    stickers: [],   // kids' own stickers (person, alien, animal)
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

  load();

  return {
    get data() { return data; },
    save,
    uid,
    addCleanup,
  };
})();
