import { EventBus } from "../core/EventBus.js";
import { StateStore, hasChapterProgress, resetChapterProgress } from "../core/StateStore.js";
import { AudioManager } from "../core/AudioManager.js";
import { PanoramaViewer } from "../components/PanoramaViewer.js";
import { HotspotLayer } from "../components/HotspotLayer.js";
import { DialogueSystem } from "../components/DialogueSystem.js";
import { ArchiveLibrary } from "../components/ArchiveLibrary.js";
import { CinematicNarration } from "../components/CinematicNarration.js";
import { ChapterMap } from "../components/ChapterMap.js";
import { FinalePlayer } from "../components/FinalePlayer.js";

const wait = duration => new Promise(resolve => setTimeout(resolve, duration));

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`无法加载 ${path}`);
  return response.json();
}

export class LongMarchEngine {
  constructor(root) {
    this.root = root;
    this.bus = new EventBus();
    this.audio = new AudioManager();
    this.noticeTimer = 0;
    this.rewardTimer = 0;
    this.archiveQueue = [];
    this.archiveReturnFocus = null;
    this.pendingEndingArchives = [];
    this.pendingEndingReturnFocus = null;
    this.finaleRunToken = 0;
    this.entryGateResolved = new Set();
  }

  async start() {
    const [manifest, archiveData] = await Promise.all([fetchJson("data/chapters.json"), fetchJson("data/archives.json")]);
    this.manifest = manifest.chapters;
    this.archive = new ArchiveLibrary({
      root: document.getElementById("archive"),
      records: archiveData.archives,
      onOpen: () => {
        this.archiveView = this.viewer?.holdView();
      },
      onClose: () => {
        this.viewer?.restoreView(this.archiveView);
        this.archiveView = null;
        this.openNextQueuedArchive(140);
      }
    });
    this.viewer = new PanoramaViewer({
      viewport: this.root,
      canvas: document.getElementById("panorama"),
      curtain: document.getElementById("transitionCurtain"),
      onViewChange: () => this.hotspotLayer?.update()
    });
    this.hotspotLayer = new HotspotLayer({
      element: document.getElementById("hotspotLayer"),
      viewer: this.viewer,
      onActivate: (hotspot, button) => this.activateHotspot(hotspot, button)
    });
    this.dialogue = new DialogueSystem({
      root: document.getElementById("dialogue"), audio: this.audio,
      onChoice: result => this.handleChoice(result),
      onComplete: (dialogue, context) => this.handleDialogueComplete(dialogue, context),
      onOpen: () => {
        this.dialogueView = this.viewer?.holdView();
      },
      onClose: () => {
        this.viewer?.restoreView(this.dialogueView);
        this.dialogueView = null;
      }
    });
    this.cinematic = new CinematicNarration({
      root: document.getElementById("cinematicNarration")
    });
    this.finale = new FinalePlayer({
      root: document.getElementById("finalePlayer")
    });
    this.chapterMap = new ChapterMap({
      root: document.getElementById("chapterMap"),
      onClose: () => {
        const ids = this.pendingEndingArchives.splice(0);
        const returnFocus = this.pendingEndingReturnFocus;
        this.pendingEndingReturnFocus = null;
        this.queueArchives(ids, returnFocus);
      }
    });
    this.setupUI();
    const params = new URLSearchParams(location.search);
    const requested = params.get("chapter");
    const initialChapterId = this.manifest.some(item => item.id === requested) ? requested : "yudu";
    await this.resolveStartupMemoryChoice(initialChapterId);
    await this.loadChapter(initialChapterId, true);
    document.getElementById("loading").classList.add("hidden");
    await this.playChapterIntroIfNeeded();
  }

  setupUI() {
    window.addEventListener("lm:modechange", () => {
      if (this.currentScene) this.renderSceneHotspots();
    });
    const nav = document.getElementById("chapterNav");
    for (const chapter of this.manifest) {
      if (chapter.id === "yudu") continue;
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.chapter = chapter.id;
      button.textContent = chapter.shortTitle;
      button.addEventListener("click", async () => {
        await this.loadChapter(chapter.id);
        await this.playChapterIntroIfNeeded();
      });
      nav.appendChild(button);
    }
    const progress = document.querySelector(".chapter-progress");
    const toggle = document.getElementById("progressToggle");
    toggle.addEventListener("click", () => {
      const expanded = !progress.classList.contains("expanded");
      progress.classList.toggle("expanded", expanded);
      toggle.setAttribute("aria-expanded", String(expanded));
    });
    document.getElementById("resetButton").addEventListener("click", async () => {
      if (!await window.LongMarchUI.confirmReset("确定重新开始本章吗？")) return;
      this.store.reset();
      await this.loadChapter(this.chapter.id, true);
      await this.playChapterIntroIfNeeded();
    });
    document.getElementById("archiveLibraryButton").addEventListener("click", () => {
      this.archive.openIndex(this.store.state.unlockedArchives, this.chapter.id);
    });
    this.root.addEventListener("pointerdown", () => this.audio.resume());
  }

