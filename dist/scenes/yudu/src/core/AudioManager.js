const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const DEFAULT_FADE_MS = 900;

export class AudioManager {
  constructor() {
    this.music = null;
    this.ambience = null;
    this.effects = new Map();
    this.video = null;
    this.cue = null;
    this.context = null;
    this.ducking = false;
    this.duckFactor = .75;
    this.musicScale = 1;
    this.fadeTokens = new WeakMap();
  }

  async playScene(config = {}, videoElement = null) {
    const normalized = this.normalizeSceneConfig(config);
    const fadeMs = normalized.fadeMs;
    this.duckFactor = normalized.duckFactor;

    await Promise.all([
      this.transitionLoopTrack("music", normalized.music, fadeMs),
      this.transitionLoopTrack("ambience", normalized.ambience, fadeMs),
      this.transitionEffects(normalized.effects, fadeMs)
    ]);
    this.attachVideo(videoElement, normalized.video, fadeMs);
  }

  normalizeSceneConfig(config) {
    const legacyMusic = config?.source ? config : null;
    return {
      fadeMs: clamp(config?.fadeMs ?? DEFAULT_FADE_MS, 0, 4000),
      duckFactor: clamp(config?.duckFactor ?? .75, 0, 1),
      music: legacyMusic || config?.music || null,
      ambience: config?.ambience || null,
      effects: Array.isArray(config?.effects) ? config.effects : [],
      video: config?.video || null
    };
  }

  async transitionLoopTrack(name, config, fadeMs) {
    const current = this[name];
    if (!config?.source) {
      if (current) {
        this[name] = null;
        await this.fadeAndDispose(current, fadeMs);
      }
      return;
    }

    const volume = clamp(config.volume ?? .2, 0, 1);
    if (current?.source === config.source) {
      current.baseVolume = volume;
      current.element.loop = config.loop !== false;
      current.element.dataset.baseVolume = volume.toFixed(3);
      await this.fadeElement(current.element, this.trackTargetVolume(name, current), fadeMs);
      return;
    }

    const audio = new Audio(config.source);
    audio.loop = config.loop !== false;
    audio.preload = "auto";
    audio.playsInline = true;
    audio.volume = 0;
    audio.hidden = true;
    audio.dataset.audioTrack = name;
    audio.dataset.baseVolume = volume.toFixed(3);
    document.body.appendChild(audio);
    const next = { element: audio, source: config.source, baseVolume: volume };
    this[name] = next;
    try { await audio.play(); } catch { /* resumes after the next user gesture */ }

    const fades = [this.fadeElement(audio, this.trackTargetVolume(name, next), fadeMs)];
    if (current) fades.push(this.fadeAndDispose(current, fadeMs));
    await Promise.all(fades);
  }

  async transitionEffects(configs, fadeMs) {
    const wanted = new Map();
    for (const config of configs || []) {
      if (!config?.source) continue;
      wanted.set(config.id || config.source, config);
    }

    const fades = [];
    for (const [id, track] of this.effects) {
      if (wanted.has(id)) continue;
      this.effects.delete(id);
      fades.push(this.fadeAndDispose(track, track.fadeOutMs ?? fadeMs));
    }

    for (const [id, config] of wanted) {
      const volume = clamp(config.volume ?? .3, 0, 1);
      const dialogueVolume = config.dialogueVolume == null
        ? null
        : clamp(config.dialogueVolume, 0, volume);
      const current = this.effects.get(id);
      if (current?.source === config.source) {
        current.baseVolume = volume;
        current.dialogueVolume = dialogueVolume;
        current.fadeOutMs = config.fadeOutMs;
        current.element.loop = config.loop !== false;
        current.element.dataset.baseVolume = volume.toFixed(3);
        if (dialogueVolume != null) current.element.dataset.dialogueVolume = dialogueVolume.toFixed(3);
        else delete current.element.dataset.dialogueVolume;
        fades.push(this.fadeElement(
          current.element,
          this.effectTargetVolume(current),
          config.fadeInMs ?? fadeMs
        ));
        continue;
      }

      const audio = new Audio(config.source);
      audio.loop = config.loop !== false;
      audio.preload = "auto";
      audio.playsInline = true;
      audio.volume = 0;
      audio.hidden = true;
      audio.dataset.audioTrack = `effect:${id}`;
      audio.dataset.baseVolume = volume.toFixed(3);
      if (dialogueVolume != null) audio.dataset.dialogueVolume = dialogueVolume.toFixed(3);
      document.body.appendChild(audio);
      const next = {
        element: audio,
        source: config.source,
        baseVolume: volume,
        dialogueVolume,
        fadeOutMs: config.fadeOutMs
      };
      this.effects.set(id, next);
      try { await audio.play(); } catch { /* resumes after the next user gesture */ }
      fades.push(this.fadeElement(audio, this.effectTargetVolume(next), config.fadeInMs ?? fadeMs));
      if (current) fades.push(this.fadeAndDispose(current, current.fadeOutMs ?? fadeMs));
    }

    await Promise.all(fades);
  }

