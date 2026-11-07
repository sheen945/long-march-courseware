const GLOBAL_KEY = "longMarch_progress_v2";

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function chapterStorageKey(chapterId) {
  return `longMarch_chapter_${chapterId}_v2`;
}

export function hasChapterProgress(chapterId) {
  try {
    const value = JSON.parse(localStorage.getItem(chapterStorageKey(chapterId)));
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    return Boolean(
      typeof value.currentScene === "string"
      || value.chapterCompleted === true
      || value.introPlayed === true
      || value.outroPlayed === true
      || (Array.isArray(value.completedHotspots) && value.completedHotspots.length)
      || (Array.isArray(value.unlockedArchives) && value.unlockedArchives.length)
      || (Array.isArray(value.rewards) && value.rewards.length)
    );
  } catch {
    return false;
  }
}

export function resetChapterProgress(chapterId) {
  localStorage.removeItem(chapterStorageKey(chapterId));
}

export class StateStore {
  constructor(chapterId) {
    this.chapterId = chapterId;
    this.key = chapterStorageKey(chapterId);
    this.state = this.load();
  }

  defaults() {
    return {
      currentScene: null,
      completedHotspots: [],
      unlockedArchives: [],
      rewards: [],
      choices: {},
      chapterCompleted: false,
      introPlayed: false,
      outroPlayed: false
    };
  }

  load() {
    try {
      const value = JSON.parse(localStorage.getItem(this.key));
      return this.sanitize(value);
    } catch {
      return this.defaults();
    }
  }

  sanitize(value) {
    const base = this.defaults();
    if (!value || typeof value !== "object" || Array.isArray(value)) return base;
    return {
      ...base,
      currentScene: typeof value.currentScene === "string" ? value.currentScene : null,
      completedHotspots: unique(Array.isArray(value.completedHotspots) ? value.completedHotspots : []),
      unlockedArchives: unique(Array.isArray(value.unlockedArchives) ? value.unlockedArchives : []),
      rewards: unique(Array.isArray(value.rewards) ? value.rewards : []),
      choices: value.choices && typeof value.choices === "object" ? { ...value.choices } : {},
      chapterCompleted: value.chapterCompleted === true,
      introPlayed: value.introPlayed === true,
      outroPlayed: value.outroPlayed === true
    };
  }

  save() {
    localStorage.setItem(this.key, JSON.stringify(this.state));
    this.saveGlobal();
  }

  patch(patch) {
    this.state = this.sanitize({ ...this.state, ...patch });
    this.save();
    return this.snapshot();
  }

  completeHotspot(id) {
    return this.patch({ completedHotspots: [...this.state.completedHotspots, id] });
  }

  unlockArchives(ids = []) {
    return this.patch({ unlockedArchives: [...this.state.unlockedArchives, ...ids] });
  }

  addRewards(items = []) {
    return this.patch({ rewards: [...this.state.rewards, ...items] });
  }

  recordChoice(id, value) {
    return this.patch({ choices: { ...this.state.choices, [id]: value } });
  }

  saveGlobal() {
    let global = {};
    try { global = JSON.parse(localStorage.getItem(GLOBAL_KEY)) || {}; } catch { /* use empty state */ }
    const completedChapters = Array.isArray(global.completedChapters) ? global.completedChapters : [];
    if (this.state.chapterCompleted) completedChapters.push(this.chapterId);
    global.completedChapters = unique(completedChapters);
    global.lastChapter = this.chapterId;
    localStorage.setItem(GLOBAL_KEY, JSON.stringify(global));
  }

  reset() {
    resetChapterProgress(this.chapterId);
    this.state = this.defaults();
    return this.snapshot();
  }

  snapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }
}