  resolveStartupMemoryChoice(chapterId) {
    if (window.LongMarchClassroom?.teacher) return Promise.resolve("continue");
    if (!hasChapterProgress(chapterId)) return Promise.resolve("continue");
    const resumeChoice = document.getElementById("resumeChoice");
    const resumeButton = document.getElementById("resumeChapterButton");
    const restartButton = document.getElementById("restartChapterButton");
    const loadingText = document.querySelector("#loading p");
    if (!resumeChoice || !resumeButton || !restartButton) return Promise.resolve("continue");

    if (loadingText) loadingText.textContent = "请选择是否继续上次学习……";
    resumeChoice.classList.add("open");
    resumeChoice.setAttribute("aria-hidden", "false");
    return new Promise(resolve => {
      const close = choice => {
        resumeChoice.classList.remove("open");
        resumeChoice.setAttribute("aria-hidden", "true");
        if (loadingText) loadingText.textContent = "正在载入章节……";
        resolve(choice);
      };
      resumeButton.addEventListener("click", () => close("continue"), { once: true });
      restartButton.addEventListener("click", () => {
        resetChapterProgress(chapterId);
        close("restart");
      }, { once: true });
      requestAnimationFrame(() => resumeButton.focus({ preventScroll: true }));
    });
  }

  async loadChapter(id, immediate = false) {
    const entry = this.manifest.find(item => item.id === id);
    if (!entry) throw new Error(`未知章节：${id}`);
    this.cinematic?.cancel();
    this.finale?.cancel();
    this.finaleRunToken += 1;
    this.chapterMap?.close({ silent: true });
    this.root.classList.remove("in-cinematic", "in-finale");
    this.pendingEndingArchives = [];
    this.pendingEndingReturnFocus = null;
    this.chapter = await fetchJson(entry.data);
    const externalScenes = await Promise.all(
      (this.chapter.sceneFiles || []).map(sceneFile => fetchJson(sceneFile))
    );
    this.chapter.scenes = [
      ...externalScenes,
      ...(Array.isArray(this.chapter.scenes) ? this.chapter.scenes : [])
    ];
    clearTimeout(this.noticeTimer);
    clearTimeout(this.rewardTimer);
    this.archiveQueue = [];
    this.archiveReturnFocus = null;
    for (const element of [document.getElementById("sceneNotice"), document.getElementById("rewardToast")]) {
      element.classList.remove("visible");
      element.textContent = "";
    }
    this.store = new StateStore(id);
    const pendingIntro = this.chapter.cinematics?.intro && !this.store.state.introPlayed;
    await this.audio.setMusicScale(pendingIntro ? (this.chapter.cinematics.intro.musicStartScale ?? .4) : 1, 0);
    this.sceneById = new Map(this.chapter.scenes.map(scene => [scene.id, scene]));
    this.viewer.init(this.chapter.panorama);
    document.title = `${this.chapter.title} · 长征红色征途`;
    for (const button of document.querySelectorAll("#chapterNav button")) button.classList.toggle("active", button.dataset.chapter === id);
    const lecturePoint = window.LongMarchClassroom?.teacher ? window.LongMarchClassroom.point : "";
    const startScene = this.sceneById.has(lecturePoint) ? lecturePoint : this.sceneById.has(this.store.state.currentScene) ? this.store.state.currentScene : this.chapter.startScene;
    this.store.patch({ currentScene: startScene });
    await this.enterScene(startScene, immediate);
    const url = new URL(location.href);
    url.searchParams.set("chapter", id);
    history.replaceState(null, "", url);
  }

