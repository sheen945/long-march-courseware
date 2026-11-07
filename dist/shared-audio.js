(function () {
  "use strict";

  const STORAGE_KEY = "long-march-master-volume-v2";
  const UNLOCK_KEY = "long-march-audio-unlocked-v1";
  const DEFAULT_VOLUME = 0.72;
  const BACKGROUND_VOLUME = 0.28;
  const VIDEO_DUCK_SCALE = 0.42;
  const OUTPUT_BOOST = 1.25;
  const script = document.currentScript;
  const pageManagesBackground = script?.dataset.pageBgm === "true";
  const nativeVolume = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume");
  const requestedVolumes = new WeakMap();
  const trackedMedia = new Set();
  const managedContexts = new Set();
  let backgroundAudio = null;
  let duckScale = 1;
  let previousAudibleVolume = DEFAULT_VOLUME;
  let masterVolume = readStoredVolume();
  let audioUnlocked = sessionStorage.getItem(UNLOCK_KEY) === "true";
  let embeddedSceneActive = false;
  let ui = null;

  function clamp(value, minimum = 0, maximum = 1) {
    return Math.max(minimum, Math.min(maximum, Number(value) || 0));
  }

  function readStoredVolume() {
    const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(stored) ? clamp(stored) : DEFAULT_VOLUME;
  }

  function effectiveVolume(media, requested) {
    const backgroundScale = media === backgroundAudio ? duckScale : 1;
    return clamp(requested * masterVolume * OUTPUT_BOOST * backgroundScale);
  }

  function applyMediaVolume(media) {
    if (!media || !nativeVolume?.set) return;
    if (!requestedVolumes.has(media)) requestedVolumes.set(media, clamp(nativeVolume.get.call(media)));
    nativeVolume.set.call(media, effectiveVolume(media, requestedVolumes.get(media)));
  }

  function identifyBackground(media) {
    if (media?.dataset?.longMarchBgm !== "true") return;
    backgroundAudio = media;
    media.dataset.audioTrack = media.dataset.audioTrack || "background-music";
  }

  function trackMedia(media) {
    if (!media || trackedMedia.has(media)) return media;
    trackedMedia.add(media);
    if (!requestedVolumes.has(media)) requestedVolumes.set(media, clamp(nativeVolume.get.call(media)));
    identifyBackground(media);
    applyMediaVolume(media);
    return media;
  }

  if (nativeVolume?.get && nativeVolume?.set && nativeVolume.configurable) {
    Object.defineProperty(HTMLMediaElement.prototype, "volume", {
      configurable: true,
      enumerable: nativeVolume.enumerable,
      get() {
        if (!requestedVolumes.has(this)) requestedVolumes.set(this, clamp(nativeVolume.get.call(this)));
        return requestedVolumes.get(this);
      },
      set(value) {
        requestedVolumes.set(this, clamp(value));
        trackedMedia.add(this);
        identifyBackground(this);
        nativeVolume.set.call(this, effectiveVolume(this, requestedVolumes.get(this)));
      }
    });
  }

  const NativeAudio = window.Audio;
  if (NativeAudio) {
    function LongMarchAudioElement(source) {
      return trackMedia(new NativeAudio(source));
    }
    LongMarchAudioElement.prototype = NativeAudio.prototype;
    Object.setPrototypeOf(LongMarchAudioElement, NativeAudio);
    window.Audio = LongMarchAudioElement;
  }

  const nativeCreateElement = Document.prototype.createElement;
  Document.prototype.createElement = function (name, options) {
    const element = nativeCreateElement.call(this, name, options);
    const mediaName = String(name).toLowerCase();
    if (mediaName === "video") element.crossOrigin = "anonymous";
    if (mediaName === "audio" || mediaName === "video") trackMedia(element);
    return element;
  };

  function installManagedAudioContext(key) {
    const NativeContext = window[key];
    if (!NativeContext || NativeContext.__longMarchManaged) return;
    class LongMarchAudioContext extends NativeContext {
      constructor(...args) {
        super(...args);
        const nativeDestination = this.destination;
        const masterGain = this.createGain();
        masterGain.gain.value = masterVolume * OUTPUT_BOOST;
        masterGain.connect(nativeDestination);
        Object.defineProperty(this, "destination", { configurable: true, get: () => masterGain });
        managedContexts.add({ context: this, gain: masterGain });
      }
    }
    LongMarchAudioContext.__longMarchManaged = true;
    window[key] = LongMarchAudioContext;
  }

  installManagedAudioContext("AudioContext");
  installManagedAudioContext("webkitAudioContext");

  function backgroundConfig() {
    const path = location.pathname.replace(/\\/g, "/").toLowerCase();
    const scene = path.match(/\/scenes\/([^/]+)/)?.[1] || "";
    const tracks = {
      chishui: ["../../audio/chapter5-chishui.mp3", "第五章 · 四渡赤水"],
      jinshajiang: ["../../audio/chapter6-jinshajiang.mp3", "第六章 · 巧渡金沙江"],
      snowgrass: ["../../audio/chapter8-snowgrass.mp3", "第八章 · 雪山草地"],
      final: ["../../audio/chapter9-wuqizhen.mp3", "第九章 · 会宁会师"]
    };
    if (tracks[scene]) return tracks[scene];
    if (!scene) return ["./audio/map-background.mp3", "长征地图"];
    return null;
  }

  function createBackgroundAudio() {
    if (pageManagesBackground || backgroundAudio) return;
    const config = backgroundConfig();
    if (!config) return;
    const audio = new Audio(config[0]);
    audio.loop = true;
    audio.preload = "auto";
    audio.playsInline = true;
    audio.hidden = true;
    audio.dataset.longMarchBgm = "true";
    audio.dataset.trackTitle = config[1];
    audio.setAttribute("aria-hidden", "true");
    audio.volume = BACKGROUND_VOLUME;
    document.body.appendChild(audio);
    backgroundAudio = audio;
    if (!/\/scenes\//.test(location.pathname)) window.LongMarchResources?.recoverAudio(audio, unlockBackground);
  }

  function hasAudibleVideo() {
    return Array.from(document.querySelectorAll("video")).some(video => {
      const requested = requestedVolumes.get(video) ?? 1;
      return !video.paused && !video.ended && !video.muted && requested > 0;
    });
  }

  function refreshBackgroundDuck() {
    const nextScale = hasAudibleVideo() ? VIDEO_DUCK_SCALE : 1;
    if (duckScale === nextScale) return;
    duckScale = nextScale;
    if (backgroundAudio) applyMediaVolume(backgroundAudio);
  }

  function updateUi() {
    if (!ui) return;
    const percentage = Math.round(masterVolume * 100);
    const muted = percentage === 0;
    ui.root.style.setProperty("--lm-volume-fill", percentage + "%");
    ui.slider.value = String(percentage);
    ui.value.textContent = percentage + "%";
    ui.toggle.setAttribute("aria-label", muted ? "恢复总音量" : "静音全部声音");
    ui.toggle.setAttribute("aria-pressed", String(muted));
    ui.icon.innerHTML = muted
      ? '<path d="M3 6.5h3L10 3v12l-4-3.5H3zM13 6l5 5m0-5-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
      : '<path d="M3 6.5h3L10 3v12l-4-3.5H3zM13 6.2c1.3 1.1 1.3 4.5 0 5.6m2-7.7c2.7 2.2 2.7 7.6 0 9.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  function setMasterVolume(value, { persist = true } = {}) {
    const next = clamp(value);
    if (next > 0) previousAudibleVolume = next;
    masterVolume = next;
    if (persist) localStorage.setItem(STORAGE_KEY, String(masterVolume));
    trackedMedia.forEach(applyMediaVolume);
    managedContexts.forEach(({ context, gain }) => {
      const now = context.currentTime || 0;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setTargetAtTime(masterVolume * OUTPUT_BOOST, now, 0.025);
    });
    updateUi();
    window.dispatchEvent(new CustomEvent("longmarchvolumechange", {
      detail: { volume: masterVolume, muted: masterVolume === 0 }
    }));
    if (masterVolume > 0) unlockBackground();
    return masterVolume;
  }

  function toggleMute() {
    return setMasterVolume(masterVolume > 0 ? 0 : Math.max(previousAudibleVolume, 0.18)) === 0;
  }

  async function unlockBackground() {
    audioUnlocked = true;
    sessionStorage.setItem(UNLOCK_KEY, "true");
    managedContexts.forEach(({ context }) => {
      if (context.state === "suspended") context.resume().catch(() => {});
    });
    if (embeddedSceneActive || !backgroundAudio || masterVolume === 0 || !backgroundAudio.paused) return;
    try {
      await backgroundAudio.play();
    } catch {
      // Browser autoplay policy: the next pointer/key gesture retries playback.
    }
  }

  function createUi() {
    const root = document.createElement("div");
    root.className = "long-march-volume";
    root.setAttribute("role", "group");
    root.setAttribute("aria-label", "全局声音控制");
    root.innerHTML = [
      '<button class="long-march-volume__toggle" type="button" aria-label="静音全部声音">',
      '<svg class="long-march-volume__icon" viewBox="0 0 21 18" aria-hidden="true"></svg>',
      "</button>",
      '<span class="long-march-volume__label">总音量</span>',
      '<input class="long-march-volume__slider" type="range" min="0" max="100" step="1" aria-label="同时调整背景音乐、音效和视频声音">',
      '<output class="long-march-volume__value" aria-live="polite"></output>'
    ].join("");
    document.body.appendChild(root);
    ui = {
      root,
      toggle: root.querySelector(".long-march-volume__toggle"),
      icon: root.querySelector(".long-march-volume__icon"),
      slider: root.querySelector(".long-march-volume__slider"),
      value: root.querySelector(".long-march-volume__value")
    };
    ui.toggle.addEventListener("click", toggleMute);
    ui.slider.addEventListener("input", event => setMasterVolume(Number(event.target.value) / 100));
    updateUi();
    requestAnimationFrame(avoidInteractiveOverlap);
    window.setTimeout(avoidInteractiveOverlap, 900);
  }

  function setEmbeddedSceneActive(active) {
    const next = Boolean(active);
    const changed = embeddedSceneActive !== next;
    embeddedSceneActive = next;
    ui?.root.classList.toggle("long-march-volume--suspended", next);
    if (!changed) return;
    if (next) {
      backgroundAudio?.pause();
      managedContexts.forEach(({ context }) => {
        if (context.state === "running") context.suspend().catch(() => {});
      });
      return;
    }
    if (audioUnlocked && masterVolume > 0) unlockBackground();
  }

  function syncEmbeddedSceneState() {
    const frame = document.querySelector(".scene-overlay iframe, iframe.scene-frame");
    setEmbeddedSceneActive(Boolean(frame));
  }

  function notifyParentSceneState(active) {
    if (window.parent === window) return;
    window.parent.postMessage({ type: "longMarch:sceneAudioState", active: Boolean(active) }, location.origin);
  }

  function avoidInteractiveOverlap() {
    if (!ui) return;
    ui.root.style.removeProperty("top");
    if (!matchMedia("(max-width: 520px)").matches) return;
    let barRect = ui.root.getBoundingClientRect();
    for (let pass = 0; pass < 5; pass += 1) {
      const blockers = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"]'))
        .filter(element => {
          if (ui.root.contains(element) || !element.getClientRects().length) return false;
          if (getComputedStyle(element).pointerEvents === "none") return false;
          const rect = element.getBoundingClientRect();
          return rect.right > barRect.left && rect.left < barRect.right && rect.bottom > barRect.top && rect.top < barRect.bottom;
        });
      if (!blockers.length) break;
      const nextTop = Math.max(...blockers.map(element => element.getBoundingClientRect().bottom)) + 6;
      ui.root.style.top = Math.round(nextTop) + "px";
      barRect = ui.root.getBoundingClientRect();
    }
  }

  function observeMedia() {
    document.querySelectorAll("audio, video").forEach(trackMedia);
    const observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return;
        if (node.matches("audio, video")) trackMedia(node);
        node.querySelectorAll?.("audio, video").forEach(trackMedia);
      }));
      syncEmbeddedSceneState();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  window.LongMarchAudio = {
    get volume() { return masterVolume; },
    get muted() { return masterVolume === 0; },
    get hasManagedBackground() { return Boolean(backgroundConfig()) || pageManagesBackground; },
    setVolume: value => setMasterVolume(value),
    toggleMute,
    unlock: unlockBackground
  };

  document.addEventListener("DOMContentLoaded", () => {
    observeMedia();
    createBackgroundAudio();
    createUi();
    setMasterVolume(masterVolume, { persist: false });
    syncEmbeddedSceneState();
    notifyParentSceneState(true);
    if (audioUnlocked) unlockBackground();
  }, { once: true });

  document.addEventListener("pointerdown", unlockBackground, { capture: true });
  document.addEventListener("keydown", unlockBackground, { capture: true });
  window.addEventListener("resize", avoidInteractiveOverlap);
  window.addEventListener("message", event => {
    if (event.origin !== location.origin || event.data?.type !== "longMarch:sceneAudioState") return;
    if (event.data.active) setEmbeddedSceneActive(true);
    else syncEmbeddedSceneState();
  });
  window.addEventListener("pagehide", () => notifyParentSceneState(false));
  ["play", "playing", "pause", "ended", "volumechange"].forEach(type => {
    document.addEventListener(type, event => {
      if (event.target instanceof HTMLVideoElement) queueMicrotask(refreshBackgroundDuck);
    }, true);
  });
})();