  trackTargetVolume(name, track) {
    if (name !== "music") return track.baseVolume;
    const duckScale = this.ducking ? this.duckFactor : 1;
    return track.baseVolume * duckScale * this.musicScale;
  }

  effectTargetVolume(track) {
    if (this.ducking && track.dialogueVolume != null) return track.dialogueVolume;
    return track.baseVolume;
  }

  setMusicScale(scale, duration = 500) {
    this.musicScale = clamp(scale ?? 1, 0, 1.25);
    if (!this.music) return Promise.resolve();
    return this.fadeElement(this.music.element, this.trackTargetVolume("music", this.music), duration);
  }

  playMusic(config, fadeMs = DEFAULT_FADE_MS) {
    return this.transitionLoopTrack("music", config, fadeMs);
  }

  async prepareMusic(config) {
    if (!config?.source) return null;
    const volume = clamp(config.volume ?? .2, 0, 1);
    const audio = new Audio(config.source);
    audio.loop = config.loop !== false;
    audio.preload = "auto";
    audio.playsInline = true;
    audio.volume = 0;
    audio.hidden = true;
    audio.dataset.audioTrack = "prepared-music";
    audio.dataset.baseVolume = volume.toFixed(3);
    document.body.appendChild(audio);

    await new Promise(resolve => {
      if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
        resolve();
        return;
      }
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        audio.removeEventListener("canplay", finish);
        audio.removeEventListener("error", finish);
        resolve();
      };
      const timeout = setTimeout(finish, 5000);
      audio.addEventListener("canplay", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      audio.load();
    });

