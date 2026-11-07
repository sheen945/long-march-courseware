(function () {
  "use strict";

  const DEFAULT_VOLUME = 0.72;
  const BASE_TOP_CSS = "var(--lm-unified-topbar-top)";
  const MAP_URL = "../../index.html";
  const AVOID_SELECTORS = [
    "#chapterNav",
    ".chapter-progress",
    ".scene-caption",
    ".chapter-hud",
    ".stage-heading",
    ".hud-header",
    ".time-display",
    "header",
    ".chapter-header > *"
  ];

  const ICONS = {
    fullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    exitFullscreen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h5V4m6 0v5h5M9 20v-5H4m16 0h-5v5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.2h4.1L13 5v14l-4.9-4.2H4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M16.2 8.2c1.45 1.45 1.45 6.15 0 7.6M18.7 5.7c3.1 3.15 3.1 9.45 0 12.6" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round"/></svg>',
    reset: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 8.3A6.4 6.4 0 1 1 6 12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M7.1 4.7v3.8h3.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.4 10 4l4 2 5-2.4v14L14 20l-4-2-5 2.4z" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linejoin="round"/><path d="M10 4v14M14 6v14" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg>',
    teacher: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h18v12H10M12 16v4m-4 1h8M3 21v-7m-2 3 2-3 5 1 4-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="4" cy="10" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12a2 2 0 0 1 2 2v16H6a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Zm1 0v14m-3 1h16M9 7h7m-7 4h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function clamp(value, min = 0, max = 1) {
    return Math.max(min, Math.min(max, Number(value) || 0));
  }

  function candidate(selector) {
    const element = document.querySelector(selector);
    if (!element || element.closest(".lm-unified-topbar")) return null;
    return element;
  }

  function triggerFirst(selectors) {
    for (const selector of selectors) {
      const element = candidate(selector);
      if (!element) continue;
      element.click();
      return true;
    }
    return false;
  }

  // Safari can detach a fullscreen iframe's view when window.confirm opens.
  // Keep reset confirmation in the same document and resolve only explicit consent.
  let pendingConfirmation = null;
  function confirmReset(message) {
    if (pendingConfirmation) return pendingConfirmation;
    let settle;
    const result = new Promise(resolve => { settle = resolve; });
    pendingConfirmation = result;
    const previousFocus = document.activeElement;
    const classroom = window.LongMarchClassroom;
    const wasPaused = classroom?.paused;
    const dialog = document.createElement("dialog");
    dialog.className = "lm-reset-confirm";
    dialog.setAttribute("aria-labelledby", "lm-reset-confirm-title");
    dialog.setAttribute("aria-describedby", "lm-reset-confirm-message");
    const title = document.createElement("h2");
    title.id = "lm-reset-confirm-title"; title.textContent = "重置本章";
    const text = document.createElement("p");
    text.id = "lm-reset-confirm-message"; text.textContent = message;
    const actions = document.createElement("div");
    const cancel = document.createElement("button");
    cancel.type = "button"; cancel.textContent = "取消"; cancel.autofocus = true;
    const accept = document.createElement("button");
    accept.type = "button"; accept.textContent = "确认重置";
    accept.className = "lm-reset-confirm__accept";
    actions.append(cancel, accept); dialog.append(title, text, actions);
    let finished = false;
    const finish = approved => {
      if (finished) return;
      finished = true;
      window.removeEventListener("pagehide", abandon);
      dialog.remove(); pendingConfirmation = null;
      if (classroom && !wasPaused) classroom.setPaused(false);
      if (previousFocus?.isConnected) previousFocus.focus();
      settle(approved === true);
    };
    const abandon = () => finish(false);
    cancel.addEventListener("click", abandon);
    accept.addEventListener("click", () => finish(true));
    dialog.addEventListener("cancel", event => { event.preventDefault(); abandon(); });
    dialog.addEventListener("close", abandon);
    window.addEventListener("pagehide", abandon, { once: true });
    document.body.append(dialog);
    try { dialog.showModal(); classroom?.setPaused(true); cancel.focus(); }
    catch (_) { finish(false); }
    return result;
  }
  window.LongMarchUI = Object.freeze({ confirmReset });

  function resetChapter() {
    const triggered = triggerFirst([
      "#resetChapterButton",
      "#resetButton",
      "#restartButton"
    ]);
    if (!triggered) (window.LongMarchSave ? window.LongMarchSave.reload() : location.reload());
  }

  function goMap() {
    window.LongMarchTeaching?.prepareLeave?.();
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "longMarch:closeScene" }, "*");
      return;
    }
    window.location.href = MAP_URL;
  }

  function createButton(kind, label, onClick) {
    const button = document.createElement("button");
    button.className = "lm-unified-topbar__button";
    button.type = "button";
    button.setAttribute("aria-label", label);
    button.innerHTML = `${ICONS[kind]}<span class="lm-unified-topbar__label">${label}</span><span class="lm-unified-topbar__tooltip">${label}</span>`;
    button.addEventListener("click", onClick);
    return button;
  }

  function visibleBox(element) {
    if (!element || element.closest(".lm-unified-topbar")) return null;
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity || 1) < 0.08) return null;
    const rect = element.getBoundingClientRect();
    if (rect.width < 3 || rect.height < 3) return null;
    if (element.tagName === "HEADER" && rect.width > window.innerWidth * .9) return null;
    return rect;
  }

  function createFullscreenButton(nav) {
    // Fullscreen the shared page so returning from an embedded chapter keeps the map fullscreen.
    let hostDocument = document;
    try { hostDocument = window.top.document; } catch (_) { /* Standalone or cross-origin embed. */ }
    const root = hostDocument.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    const exit = hostDocument.exitFullscreen || hostDocument.webkitExitFullscreen;
    const status = document.createElement("span");
    status.className = "lm-unified-topbar__status";
    status.setAttribute("role", "status");
    status.hidden = true;
    let busy = false;
    let statusTimer;
    const active = () => Boolean(hostDocument.fullscreenElement || hostDocument.webkitFullscreenElement);
    const button = createButton("fullscreen", "进入全屏", async () => {
      if (busy || !request || !exit) return;
      busy = true;
      status.hidden = true;
      button.disabled = true;
      try {
        if (active()) await exit.call(hostDocument);
        else await request.call(root);
      } catch (_) {
        status.textContent = "暂时无法切换全屏，请使用浏览器的全屏功能。";
        status.hidden = false;
        window.clearTimeout(statusTimer);
        statusTimer = window.setTimeout(() => { status.hidden = true; }, 4500);
      } finally {
        busy = false;
        button.disabled = false;
        sync();
      }
    });
    button.id = "lm-fullscreen-toggle";
    const sync = () => {
      const isFullscreen = active();
      const label = isFullscreen ? "退出全屏" : "进入全屏";
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(isFullscreen));
      button.title = label;
      button.querySelector("svg").outerHTML = ICONS[isFullscreen ? "exitFullscreen" : "fullscreen"];
      button.querySelectorAll("span").forEach(span => { span.textContent = label; });
      avoidOverlap();
    };
    const listeners = new AbortController();
    hostDocument.addEventListener("fullscreenchange", sync, { signal: listeners.signal });
    hostDocument.addEventListener("webkitfullscreenchange", sync, { signal: listeners.signal });
    window.addEventListener("pagehide", event => {
      if (!event.persisted) listeners.abort();
      window.clearTimeout(statusTimer);
    });
    sync();
    if (!request || !exit) {
      button.disabled = true;
      button.title = "当前浏览器不支持网页全屏";
      button.querySelector(".lm-unified-topbar__tooltip").textContent = button.title;
    }
    nav.append(button, status);
  }

  function intersects(a, b) {
    return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
  }

  function avoidOverlap() {
    const topbar = document.querySelector(".lm-unified-topbar");
    if (!topbar) return;
    topbar.style.top = BASE_TOP_CSS;
    // These chapter captions used to push the common controls below the view.
    // Keep controls on the same top edge; reserve the next row for the caption.
    if (/\/scenes\/(zunyi|luding)\//.test(location.pathname)) {
      document.body.classList.add("lm-topbar-pinned");
      const caption = document.querySelector(".scene-caption");
      if (caption) document.body.style.setProperty("--lm-caption-bottom", `${Math.ceil(caption.getBoundingClientRect().bottom)}px`);
      return;
    }
    requestAnimationFrame(() => {
      let barRect = topbar.getBoundingClientRect();
      for (let pass = 0; pass < 4; pass += 1) {
        const blockers = AVOID_SELECTORS
          .flatMap(selector => Array.from(document.querySelectorAll(selector)))
          .map(visibleBox)
          .filter(Boolean)
          .filter(rect => rect.top < Math.min(128, window.innerHeight * .18))
          .filter(rect => intersects(barRect, rect));
        if (!blockers.length) break;
        const nextTop = Math.min(
          Math.max(...blockers.map(rect => rect.bottom)) + 8,
          Math.max(12, window.innerHeight - barRect.height - 12)
        );
        topbar.style.top = `${Math.round(nextTop)}px`;
        barRect = topbar.getBoundingClientRect();
      }
    });
  }

  function currentAudioVolume() {
    return clamp(window.LongMarchAudio?.volume ?? DEFAULT_VOLUME);
  }

  function setAudioVolume(value) {
    if (window.LongMarchAudio?.setVolume) window.LongMarchAudio.setVolume(value);
  }

  function buildTopbar() {
    if (document.querySelector(".lm-unified-topbar")) return;

    const nav = document.createElement("nav");
    nav.className = "lm-unified-topbar";
    nav.setAttribute("aria-label", "长征章节通用控制栏");

    const volumeWrap = document.createElement("div");
    volumeWrap.className = "lm-unified-topbar__volume";
    volumeWrap.setAttribute("role", "group");
    volumeWrap.setAttribute("aria-label", "音量");

    const volumeButton = createButton("volume", "静音 / 恢复音量", () => {
      if (window.LongMarchAudio?.toggleMute) window.LongMarchAudio.toggleMute();
      syncVolume();
    });
    volumeButton.classList.add("lm-unified-topbar__button--volume");

    const slider = document.createElement("input");
    slider.className = "lm-unified-topbar__slider";
    slider.type = "range";
    slider.min = "0";
    slider.max = "100";
    slider.step = "1";
    slider.setAttribute("aria-label", "同时调整背景音乐、音效和视频声音");

    const value = document.createElement("output");
    value.className = "lm-unified-topbar__value";
    value.setAttribute("aria-live", "polite");

    slider.addEventListener("input", () => setAudioVolume(Number(slider.value) / 100));

    volumeWrap.append(volumeButton, slider, value);
    const inScene=/\/scenes\//.test(location.pathname);
    const teaching=createButton("teacher",inScene?"进入授课模式":"教师授课",()=>{
      window.LongMarchTeaching?.toggleMode();
    });
    teaching.id="lm-teacher-toggle";
    const archive=createButton("archive","历史档案",()=>window.LongMarchTeaching?.openIndex());
    archive.id="lm-open-archives";
    nav.append(volumeWrap);
    if(inScene)nav.append(createButton("map", "返回地图", goMap));
    nav.append(teaching);
    if(inScene)nav.append(archive,createButton("reset", "重置本章", resetChapter));
    createFullscreenButton(nav);
    document.body.appendChild(nav);
    document.body.classList.add("lm-unified-topbar-ready");

    function syncVolume(event) {
      const volume = clamp(event?.detail?.volume ?? currentAudioVolume());
      const muted = Boolean(event?.detail?.muted ?? window.LongMarchAudio?.muted ?? volume === 0);
      const percentage = Math.round(volume * 100);
      slider.value = String(percentage);
      value.textContent = `${percentage}%`;
      volumeButton.dataset.muted = String(muted);
      volumeButton.setAttribute("aria-pressed", String(muted));
      volumeButton.setAttribute("aria-label", muted ? "恢复音量" : "静音");
    }

    window.addEventListener("longmarchvolumechange", syncVolume);
    const syncMode=()=>{
      const active=Boolean(window.LongMarchClassroom?.teacher);
      const label=active?(window.LongMarchClassroom?.exitTeachingToMap?"结束授课并返回地图":"退出授课模式"):"进入授课模式";
      teaching.setAttribute("aria-label",label);teaching.setAttribute("aria-pressed",String(active));
      teaching.querySelectorAll("span").forEach(span=>span.textContent=label);
    };
    window.addEventListener("lm:modechange",syncMode);syncMode();
    if(!inScene){
      const syncFrame=()=>document.body.classList.toggle("lm-scene-frame-open",[...document.querySelectorAll("iframe.scene-frame")].some(frame=>frame.getClientRects().length&&getComputedStyle(frame).visibility!=="hidden"));
      new MutationObserver(syncFrame).observe(document.body,{childList:true,subtree:true});syncFrame();
    }
    window.addEventListener("resize", avoidOverlap);
    syncVolume();
    avoidOverlap();
    window.setTimeout(syncVolume, 250);
    window.setTimeout(avoidOverlap, 350);
    window.setTimeout(avoidOverlap, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildTopbar, { once: true });
  } else {
    buildTopbar();
  }
})();