  async playChapterIntroIfNeeded() {
    if (window.LongMarchClassroom?.teacher) return;
    const intro = this.chapter?.cinematics?.intro;
    if (!intro || this.store.state.introPlayed) return;
    const chapterId = this.chapter.id;
    await this.waitForChapterEntryGate(chapterId);
    if (this.chapter.id !== chapterId) return;
    this.store.patch({ introPlayed: true });
    this.root.classList.add("in-cinematic");
    try {
      await this.audio.setMusicScale(intro.musicStartScale ?? .4, 0);
      await this.cinematic.play(intro);
    } finally {
      // Restore exploration as soon as the narration closes, independently of audio fades.
      if (this.chapter.id === chapterId) this.root.classList.remove("in-cinematic");
    }
    if (this.chapter.id !== chapterId) return;
    await this.audio.setMusicScale(1, intro.musicRestoreMs ?? 1100);
  }

  waitForChapterEntryGate(chapterId) {
    if (chapterId !== "yudu" || this.entryGateResolved.has(chapterId)) return Promise.resolve();
    const eventName = "lm:start-yudu-chapter";
    if (window.__longMarchTitlecardEvents?.[eventName]) {
      this.entryGateResolved.add(chapterId);
      return Promise.resolve();
    }
    return new Promise(resolve => {
      window.addEventListener(eventName, () => {
        this.entryGateResolved.add(chapterId);
        resolve();
      }, { once: true });
    });
  }

  async playChapterOutro(outro, mapConfig, archiveIds, returnFocus) {
    const chapterId = this.chapter.id;
    this.store.patch({ outroPlayed: true });
    this.root.classList.add("in-cinematic");
    await this.audio.setMusicScale(outro.musicStartScale ?? .9, 480);
    await this.cinematic.play(outro, {
      onStep: step => {
        if (step.emphasis) {
          this.audio.setMusicScale(outro.musicEmphasisScale ?? 1, 560);
        }
      }
    });
    if (this.chapter.id !== chapterId) return;
    await this.audio.setMusicScale(0, outro.musicFadeOutMs ?? 1800);
    this.root.classList.remove("in-cinematic");

    if (mapConfig?.audio?.source) {
      await this.audio.playMusic(mapConfig.audio, mapConfig.audio.fadeMs ?? 1000);
      await this.audio.setMusicScale(1, mapConfig.audio.fadeMs ?? 1000);
    }
    if (this.chapter.id !== chapterId) return;

    if (mapConfig) {
      this.pendingEndingArchives = [...archiveIds];
      this.pendingEndingReturnFocus = returnFocus;
      this.chapterMap.open(mapConfig);
    } else {
      this.queueArchives(archiveIds, returnFocus);
    }
  }

  async playFinaleSequence(config, archiveIds, returnFocus) {
    if (!config?.source) {
      this.queueArchives(archiveIds, returnFocus);
      return;
    }

    const chapterId = this.chapter.id;
    const runToken = ++this.finaleRunToken;
    const soundtrack = config.soundtrack || config.endingMusic;
    let preparedSoundtrack = null;
    const soundtrackPreparation = soundtrack?.source
      ? this.audio.prepareMusic(soundtrack).then(track => {
          preparedSoundtrack = track;
          return track;
        })
      : Promise.resolve(null);
    let soundtrackStart = Promise.resolve();
    let soundtrackStarted = false;
    this.root.classList.add("in-finale");
    const moviePlayback = this.finale.play(config, {
      beforeVideoStart: () => soundtrackPreparation,
      onVideoStart: preparedTrack => {
        if (
          soundtrackStarted ||
          !preparedTrack ||
          this.chapter.id !== chapterId ||
          runToken !== this.finaleRunToken
        ) {
          this.audio.discardPreparedMusic(preparedTrack);
          return Promise.resolve();
        }
        soundtrackStarted = true;
        soundtrackStart = this.audio.startPreparedMusic(preparedTrack, soundtrack.fadeInMs ?? 0);
        return soundtrackStart;
      }
    });
    await this.audio.stopAll(config.audioFadeOutMs ?? 500);
    try {
      await moviePlayback;
    } catch (error) {
      if (!soundtrackStarted) {
        const track = preparedSoundtrack || await soundtrackPreparation;
        this.audio.discardPreparedMusic(track);
      }
      throw error;
    }
    await soundtrackStart;
    if (this.chapter.id !== chapterId || runToken !== this.finaleRunToken) return;

    await wait(config.freezeLeadMs ?? 1000);
    const outro = this.chapter.cinematics?.outro;
    if (outro) await this.cinematic.play(outro);
    if (this.chapter.id !== chapterId || runToken !== this.finaleRunToken) return;

    await this.audio.stopAll(soundtrack?.fadeOutMs ?? 2500);
    for (const id of config.completeHotspots || []) this.store.completeHotspot(id);
    this.store.patch({ chapterCompleted: true, outroPlayed: true });
    this.showNotice("本章流程已完成");
    this.renderSceneHotspots();
    this.renderProgress();

    const mapConfig = this.chapter.mapTransition;
    if (mapConfig?.audio?.source) {
      await this.audio.playMusic(mapConfig.audio, mapConfig.audio.fadeMs ?? 1000);
    }
    if (this.chapter.id !== chapterId || runToken !== this.finaleRunToken) return;

    this.root.classList.remove("in-finale");
    if (mapConfig) {
      this.pendingEndingArchives = [...archiveIds];
      this.pendingEndingReturnFocus = returnFocus;
      this.chapterMap.open(mapConfig);
      this.finale.close();
    } else {
      this.finale.close();
      this.queueArchives(archiveIds, returnFocus);
    }
  }