    return { element: audio, source: config.source, baseVolume: volume, prepared: true };
  }

  startPreparedMusic(track, fadeMs = 0) {
    if (!track?.element) return Promise.resolve();
    const current = this.music;
    const audio = track.element;
    track.prepared = false;
    this.music = track;
    audio.dataset.audioTrack = "music";
    audio.currentTime = 0;
    audio.volume = fadeMs > 0 ? 0 : this.trackTargetVolume("music", track);
    audio.dataset.currentVolume = audio.volume.toFixed(3);
    const playback = audio.play().catch(() => {});
    const tasks = [playback];
    if (fadeMs > 0) tasks.push(this.fadeElement(audio, this.trackTargetVolume("music", track), fadeMs));
    if (current && current !== track) tasks.push(this.fadeAndDispose(current, fadeMs));
    return Promise.all(tasks);
  }

  discardPreparedMusic(track) {
    if (!track?.element || this.music === track) return;
    track.element.pause();
    track.element.removeAttribute("src");
    track.element.load?.();
    track.element.remove();
  }

  async stopAll(fadeMs = 500) {
    this.ducking = false;
    this.musicScale = 1;
    const music = this.music;
    const ambience = this.ambience;
    const effects = [...this.effects.values()];
    const cue = this.cue;
    this.music = null;
    this.ambience = null;
    this.effects.clear();
    this.cue = null;

    const fades = [this.releaseVideo(fadeMs)];
    if (music) fades.push(this.fadeAndDispose(music, fadeMs));
    if (ambience) fades.push(this.fadeAndDispose(ambience, fadeMs));
    for (const effect of effects) fades.push(this.fadeAndDispose(effect, fadeMs));
    if (cue?.element) {
      fades.push(this.fadeElement(cue.element, 0, Math.min(fadeMs, 260)).then(() => {
        cue.element.pause();
        cue.element.removeAttribute("src");
        cue.element.remove();
      }));
    }
    await Promise.all(fades);
  }

  attachVideo(videoElement, config, fadeMs) {
    this.video = null;
    if (!videoElement || !config?.enabled) {
      if (videoElement) {
        videoElement.volume = 0;
        videoElement.muted = true;
        videoElement.defaultMuted = true;
      }
      return;
    }

    const baseVolume = clamp(config.volume ?? .35, 0, 1);
    videoElement.volume = 0;
    videoElement.dataset.audioTrack = "video";
    videoElement.dataset.baseVolume = baseVolume.toFixed(3);
    const canUnmute = navigator.userActivation?.hasBeenActive === true;
    videoElement.muted = !canUnmute;
    videoElement.defaultMuted = !canUnmute;
    this.video = { element: videoElement, baseVolume, enabled: true };
    videoElement.play().catch(() => {});
    this.fadeElement(videoElement, baseVolume, fadeMs);
  }

  async releaseVideo(duration = 280) {
    const current = this.video;
    this.video = null;
    if (!current?.element) return;
    await this.fadeElement(current.element, 0, duration);
    current.element.muted = true;
    current.element.defaultMuted = true;
  }

  async releaseEnvironment(duration = 280) {
    const ambience = this.ambience;
    const effects = [...this.effects.values()];
    this.ambience = null;
    this.effects.clear();
    const fades = [];
    if (ambience) fades.push(this.fadeAndDispose(ambience, duration));
    for (const effect of effects) fades.push(this.fadeAndDispose(effect, effect.fadeOutMs ?? duration));
    await Promise.all(fades);
  }

  resume() {
    for (const track of [this.music, this.ambience, this.cue, ...this.effects.values()]) {
      track?.element?.play().catch(() => {});
    }
    if (this.video?.element) {
      this.video.element.muted = false;
      this.video.element.defaultMuted = false;
      this.video.element.play().catch(() => {});
    }
    if (this.context?.state === "suspended") this.context.resume().catch(() => {});
  }

  duck(active) {
    this.ducking = active;
    if (this.music) {
      this.fadeElement(this.music.element, this.trackTargetVolume("music", this.music), 220);
    }
    for (const effect of this.effects.values()) {
      if (effect.dialogueVolume == null) continue;
      this.fadeElement(effect.element, this.effectTargetVolume(effect), 360);
    }
  }

  async playCue(cue) {
    if (!cue) return;
    if (this.cue?.element) {
      this.cue.element.pause();
      this.cue.element.removeAttribute("src");
      this.cue.element.remove();
    }
    this.cue = null;

    if (cue.source) {
      try {
        const response = await fetch(cue.source, { method: "HEAD", cache: "no-store" });
        if (response.ok) {
          const audio = new Audio(cue.source);
          audio.preload = "auto";
          audio.volume = clamp(cue.volume ?? .75, 0, 1);
          audio.hidden = true;
          audio.dataset.audioTrack = "cue";
          audio.dataset.baseVolume = audio.volume.toFixed(3);
          audio.dataset.targetVolume = audio.volume.toFixed(3);
          audio.dataset.currentVolume = audio.volume.toFixed(3);
          document.body.appendChild(audio);
          const track = { element: audio, source: cue.source };
          this.cue = track;
          audio.addEventListener("ended", () => {
            audio.remove();
            if (this.cue === track) this.cue = null;
          }, { once: true });
          await audio.play();
          return;
        }
      } catch { /* use the existing demo fallback when a cue is absent */ }
    }
    if (cue.id === "aircraft") {
      this.playAircraftFallback();
    }
  }

  fadeElement(element, targetVolume, duration = DEFAULT_FADE_MS) {
    if (!element) return Promise.resolve();
    const target = clamp(targetVolume, 0, 1);
    const start = clamp(element.volume || 0, 0, 1);
    element.dataset.targetVolume = target.toFixed(3);
    if (duration <= 0 || Math.abs(start - target) < .002) {
      element.volume = target;
      element.dataset.currentVolume = target.toFixed(3);
      return Promise.resolve();
    }

    const token = Symbol("audio-fade");
    this.fadeTokens.set(element, token);
    const startedAt = performance.now();
    return new Promise(resolve => {
      const tick = now => {
        if (this.fadeTokens.get(element) !== token) {
          resolve();
          return;
        }
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = progress * progress * (3 - 2 * progress);
        element.volume = clamp(start + (target - start) * eased, 0, 1);
        element.dataset.currentVolume = element.volume.toFixed(3);
        if (progress < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  async fadeAndDispose(track, duration) {
    await this.fadeElement(track.element, 0, duration);
    track.element.pause();
    track.element.removeAttribute("src");
    track.element.load?.();
    track.element.remove();
  }

  playAircraftFallback() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.context ||= new AudioContext();
    const now = this.context.currentTime;
    const master = this.context.createGain();
    master.gain.setValueAtTime(.0001, now);
    master.gain.exponentialRampToValueAtTime(.24, now + .18);
    master.gain.exponentialRampToValueAtTime(.0001, now + 3.2);
    master.connect(this.context.destination);

    for (const frequency of [46, 58, 73]) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.linearRampToValueAtTime(frequency * 1.18, now + 3.1);
      gain.gain.value = .16;
      oscillator.connect(gain).connect(master);
      oscillator.start(now);
      oscillator.stop(now + 3.25);
    }
  }
}