  async enterScene(id, immediate = false) {
    const scene = this.sceneById.get(id);
    if (!scene) return;
    this.currentScene = scene;
    this.store.patch({ currentScene: id });
    await Promise.all([
      this.audio.releaseVideo(immediate ? 0 : 280),
      this.audio.releaseEnvironment(immediate ? 0 : 280)
    ]);
    await this.viewer.loadScene(scene, immediate);
    await this.audio.playScene(this.resolveSceneAudio(scene), this.viewer.media);
    this.dialogue.setPlacement(scene.dialoguePlacement);
    document.getElementById("sceneMeta").textContent = scene.caption || this.chapter.caption;
    document.getElementById("sceneTitle").textContent = scene.title;
    this.renderSceneHotspots();
    this.renderProgress();
    if (scene.entryNotice) this.showNotice(scene.entryNotice);
  }

  resolveSceneAudio(scene) {
    const normalize = config => config?.source ? { music: config } : (config || {});
    const chapterAudio = normalize(this.chapter.audio);
    const sceneAudio = normalize(scene.audio);
    const mergeTrack = (base, override) => {
      if (override === null || override === false) return null;
      if (!base && !override) return null;
      return { ...(base || {}), ...(override || {}) };
    };
    return {
      fadeMs: sceneAudio.fadeMs ?? chapterAudio.fadeMs ?? 900,
      duckFactor: sceneAudio.duckFactor ?? chapterAudio.duckFactor ?? .75,
      music: mergeTrack(chapterAudio.music, sceneAudio.music),
      ambience: mergeTrack(chapterAudio.ambience, sceneAudio.ambience),
      effects: sceneAudio.effects ?? chapterAudio.effects ?? [],
      video: mergeTrack(chapterAudio.video, sceneAudio.video)
    };
  }

  requirementsMet(hotspot) {
    if(window.LongMarchClassroom?.teacher) return true;
    const requirements = hotspot.requires || [];
    return requirements.every(id => this.store.state.completedHotspots.includes(id));
  }

  renderSceneHotspots() {
    const hotspots = this.currentScene.hotspots.filter(hotspot => this.requirementsMet(hotspot));
    this.hotspotLayer.setHotspots(hotspots, this.store.state);
  }

  activateHotspot(hotspot, button) {
    this.audio.resume();
    if (hotspot.kind === "continue") {
      this.enterScene(hotspot.targetScene);
      return;
    }
    const dialogue = this.chapter.dialogues[hotspot.dialogue];
    if (!dialogue) return;
    this.dialogue.open(dialogue, { hotspot, button });
  }

  handleChoice({ node, choice, correct, context }) {
    if (node.id) this.store.recordChoice(node.id, choice.id || choice.text);
    if (!correct) return;
    const effects = choice.effects || choice.onCorrect || node.onCorrect || {};
    if (effects.unlockArchives?.length) {
      this.store.unlockArchives(effects.unlockArchives);
    }
    if (effects.openArchive) {
      context.deferredArchives ||= [];
      context.deferredArchives.push(effects.openArchive);
    }
  }

  handleDialogueComplete(dialogue, context) {
    const hotspot = context.hotspot;
    const effects = dialogue.onComplete || {};
    if (hotspot?.id) this.store.completeHotspot(hotspot.id);
    if (effects.rewards?.length) {
      this.store.addRewards(effects.rewards);
      this.showReward(`获得：${effects.rewards.join("、")}`);
    }
    if (effects.unlockArchives?.length) this.store.unlockArchives(effects.unlockArchives);
    if (effects.chapterComplete) {
      this.store.patch({ chapterCompleted: true });
      this.showNotice("本章流程已完成");
    }
    this.renderSceneHotspots();
    this.renderProgress();
    const archiveIds = [
      ...(context.deferredArchives || []),
      ...(effects.openArchive ? [effects.openArchive] : [])
    ];
    if (effects.finale) {
      this.playFinaleSequence(this.chapter.finale, archiveIds, context.button).catch(error => {
        console.error("最终电影流程播放失败。", error);
        this.cinematic.cancel();
        this.finale.cancel();
        this.root.classList.remove("in-finale", "in-cinematic");
        this.queueArchives(archiveIds, context.button);
      });
      return;
    }
    const outro = effects.chapterComplete ? this.chapter.cinematics?.outro : null;
    if (outro && !this.store.state.outroPlayed) {
      this.playChapterOutro(outro, this.chapter.mapTransition, archiveIds, context.button).catch(error => {
        console.error("章节结尾叙述播放失败。", error);
        this.root.classList.remove("in-cinematic");
        this.queueArchives(archiveIds, context.button);
      });
    } else {
      this.queueArchives(archiveIds, context.button);
    }
    const openNextDialogue = () => {
      if (!effects.openDialogue) return;
      const nextDialogue = this.chapter.dialogues[effects.openDialogue];
      if (!nextDialogue) return;
      const nextContext = { button: context.button };
      if (effects.openDialogueHotspotId) nextContext.hotspot = { id: effects.openDialogueHotspotId };
      this.dialogue.open(nextDialogue, nextContext);
    };
    if (effects.targetScene) {
      this.enterScene(effects.targetScene).then(openNextDialogue);
    } else if (effects.openDialogue) {
      setTimeout(openNextDialogue, effects.openDialogueDelayMs ?? 280);
    }
  }

  queueArchives(ids, returnFocus) {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) return;
    this.archiveQueue.push(...uniqueIds);
    this.archiveReturnFocus = returnFocus;
    this.openNextQueuedArchive(80);
  }

  openNextQueuedArchive(delay = 0) {
    if (this.archive.isOpen() || !this.archiveQueue.length) return;
    const id = this.archiveQueue.shift();
    const returnFocus = this.archiveReturnFocus;
    setTimeout(() => {
      if (this.archive.isOpen()) {
        this.archiveQueue.unshift(id);
        return;
      }
      this.archive.open(id, returnFocus);
      if (!this.archiveQueue.length) this.archiveReturnFocus = null;
    }, delay);
  }

  renderProgress() {
    document.getElementById("chapterLabel").textContent = this.chapter.progressLabel || this.chapter.shortTitle;
    const list = document.getElementById("progressList");
    list.replaceChildren();
    let completed = 0;
    const currentIndex = this.chapter.scenes.findIndex(scene => scene.id === this.currentScene.id);
    this.chapter.scenes.forEach((scene, index) => {
      const required = scene.requiredHotspots || [];
      const done = required.length ? required.every(id => this.store.state.completedHotspots.includes(id)) : index < currentIndex;
      if (done) completed += 1;
      const item = document.createElement("li");
      item.textContent = scene.progressTitle || scene.title;
      item.classList.toggle("completed", done);
      item.classList.toggle("current", scene.id === this.currentScene.id);
      list.appendChild(item);
    });
    document.getElementById("progressCount").textContent = `探索 ${completed}/${this.chapter.scenes.length}`;
  }

  showNotice(message) {
    const element = document.getElementById("sceneNotice");
    clearTimeout(this.noticeTimer);
    element.textContent = message;
    element.classList.add("visible");
    this.noticeTimer = setTimeout(() => element.classList.remove("visible"), 3200);
  }

  showReward(message) {
    const element = document.getElementById("rewardToast");
    clearTimeout(this.rewardTimer);
    element.textContent = message;
    element.classList.add("visible");
    this.rewardTimer = setTimeout(() => element.classList.remove("visible"), 3200);
  }
}
