const viewport = document.getElementById("viewport");
const canvas = document.getElementById("panorama");
const villagerHotspot = document.getElementById("villagerHotspot");
const soldierHotspot = document.getElementById("soldierHotspot");
const soldierHotspotSecondary = document.getElementById("soldierHotspotSecondary");
const soldierHotspots = [soldierHotspot, soldierHotspotSecondary].filter(Boolean);
const roadHotspot = document.getElementById("roadHotspot");
const roadPrompt = roadHotspot.querySelector(".road-prompt");
const messengerHotspot = document.getElementById("messengerHotspot");
const doorHotspot = document.getElementById("doorHotspot");
const doorPrompt = doorHotspot.querySelector(".door-prompt");
const meetingCharacterHotspots = Array.from(document.querySelectorAll(".meeting-character-hotspot"));
const meetingSummaryButton = document.getElementById("meetingSummaryButton");
const strategicDecisionButton = document.getElementById("strategicDecisionButton");
const strategicDecisionLabel = document.getElementById("strategicDecisionLabel");
const loading = document.getElementById("loading");
const chapterNarration = document.getElementById("chapterNarration");
const chapterNarrationLines = document.getElementById("chapterNarrationLines");
const skipNarration = document.getElementById("skipNarration");
const historyArchive = document.getElementById("historyArchive");
const historyArchiveClose = document.getElementById("historyArchiveClose");
const historyArchiveContent = document.getElementById("historyArchiveContent");
const archiveImageViewer = document.getElementById("archiveImageViewer");
const archiveImageViewerClose = document.getElementById("archiveImageViewerClose");
const archiveImageViewerImage = document.getElementById("archiveImageViewerImage");
const archiveImageViewerCaption = document.getElementById("archiveImageViewerCaption");
const dialogue = document.getElementById("dialogue");
const dialogueText = document.getElementById("dialogueText");
const dialogueOptions = document.getElementById("dialogueOptions");
const dialogueClose = document.getElementById("dialogueClose");
const speakerName = document.getElementById("speakerName");
const speakerMark = document.getElementById("speakerMark");
const speakerLabel = document.getElementById("speakerLabel");
const dialogueMeta = document.getElementById("dialogueMeta");
const leaves = document.getElementById("leaves");
const sceneCaption = document.querySelector(".scene-caption p");
const sceneTitle = document.querySelector(".scene-caption h1");
const chapterProgress = document.getElementById("chapterProgress");
const chapterProgressToggle = document.getElementById("chapterProgressToggle");
const chapterProgressList = document.getElementById("chapterProgressList");
const chapterProgressCount = document.getElementById("chapterProgressCount");
const meetingCharacterCount = document.getElementById("meetingCharacterCount");
const resetChapterButton = document.getElementById("resetChapterButton");
const resumeChoice = document.getElementById("resumeChoice");
const resumeChapterButton = document.getElementById("resumeChapterButton");
const restartChapterButton = document.getElementById("restartChapterButton");
const sceneNotice = document.getElementById("sceneNotice");
const chapterFinale = document.getElementById("chapterFinale");
const chapterFinalePanel = document.getElementById("chapterFinalePanel");
const chapterFinaleClose = document.getElementById("chapterFinaleClose");
const chapterFinaleEyebrow = document.getElementById("chapterFinaleEyebrow");
const chapterFinaleTitle = document.getElementById("chapterFinaleTitle");
const chapterFinaleContent = document.getElementById("chapterFinaleContent");

const CHAPTER_STATE_STORAGE_KEY = "longMarch_ruijin_chapterState";
const LONG_MARCH_PROGRESS_STORAGE_KEY = "longMarch_progress";
const CHAPTER_MUSIC_SOURCE = "assets/audio/ruijin-theme.mp3";
const CHAPTER_MUSIC_LEVELS = Object.freeze({
  opening: 0.7,
  village: 0.38,
  exterior: 0.4,
  meeting: 0.46,
  dialogue: 0.25,
  decision: 0.7,
  finale: 0.5,
  ending: 0.7,
  endingClimax: 0.9
});
const REQUIRED_MEETING_CHARACTERS = Object.freeze([
  "bo-gu",
  "li-de",
  "zhou-enlai"
]);
const MEETING_CHARACTER_LABELS = Object.freeze({
  "bo-gu": "博古",
  "li-de": "李德",
  "zhou-enlai": "周恩来",
  "zhang-wentian": "张闻天",
  "wang-jiaxiang": "王稼祥"
});
const STRATEGY_OPTIONS = Object.freeze({
  A: {
    text: "继续集中主力坚守中央苏区",
    feedback: "继续正面固守，可能使红军主力在敌军碉堡封锁和持续进攻中进一步消耗。",
    confirmable: false
  },
  B: {
    text: "将主力分散，各自在苏区坚持游击",
    feedback: "分散游击可以保存部分力量，但在当前严密封锁下，中央红军主力可能被分割，难以形成新的战略行动。",
    confirmable: false
  },
  C: {
    text: "实施战略转移，保存红军主力，寻找新的发展空间",
    feedback: "战略转移并不是简单撤退，而是为了保存主力、摆脱包围，并寻找新的革命发展空间。",
    confirmable: true
  }
});
const DIARY_QUESTIONS = Object.freeze([
  {
    question: "战略转移筹划时，中央苏区面临的主要形势是什么？",
    options: ["根据地不断扩大", "第五次反‘围剿’陷入困境", "红军已经到达陕北", "全国战争已经结束"],
    answer: 1,
    explanation: "敌军采取碉堡推进等方式，中央苏区范围缩小，红军主力持续承受压力。"
  },
  {
    question: "会议讨论“保存红军主力”，最主要是因为：",
    options: ["红军不愿继续作战", "原有根据地已经没有群众", "继续固守可能造成更大损失", "部队准备回乡休整"],
    answer: 2,
    explanation: "战略转移的目的不是逃避斗争，而是保存革命力量，摆脱不利局面。"
  },
  {
    question: "下列哪一项最符合会议中需要重新思考的问题？",
    options: ["是否继续照搬原有军事部署", "是否停止所有政治工作", "是否取消红军组织", "是否放弃群众工作"],
    answer: 0,
    explanation: "第五次反‘围剿’陷入困境，使中央需要重新判断军事部署和下一步行动。"
  },
  {
    question: "战略转移的直接目的是什么？",
    options: ["游览新的地区", "保存主力并寻找新的发展空间", "立即结束全部战争", "将所有部队分散回乡"],
    answer: 1,
    explanation: "战略转移是为了保存红军有生力量，突破包围，寻找新的立足和发展空间。"
  },
  {
    question: "长征开始前的这一决定体现了怎样的态度？",
    options: ["面对困难只会逃避", "不考虑实际情况", "根据形势作出理性调整", "坚持任何决定都不能改变"],
    answer: 2,
    explanation: "面对严峻形势，及时根据实际情况调整方向，体现了实事求是和责任担当。"
  }
]);
const CHAPTER_SCENES = Object.freeze(["village", "hallExterior", "hallInterior"]);
const ENGINE_SCENE_BY_CHAPTER_SCENE = Object.freeze({
  village: "ruijin-village",
  hallExterior: "yang-ancestral-hall-exterior",
  hallInterior: "yang-ancestral-hall-interior"
});
const CHAPTER_SCENE_BY_ENGINE_SCENE = Object.freeze(Object.fromEntries(
  Object.entries(ENGINE_SCENE_BY_CHAPTER_SCENE).map(([chapterScene, engineScene]) => [engineScene, chapterScene])
));
const OPENING_NARRATION = Object.freeze([
  "1934年5月。",
  "中央革命根据地，\n迎来了最严峻的时刻。",
  "第五次反‘围剿’形势日益严峻。\n五月下旬，\n中共中央开始筹划战略转移。",
  "一次关系中国革命未来的战略转折，\n正在悄然发生。",
  "故事，\n从江西瑞金开始。"
]);
const TRANSFER_INTERTITLE = Object.freeze(["1934年10月。\n第五次反“围剿”失利后，\n中央红军被迫实行战略转移。"]);
const ENDING_NARRATION = Object.freeze([
  "这不是一次普通的行军，\n而是一场充满未知与牺牲的远征。",
  "他们即将离开瑞金，\n踏上一条改变中国历史的道路。",
  "二万五千里长征，\n就此开始。"
]);
const DEFAULT_CHAPTER_STATE = Object.freeze({
  currentScene: "village",
  openingNarrationSeen: false,
  villageCivilianSeen: false,
  villageSoldierSeen: false,
  messengerSeen: false,
  meetingCharactersSeen: Object.freeze([]),
  meetingSummarySeen: false,
  strategicChoiceCompleted: false,
  telegramSent: false,
  diaryCompleted: false,
  endingNarrationSeen: false
});

function defaultChapterState() {
  return { ...DEFAULT_CHAPTER_STATE, meetingCharactersSeen: [] };
}

function sanitizeChapterState(value) {
  const source = value && typeof value === "object" ? value : {};
  const state = defaultChapterState();
  state.currentScene = CHAPTER_SCENES.includes(source.currentScene) ? source.currentScene : state.currentScene;
  for (const key of [
    "openingNarrationSeen", "villageCivilianSeen", "villageSoldierSeen", "messengerSeen",
    "meetingSummarySeen", "strategicChoiceCompleted", "telegramSent", "diaryCompleted", "endingNarrationSeen"
  ]) {
    state[key] = source[key] === true;
  }
  state.meetingCharactersSeen = Array.isArray(source.meetingCharactersSeen)
    ? [...new Set(source.meetingCharactersSeen.filter(item => typeof item === "string"))]
    : [];
  return state;
}

function loadChapterState() {
  try {
    const stored = localStorage.getItem(CHAPTER_STATE_STORAGE_KEY);
    return stored ? sanitizeChapterState(JSON.parse(stored)) : defaultChapterState();
  } catch (error) {
    console.warn("第一章本地状态损坏，已恢复默认状态。", error);
    return defaultChapterState();
  }
}

function hasStoredChapterProgress() {
  try {
    const stored = localStorage.getItem(CHAPTER_STATE_STORAGE_KEY);
    if (!stored) return false;
    const state = sanitizeChapterState(JSON.parse(stored));
    const defaults = defaultChapterState();
    if (state.currentScene !== defaults.currentScene) return true;
    if (state.meetingCharactersSeen.length > 0) return true;
    return [
      "openingNarrationSeen", "villageCivilianSeen", "villageSoldierSeen", "messengerSeen",
      "meetingSummarySeen", "strategicChoiceCompleted", "telegramSent", "diaryCompleted", "endingNarrationSeen"
    ].some(key => state[key] === true);
  } catch (error) {
    console.warn("第一章本地状态损坏，已跳过继续学习选择。", error);
    return false;
  }
}

let chapterState = loadChapterState();
let chapterResetInProgress = false;

function sceneFromUrl() {
  const requested = new URLSearchParams(location.search).get("scene");
  if (!requested) return null;
  if (CHAPTER_SCENES.includes(requested)) return requested;
  return CHAPTER_SCENE_BY_ENGINE_SCENE[requested] || null;
}

const requestedScene = sceneFromUrl();
if (requestedScene) chapterState.currentScene = requestedScene;
if (window.LongMarchClassroom?.teacher) {
  chapterState = defaultChapterState();
  chapterState.currentScene = CHAPTER_SCENES.includes(window.LongMarchClassroom.point) ? window.LongMarchClassroom.point : "village";
  chapterState.openingNarrationSeen = true;
}

function setResumeChoiceOpen(open) {
  resumeChoice.classList.toggle("open", open);
  resumeChoice.setAttribute("aria-hidden", String(!open));
}

function restartChapterFromStartupChoice() {
  localStorage.removeItem(CHAPTER_STATE_STORAGE_KEY);
  clearRuijinCompletionFromLongMarchProgress();
  chapterState = defaultChapterState();
  const cleanUrl = new URL(location.href);
  cleanUrl.searchParams.delete("scene");
  cleanUrl.searchParams.delete("resetProgress");
  history.replaceState(null, "", cleanUrl.href);
}

function resolveStartupMemoryChoice() {
  if (window.LongMarchClassroom?.teacher) return Promise.resolve("continue");
  if (!hasStoredChapterProgress()) return Promise.resolve("continue");
  loading.querySelector("p").textContent = "请选择是否继续上次学习……";
  setResumeChoiceOpen(true);
  return new Promise(resolve => {
    resumeChapterButton.addEventListener("click", () => {
      setResumeChoiceOpen(false);
      resolve("continue");
    }, { once: true });
    restartChapterButton.addEventListener("click", () => {
      restartChapterFromStartupChoice();
      setResumeChoiceOpen(false);
      resolve("restart");
    }, { once: true });
    requestAnimationFrame(() => resumeChapterButton.focus({ preventScroll: true }));
  });
}

function calculateChapterProgress(state = chapterState) {
  const meetingCharacters = new Set(state.meetingCharactersSeen);
  return {
    village: state.villageCivilianSeen && state.villageSoldierSeen,
    meeting: REQUIRED_MEETING_CHARACTERS.every(id => meetingCharacters.has(id)) && state.meetingSummarySeen,
    strategy: state.strategicChoiceCompleted,
    diary: state.diaryCompleted
  };
}

function saveLongMarchProgress() {
  let progress = {};
  try {
    const stored = localStorage.getItem(LONG_MARCH_PROGRESS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) progress = parsed;
    }
  } catch (error) {
    console.warn("长征总进度数据损坏，已重新建立。", error);
  }
  progress.ruijinCompleted = progress.ruijinCompleted === true || chapterState.diaryCompleted === true;
  if (chapterState.diaryCompleted) {
    progress.yuduUnlocked = true;
    progress.unlockedLocation = "yudu";
    const unlockedLocations = Array.isArray(progress.unlockedLocations) ? progress.unlockedLocations : ["ruijin"];
    progress.unlockedLocations = [...new Set([...unlockedLocations, "ruijin", "yudu"])];
  } else if (typeof progress.unlockedLocation !== "string") {
    progress.unlockedLocation = "ruijin";
  }
  localStorage.setItem(LONG_MARCH_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

function saveChapterState() {
  try {
    localStorage.setItem(CHAPTER_STATE_STORAGE_KEY, JSON.stringify(chapterState));
    saveLongMarchProgress();
    return true;
  } catch (error) {
    console.error("无法保存第一章进度。", error);
    return false;
  }
}

function clearRuijinCompletionFromLongMarchProgress() {
  try {
    const stored = localStorage.getItem(LONG_MARCH_PROGRESS_STORAGE_KEY);
    if (!stored) return;
    const progress = JSON.parse(stored);
    if (!progress || typeof progress !== "object" || Array.isArray(progress)) return;
    progress.ruijinCompleted = false;
    localStorage.setItem(LONG_MARCH_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.warn("重置瑞金章节时无法更新总进度，已保留其他章节数据。", error);
  }
}

async function resetCurrentChapter() {
  if (!await window.LongMarchUI.confirmReset("确定重新开始本章吗？")) return;
  chapterResetInProgress = true;
  localStorage.removeItem(CHAPTER_STATE_STORAGE_KEY);
  clearRuijinCompletionFromLongMarchProgress();
  chapterState = defaultChapterState();

  const initialUrl = new URL(location.href);
  initialUrl.searchParams.delete("scene");
  initialUrl.searchParams.delete("resetProgress");
  location.replace(initialUrl.href);
}

function renderChapterProgress() {
  const progress = calculateChapterProgress();
  const seenMeetingCount = REQUIRED_MEETING_CHARACTERS.filter(id => chapterState.meetingCharactersSeen.includes(id)).length;
  const completedCount = Object.values(progress).filter(Boolean).length;
  chapterProgressCount.textContent = `探索 ${completedCount}/4`;
  meetingCharacterCount.textContent = `${seenMeetingCount}/${REQUIRED_MEETING_CHARACTERS.length}`;
  for (const item of chapterProgressList.querySelectorAll("[data-progress-key]")) {
    const completed = progress[item.dataset.progressKey] === true;
    item.classList.toggle("completed", completed);
    item.setAttribute("aria-label", `${item.textContent.trim()}，${completed ? "已完成" : "未完成"}`);
  }
  updateRoadAccess();
  updateDoorAccess();
  updateMeetingStageUI();
}

function updateChapterState(patch) {
  chapterState = sanitizeChapterState({ ...chapterState, ...patch });
  renderChapterProgress();
  saveChapterState();
  return { ...chapterState, meetingCharactersSeen: [...chapterState.meetingCharactersSeen] };
}

function updateCurrentChapterScene(engineSceneId, shouldSave = true) {
  chapterState.currentScene = CHAPTER_SCENE_BY_ENGINE_SCENE[engineSceneId] || "village";
  if (shouldSave) saveChapterState();
}

function isVillageBriefingComplete() {
  return chapterState.villageCivilianSeen && chapterState.villageSoldierSeen;
}

function updateRoadAccess() {
  const unlocked = isVillageBriefingComplete();
  roadHotspot.classList.toggle("unlocked", unlocked);
  roadHotspot.classList.toggle("locked", !unlocked);
  roadHotspot.dataset.access = unlocked ? "unlocked" : "locked";
  roadHotspot.setAttribute("aria-label", unlocked ? "前往杨氏宗祠" : "道路入口尚未开放");
  roadPrompt.textContent = unlocked ? "前往杨氏宗祠" : "";
}

function updateDoorAccess() {
  const unlocked = chapterState.messengerSeen === true;
  doorHotspot.classList.toggle("unlocked", unlocked);
  doorHotspot.classList.toggle("locked", !unlocked);
  doorHotspot.dataset.access = unlocked ? "unlocked" : "locked";
  doorHotspot.setAttribute("aria-label", unlocked ? "进入宗祠" : "宗祠入口尚未开放");
  doorPrompt.textContent = unlocked ? "进入宗祠" : "";
}

function isMeetingStageComplete() {
  return REQUIRED_MEETING_CHARACTERS.every(id => chapterState.meetingCharactersSeen.includes(id));
}

function logMeetingDecisionState() {
  const completion = Object.fromEntries(REQUIRED_MEETING_CHARACTERS.map(id => [
    id,
    chapterState.meetingCharactersSeen.includes(id)
  ]));
  const signature = REQUIRED_MEETING_CHARACTERS.map(id => Number(completion[id])).join("");
  if (signature === lastMeetingDebugSignature) return;
  lastMeetingDebugSignature = signature;

  console.groupCollapsed("当前五个人物完成状态");
  for (const id of REQUIRED_MEETING_CHARACTERS) {
    console.log(`${MEETING_CHARACTER_LABELS[id]}：${completion[id]}`);
  }
  const incompleteNames = REQUIRED_MEETING_CHARACTERS
    .filter(id => !completion[id])
    .map(id => MEETING_CHARACTER_LABELS[id]);
  console.log(`参与最后决策 disabled 属性：${strategicDecisionButton.disabled}`);
  console.log(`参与最后决策访问状态：${strategicDecisionButton.dataset.access || "尚未刷新"}`);
  console.log(`当前无法进入原因：${incompleteNames.length ? `尚未完成：${incompleteNames.join("、")}` : "无"}`);
  if (incompleteNames.length === 0) {
    console.info("所有参会人物已了解，开放战略决策");
  }
  console.groupEnd();
}

function updateMeetingStageUI() {
  const interiorVisible = currentSceneId === "yang-ancestral-hall-interior";
  const completed = isMeetingStageComplete();
  const decisionAvailable = interiorVisible && completed;
  meetingSummaryButton.classList.toggle("scene-visible", interiorVisible);
  meetingSummaryButton.classList.toggle("seen", chapterState.meetingSummarySeen);
  meetingSummaryButton.setAttribute("aria-label", chapterState.meetingSummarySeen ? "重新查看背景梳理，已完成" : "查看背景梳理");
  strategicDecisionButton.classList.toggle("scene-visible", decisionAvailable);
  strategicDecisionButton.classList.toggle("unlocked", completed);
  strategicDecisionButton.classList.toggle("locked", !completed);
  strategicDecisionButton.dataset.access = completed ? "unlocked" : "locked";
  strategicDecisionButton.disabled = !decisionAvailable;
  strategicDecisionButton.setAttribute("aria-hidden", decisionAvailable ? "false" : "true");
  strategicDecisionLabel.textContent = getFinaleEntryLabel();
  strategicDecisionButton.setAttribute("aria-label", getFinaleEntryLabel());
  viewport.classList.toggle("decision-ready", decisionAvailable);
  for (const hotspot of meetingCharacterHotspots) {
    hotspot.classList.toggle("seen", chapterState.meetingCharactersSeen.includes(hotspot.dataset.characterId));
  }
  logMeetingDecisionState();
}

function showSceneNotice(message) {
  clearTimeout(sceneNoticeTimer);
  sceneNotice.textContent = message;
  sceneNotice.classList.add("visible");
  sceneNoticeTimer = window.setTimeout(() => sceneNotice.classList.remove("visible"), 2600);
}

function setupChapterNavigationUI() {
  renderChapterProgress();
  chapterProgressToggle.addEventListener("click", () => {
    const expanded = !chapterProgress.classList.contains("expanded");
    chapterProgress.classList.toggle("expanded", expanded);
    chapterProgressToggle.setAttribute("aria-expanded", String(expanded));
    chapterProgressList.setAttribute("aria-hidden", String(!expanded));
  });
  resetChapterButton.addEventListener("click", resetCurrentChapter);
}

const DEG = Math.PI / 180;
const RADIUS = 10;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smoothstep = value => value * value * (3 - 2 * value);
const easeInOutCubic = value => value < 0.5
  ? 4 * value * value * value
  : 1 - Math.pow(-2 * value + 2, 3) / 2;

let config;
let dialogueData;
let hotspotData;
let archiveData = [];
let archiveById = new Map();
let archiveKeywordEntries = [];
let renderer;
let threeScene;
let threeCamera;
let panoramaGeometry;
let panoramaMesh;
let video;
let videoTexture;
let ambientAudio;
let ambientAvailable = true;
let audioStarted = false;
let chapterMusic;
let chapterMusicStarted = false;
let chapterMusicFadeFrame = 0;
let pingPongController;
let arcRadians;
let edgeGuard;
let pitchLimit;
let baseVFov;
let viewVFov;
let viewHFov;
let cylinderHeight;
let dialogueOpen = false;
let pageVisible = !document.hidden;
let renderHandle = 0;
let frameDirty = true;
let firstRender = true;
let currentSceneId;
let activeTransition;
let transitionCueAudio;
let activeDialogueType = null;
let dialoguePage = 0;
let dialogueWasSeen = false;
let dialogueUseRecap = false;
let dialogueReturnHotspot = villagerHotspot;
let sceneNoticeTimer = 0;
let finaleOpen = false;
let finaleBusy = false;
let selectedStrategy = null;
let diaryQuestionIndex = 0;
let diaryQuestionSolved = false;
let telegramTimerIds = [];
let lastMeetingDebugSignature = "";
let hoveredCharacterHit = null;
let narrationActive = false;
let archiveOpen = false;
let archiveReturnFocus = null;
let archiveImageViewerOpen = false;
let archiveImageReturnFocus = null;

const preloadedScenes = new Map();
const sceneTransitions = new Map();
const watchedVideos = new WeakSet();
const characterHitMeshes = [];
const characterRaycaster = new THREE.Raycaster();
const characterPointer = new THREE.Vector2();
const cameraState = {
  yaw: 0,
  pitch: 0,
  zoom: 1,
  targetYaw: 0,
  targetPitch: 0,
  targetZoom: 1,
  dragging: false,
  pointerId: null,
  startX: 0,
  startY: 0,
  originYaw: 0,
  originPitch: 0,
  dragMoved: false
};

const waitForNarration = duration => new Promise(resolve => window.setTimeout(resolve, duration));

function setupChapterMusic() {
  if (chapterMusic) return chapterMusic;
  chapterMusic = new Audio(CHAPTER_MUSIC_SOURCE);
  chapterMusic.id = "ruijin-chapter-music";
  chapterMusic.hidden = true;
  chapterMusic.loop = true;
  chapterMusic.preload = "auto";
  chapterMusic.volume = CHAPTER_MUSIC_LEVELS.opening;
  chapterMusic.dataset.context = "chapter-opening";
  chapterMusic.dataset.targetVolume = chapterMusic.volume.toFixed(2);
  chapterMusic.dataset.playbackMode = "continuous-loop";
  chapterMusic.setAttribute("playsinline", "");
  chapterMusic.addEventListener("play", () => {
    chapterMusicStarted = true;
    chapterMusic.dataset.state = "playing";
  });
  chapterMusic.addEventListener("pause", () => {
    chapterMusic.dataset.state = chapterMusicStarted ? "paused" : "ready";
  });
  chapterMusic.addEventListener("error", () => {
    chapterMusic.dataset.state = "error";
    console.warn("瑞金篇主题音乐加载失败，场景与互动仍可继续。", chapterMusic.error);
  });
  document.body.appendChild(chapterMusic);
  chapterMusic.load();
  return chapterMusic;
}

function setChapterMusicLevel(context, targetVolume, duration = 700) {
  if (!chapterMusic) return;
  cancelAnimationFrame(chapterMusicFadeFrame);
  const target = clamp(targetVolume, 0, 1);
  const startVolume = chapterMusic.volume;
  chapterMusic.dataset.context = context;
  chapterMusic.dataset.targetVolume = target.toFixed(2);
  if (duration <= 0 || Math.abs(startVolume - target) < 0.005) {
    chapterMusic.volume = target;
    return;
  }
  const startedAt = performance.now();
  const update = now => {
    const progress = clamp((now - startedAt) / duration, 0, 1);
    chapterMusic.volume = startVolume + (target - startVolume) * smoothstep(progress);
    if (progress < 1 && pageVisible) chapterMusicFadeFrame = requestAnimationFrame(update);
  };
  chapterMusicFadeFrame = requestAnimationFrame(update);
}

function getChapterMusicContext() {
  if (dialogueOpen) return ["dialogue", CHAPTER_MUSIC_LEVELS.dialogue];
  if (narrationActive) {
    const ending = chapterNarration.classList.contains("ending");
    return ending
      ? ["ending-narration", CHAPTER_MUSIC_LEVELS.ending]
      : ["opening-narration", CHAPTER_MUSIC_LEVELS.opening];
  }
  if (finaleOpen) {
    const stage = chapterFinalePanel.dataset.stage;
    return stage === "decision"
      ? ["strategic-decision", CHAPTER_MUSIC_LEVELS.decision]
      : [`chapter-finale-${stage || "flow"}`, CHAPTER_MUSIC_LEVELS.finale];
  }
  if (currentSceneId === "yang-ancestral-hall-interior") return ["meeting", CHAPTER_MUSIC_LEVELS.meeting];
  if (currentSceneId === "yang-ancestral-hall-exterior") return ["hall-exterior", CHAPTER_MUSIC_LEVELS.exterior];
  return ["village", CHAPTER_MUSIC_LEVELS.village];
}

function syncChapterMusicForContext(duration = 700) {
  const [context, level] = getChapterMusicContext();
  setChapterMusicLevel(context, level, duration);
}

async function tryStartChapterMusic(userInitiated = false) {
  setupChapterMusic();
  if (!pageVisible || !chapterMusic.paused) return true;
  if (!chapterMusicStarted && chapterMusic.currentTime < 0.1) chapterMusic.currentTime = 0;
  chapterMusic.dataset.startReason = userInitiated ? "user-interaction" : "chapter-start";
  try {
    await chapterMusic.play();
    return true;
  } catch {
    chapterMusic.dataset.state = "waiting-for-interaction";
    return false;
  }
}

function narrationLineDuration(text) {
  const readableCharacters = text.replace(/\s/g, "").length;
  return clamp(2350 + readableCharacters * 28, 2500, 3600);
}

async function runChapterNarration(mode, lines) {
  narrationActive = true;
  let skipRequested = false;
  let continueRequested = false;
  let wakeNarration = null;
  const waitOrControl = duration => new Promise(resolve => {
    const timer = Number.isFinite(duration) ? window.setTimeout(done, duration) : null;
    function done() {
      if (timer) window.clearTimeout(timer);
      if (wakeNarration === done) wakeNarration = null;
      resolve();
    }
    wakeNarration = done;
  });
  const handleNarrationControl = () => {
    if (!narrationActive) return;
    if (continueRequested) {
      wakeNarration?.();
      return;
    }
    skipRequested = true;
    wakeNarration?.();
  };
  setChapterMusicLevel(
    mode === "ending" ? "ending-narration" : "opening-narration",
    mode === "ending" ? CHAPTER_MUSIC_LEVELS.ending : CHAPTER_MUSIC_LEVELS.opening,
    mode === "ending" ? 900 : 0
  );
  tryStartChapterMusic(false);
  setHoveredCharacter(null);
  document.documentElement.classList.add("narration-active");
  chapterNarration.className = `chapter-narration ${mode}`;
  chapterNarration.setAttribute("aria-hidden", "false");
  chapterNarrationLines.replaceChildren();
  skipNarration.textContent = "跳过";
  skipNarration.hidden = false;
  skipNarration.addEventListener("click", handleNarrationControl);

  const lineElements = lines.map(text => {
    const line = document.createElement("p");
    line.className = "chapter-narration-line";
    line.textContent = text;
    chapterNarrationLines.appendChild(line);
    return line;
  });

  await waitForNarration(60);
  chapterNarration.classList.add("active");
  await waitForNarration(560);
  for (let index = 0; index < lineElements.length; index += 1) {
    if (skipRequested) break;
    lineElements[index].classList.add("revealed");
    if (mode === "ending" && index === lineElements.length - 1) {
      setChapterMusicLevel("ending-climax", CHAPTER_MUSIC_LEVELS.endingClimax, 1400);
    }
    await waitOrControl(narrationLineDuration(lines[index]));
  }
  if (skipRequested) lineElements.forEach(line => line.classList.add("revealed"));
  await waitOrControl(skipRequested ? 120 : (mode === "opening" ? 4200 : 4000));
  lineElements.forEach(line => line.classList.add("revealed"));
  continueRequested = true;
  skipNarration.textContent = "继续";
  await waitOrControl(Number.POSITIVE_INFINITY);
  skipNarration.removeEventListener("click", handleNarrationControl);
  skipNarration.hidden = true;
  chapterNarration.classList.add("leaving");
  await waitForNarration(2050);

  chapterNarration.className = "chapter-narration";
  chapterNarration.setAttribute("aria-hidden", "true");
  chapterNarrationLines.replaceChildren();
  document.documentElement.classList.remove("narration-active");
  narrationActive = false;
  syncChapterMusicForContext(mode === "ending" ? 1800 : 1100);
}

async function playOpeningNarrationIfNeeded() {
  if (chapterState.openingNarrationSeen || currentSceneId !== config.id) return false;
  await runChapterNarration("opening", OPENING_NARRATION);
  updateChapterState({ openingNarrationSeen: true });
  return true;
}

async function freezeInteriorOnFinalFrame() {
  const interiorVideo = getSceneVideo("yang-ancestral-hall-interior");
  if (!interiorVideo) return;
  interiorVideo.pause();
  if (Number.isFinite(interiorVideo.duration) && interiorVideo.duration > 0.2) {
    const finalFrameTime = Math.max(0, interiorVideo.duration - 0.08);
    if (Math.abs(interiorVideo.currentTime - finalFrameTime) > 0.04) {
      await new Promise(resolve => {
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          interiorVideo.removeEventListener("seeked", finish);
          resolve();
        };
        interiorVideo.addEventListener("seeked", finish, { once: true });
        interiorVideo.currentTime = finalFrameTime;
        window.setTimeout(finish, 650);
      });
    }
  }
  interiorVideo.pause();
  frameDirty = true;
  firstRender = true;
  startRenderLoop();
  await waitForNarration(80);
}

async function playEndingNarrationIfNeeded() {
  if (chapterState.endingNarrationSeen || !chapterState.diaryCompleted || currentSceneId !== "yang-ancestral-hall-interior") return false;
  narrationActive = true;
  finaleOpen = false;
  chapterFinale.classList.remove("open");
  chapterFinale.setAttribute("aria-hidden", "true");
  viewport.classList.remove("in-finale");
  await runChapterNarration("transition", TRANSFER_INTERTITLE);
  await freezeInteriorOnFinalFrame();
  await runChapterNarration("ending", ENDING_NARRATION);
  updateChapterState({ endingNarrationSeen: true });
  showChapterComplete();
  return true;
}

function showChapterComplete() {
  let panel = document.getElementById("ruijinChapterComplete");
  if (!panel) {
    panel = document.createElement("section");
    panel.id = "ruijinChapterComplete";
    panel.className = "ruijin-chapter-complete";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "ruijinCompleteTitle");
    panel.innerHTML = `<article><p>第一章 · 瑞金</p><h2 id="ruijinCompleteTitle">告别故乡，踏上征途</h2><p>从五月的筹划，到十月的战略转移，<br>保存主力、摆脱困境，成为中央红军面临的紧迫任务。</p><p>本章结束 · 下一站：于都</p><button type="button" data-complete="review">返回本章探索</button><button type="button" data-complete="map">返回长征地图</button></article>`;
    panel.addEventListener("click", event => {
      const action = event.target.closest("[data-complete]")?.dataset.complete;
      if (action === "review") {
        panel.hidden = true;
        viewport.classList.remove("in-finale");
        tryStartMedia(true);
      }
      if (action === "map") {
        window.LongMarchTeaching?.prepareLeave?.();
        if (window.parent !== window) window.parent.postMessage({ type:"longMarch:closeScene", scene:"ruijin" }, "*");
        else location.href = "../../index.html";
      }
    });
    document.body.appendChild(panel);
  }
  panel.hidden = false;
  viewport.classList.add("in-finale");
  panel.querySelector("button").focus({ preventScroll:true });
}

class RuntimePingPong {
  constructor(media, texture) {
    this.media = media;
    this.texture = texture;
    this.direction = "forward";
    this.reverseStartWall = 0;
    this.reverseStartTime = 0;
    this.lastSeekWall = 0;
    this.suspended = false;
    this.onTimeUpdate = () => {
      if (this.direction === "forward" && Number.isFinite(media.duration) && media.currentTime >= media.duration - 0.055) {
        this.beginReverse();
      }
      if (this.direction === "native-reverse" && media.currentTime <= 0.045) this.beginForward();
    };
    media.loop = false;
    media.addEventListener("timeupdate", this.onTimeUpdate);
    media.addEventListener("ended", () => this.beginReverse());
    media.addEventListener("seeked", () => {
      texture.needsUpdate = true;
      frameDirty = true;
    });
  }

  async start() {
    this.direction = "forward";
    this.media.playbackRate = 1;
    try { await this.media.play(); } catch { /* muted autoplay retries on interaction */ }
  }

  async beginReverse() {
    if (this.direction !== "forward") return;
    this.media.pause();
    const startTime = Math.min(this.media.currentTime, Math.max(0, this.media.duration - 0.025));
    try {
      this.media.playbackRate = -1;
      if (this.media.playbackRate < 0) {
        this.direction = "native-reverse";
        await this.media.play();
        return;
      }
    } catch { /* Blink rejects negative playbackRate */ }
    this.media.playbackRate = 1;
    this.direction = "manual-reverse";
    this.reverseStartTime = startTime;
    this.reverseStartWall = performance.now();
    this.lastSeekWall = 0;
  }

  async beginForward() {
    this.direction = "forward";
    this.media.playbackRate = 1;
    this.media.currentTime = 0.001;
    frameDirty = true;
    if (pageVisible) {
      try { await this.media.play(); } catch { /* retry on interaction */ }
    }
  }

  update(now) {
    if (this.direction !== "manual-reverse" || this.suspended) return false;
    const target = this.reverseStartTime - (now - this.reverseStartWall) / 1000;
    if (target <= 0.025) {
      this.beginForward();
      return true;
    }
    if (!this.media.seeking && now - this.lastSeekWall >= 34) {
      this.lastSeekWall = now;
      this.media.currentTime = target;
      return true;
    }
    return false;
  }

  suspend() {
    this.suspended = true;
    this.media.pause();
  }

  resume() {
    this.suspended = false;
    if (this.direction === "forward" || this.direction === "native-reverse") {
      this.media.play().catch(() => {});
    } else {
      this.reverseStartTime = this.media.currentTime;
      this.reverseStartWall = performance.now();
    }
  }
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`无法加载 ${path}`);
  return response.json();
}

async function loadChapter() {
  config = await fetchJson("assets/chapter.json");
  currentSceneId = config.id;
  const archivePath = config.data.archives;
  const [loadedHotspots, loadedDialogue, loadedArchives] = await Promise.all([
    fetchJson(config.data.hotspots),
    fetchJson(config.data.dialogue),
    archivePath ? fetchJson(archivePath) : Promise.resolve({ archives: [] })
  ]);
  hotspotData = loadedHotspots;
  dialogueData = loadedDialogue;
  archiveData = Array.isArray(loadedArchives?.archives) ? loadedArchives.archives : [];
  archiveById = new Map(archiveData.map(record => [record.id, record]));
  archiveKeywordEntries = archiveData.flatMap(record => {
    const keywords = Array.isArray(record.keywords) ? record.keywords : [record.title];
    return [...new Set([record.title, ...keywords])]
      .filter(keyword => typeof keyword === "string" && keyword.trim())
      .map(keyword => ({ keyword, archive: record }));
  }).sort((left, right) => right.keyword.length - left.keyword.length);
}

function configurePanoramaTexture(texture) {
  window.LongMarchVideoColor.configureTexture(THREE, texture);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(8, renderer?.capabilities?.getMaxAnisotropy?.() || 1);
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.x = -1;
  texture.offset.x = 1;
  texture.needsUpdate = true;
  return texture;
}

function getSceneCylinderHeight(sceneId = currentSceneId) {
  const aspect = findSceneConfig(sceneId)?.panorama?.mediaAspect;
  return Number.isFinite(aspect) && aspect > 0 ? RADIUS * arcRadians / aspect : cylinderHeight;
}

function createPanoramaMesh(texture, opacity = 1, sceneId = currentSceneId) {
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    toneMapped: false,
    transparent: opacity < 1,
    opacity,
    depthWrite: opacity >= 1
  });
  window.LongMarchVideoColor.prepareMaterial(THREE, material);
  const mesh = new THREE.Mesh(panoramaGeometry, material);
  mesh.scale.y = getSceneCylinderHeight(sceneId) / cylinderHeight;
  return mesh;
}

function loadPanoramaTexture(source, errorMessage = "场景备用背景加载失败") {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader().load(
      source,
      texture => resolve(configurePanoramaTexture(texture)),
      undefined,
      () => reject(new Error(`${errorMessage}：${source}`))
    );
  });
}

function releaseVideoElement(media) {
  if (!media) return;
  media.pause();
  media.removeAttribute("src");
  media.load();
  media.remove();
}

function activateSceneFallback(prepared) {
  if (!prepared?.fallbackTexture || prepared.usingFallback) return false;
  const failedTexture = prepared.texture;
  const fallbackTexture = prepared.fallbackTexture;
  releaseVideoElement(prepared.video);
  prepared.video = null;
  prepared.texture = fallbackTexture;
  prepared.fallbackTexture = null;
  prepared.usingFallback = true;

  if (currentSceneId === prepared.scene.id && panoramaMesh?.material.map === failedTexture) {
    panoramaMesh.material.map = fallbackTexture;
    panoramaMesh.material.needsUpdate = true;
    canvas.dataset.backgroundTexture = "FallbackTexture";
  }
  if (activeTransition?.target.id === prepared.scene.id && activeTransition.targetMesh.material.map === failedTexture) {
    activeTransition.targetMesh.material.map = fallbackTexture;
    activeTransition.targetMesh.material.needsUpdate = true;
  }
  failedTexture?.dispose();
  frameDirty = true;
  console.warn(`场景 ${prepared.scene.id} 的视频加载失败，已切换静态备用背景。`);
  return true;
}

function preloadSceneAssets(scene) {
  if (!scene?.texture && !scene?.video?.source) return Promise.reject(new Error("下一场景未配置背景资源"));
  if (preloadedScenes.has(scene.id)) return Promise.resolve(preloadedScenes.get(scene.id));

  const finish = prepared => {
    if (scene.audio?.source) {
      prepared.audio = new Audio(scene.audio.source);
      prepared.audio.preload = "auto";
      prepared.audio.load();
    }
    preloadedScenes.set(scene.id, prepared);
    canvas.dataset.preloadedScenes = Array.from(preloadedScenes.keys()).join(",");
    return prepared;
  };

  if (scene.video?.source) {
    const fallbackPromise = scene.fallbackTexture
      ? loadPanoramaTexture(scene.fallbackTexture).catch(error => {
          console.warn(error.message);
          return null;
        })
      : Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const sceneVideo = document.createElement("video");
      sceneVideo.id = `${scene.id}-video`;
      sceneVideo.hidden = true;
      sceneVideo.muted = true;
      sceneVideo.defaultMuted = true;
      sceneVideo.loop = scene.video.loop !== false;
      sceneVideo.playsInline = true;
      sceneVideo.preload = "auto";
      sceneVideo.autoplay = false;
      sceneVideo.controls = false;
      sceneVideo.disablePictureInPicture = true;
      sceneVideo.setAttribute("playsinline", "");
      sceneVideo.setAttribute("webkit-playsinline", "");
      sceneVideo.dataset.scene = scene.id;
      sceneVideo.dataset.playbackMode = scene.video.playbackMode || "seamless-loop";
      sceneVideo.dataset.desiredSound = scene.video.muted === false ? "on" : "muted";
      document.body.appendChild(sceneVideo);

      const onReady = async () => {
        cleanup();
        const sceneVideoTexture = configurePanoramaTexture(new THREE.VideoTexture(sceneVideo));
        sceneVideoTexture.userData.scene = scene.id;
        sceneVideo.dataset.duration = sceneVideo.duration.toFixed(3);
        sceneVideo.dataset.size = `${sceneVideo.videoWidth}x${sceneVideo.videoHeight}`;
        const fallbackTexture = await fallbackPromise;
        const prepared = finish({ scene, texture: sceneVideoTexture, video: sceneVideo, audio: null, fallbackTexture, usingFallback: false });
        sceneVideo.addEventListener("error", () => activateSceneFallback(prepared));
        resolve(prepared);
      };
      const onError = async () => {
        cleanup();
        releaseVideoElement(sceneVideo);
        const fallbackTexture = await fallbackPromise;
        if (fallbackTexture) {
          resolve(finish({ scene, texture: fallbackTexture, video: null, audio: null, fallbackTexture: null, usingFallback: true }));
          console.warn(`无法预载下一场景视频：${scene.video.source}，已使用静态备用背景。`);
          return;
        }
        reject(new Error(`无法预载下一场景视频且备用背景不可用：${scene.video.source}`));
      };
      const cleanup = () => {
        sceneVideo.removeEventListener("loadeddata", onReady);
        sceneVideo.removeEventListener("error", onError);
      };
      sceneVideo.addEventListener("loadeddata", onReady, { once: true });
      sceneVideo.addEventListener("error", onError, { once: true });
      sceneVideo.src = scene.video.source;
      sceneVideo.load();
    });
  }

  return loadPanoramaTexture(scene.texture, "无法预载下一场景")
    .then(texture => finish({ scene, texture, video: null, audio: null }));
}

function loadBackgroundVideo() {
  return new Promise((resolve, reject) => {
    video = document.createElement("video");
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.autoplay = chapterState.currentScene === "village";
    video.disablePictureInPicture = true;
    video.id = "ruijin-background-video";
    video.hidden = true;
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    document.body.appendChild(video);

    const candidates = [
      config.video.pingPong
        ? { source: config.video.pingPong, playbackMode: "preprocessed-ping-pong" }
        : null,
      {
        source: config.video.source,
        playbackMode: config.video.loop !== false ? "seamless-loop" : "runtime-ping-pong"
      }
    ].filter(Boolean);
    let index = 0;

    const cleanup = () => {
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("error", onError);
    };
    const onReady = () => {
      cleanup();
      video.dataset.duration = video.duration.toFixed(3);
      video.dataset.size = `${video.videoWidth}x${video.videoHeight}`;
      resolve(candidates[index]);
    };
    const onError = () => {
      cleanup();
      index += 1;
      if (index >= candidates.length) {
        reject(new Error("背景视频加载失败"));
        return;
      }
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.src = candidates[index].source;
      video.load();
    };

    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.src = candidates[index].source;
    video.load();
  });
}

function setupThree(playbackMode) {
  arcRadians = config.panorama.arcDegrees * DEG;
  edgeGuard = config.panorama.edgeGuardDegrees * DEG;
  pitchLimit = config.panorama.pitchLimitDegrees * DEG;
  baseVFov = config.panorama.baseVerticalFovDegrees * DEG;
  cameraState.yaw = config.panorama.initialYawDegrees * DEG;
  cameraState.targetYaw = cameraState.yaw;

  renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x17150f, 1);

  threeScene = new THREE.Scene();
  threeCamera = new THREE.PerspectiveCamera(config.panorama.baseVerticalFovDegrees, 1, 0.1, 50);
  threeCamera.rotation.order = "YXZ";

  videoTexture = configurePanoramaTexture(new THREE.VideoTexture(video));
  canvas.dataset.backgroundTexture = "VideoTexture";
  canvas.dataset.currentScene = config.id;
  configureSceneVideoElement(video, config, false);

  const videoAspect = video.videoWidth / Math.max(video.videoHeight, 1);
  cylinderHeight = RADIUS * arcRadians / videoAspect;
  panoramaGeometry = new THREE.CylinderGeometry(
    RADIUS, RADIUS, cylinderHeight, 112, 1, true,
    Math.PI - arcRadians / 2, arcRadians
  );
  panoramaMesh = createPanoramaMesh(videoTexture);
  threeScene.add(panoramaMesh);

  if (playbackMode === "preprocessed-ping-pong") {
    video.loop = true;
    video.dataset.playbackMode = "preprocessed-ping-pong";
  } else if (playbackMode === "seamless-loop") {
    video.loop = true;
    video.dataset.playbackMode = "seamless-loop";
  } else {
    pingPongController = new RuntimePingPong(video, videoTexture);
    video.dataset.playbackMode = "runtime-ping-pong-fallback";
  }
  resizeRenderer();
  watchVideoFrames(video);
}

function watchVideoFrames(media) {
  if (!media || !("requestVideoFrameCallback" in media) || watchedVideos.has(media)) return;
  watchedVideos.add(media);
  const onFrame = () => {
    frameDirty = true;
    media.requestVideoFrameCallback(onFrame);
  };
  media.requestVideoFrameCallback(onFrame);
}

function getSceneVideo(sceneId = currentSceneId) {
  if (sceneId === config.id) return video;
  return preloadedScenes.get(sceneId)?.video || null;
}

function findSceneConfig(sceneId) {
  if (sceneId === config.id) return config;
  for (const transition of config.transitions || []) {
    if (transition.target?.id === sceneId) return transition.target;
  }
  return null;
}

function configureSceneVideoElement(sceneVideo, scene, preloadOnly = false) {
  if (!sceneVideo || !scene?.video) return;
  const wantsSound = scene.video.muted === false;
  sceneVideo.loop = scene.video.loop !== false;
  sceneVideo.playsInline = scene.video.playsInline !== false;
  sceneVideo.volume = 1;
  sceneVideo.muted = preloadOnly || !wantsSound;
  sceneVideo.defaultMuted = sceneVideo.muted;
  sceneVideo.dataset.desiredSound = wantsSound ? "on" : "muted";
  sceneVideo.dataset.soundState = wantsSound
    ? (preloadOnly ? "preloaded-muted" : "sound-on")
    : "muted";
}

async function playPreparedSceneVideo(prepared, allowMutedFallback = true) {
  if (!prepared?.video) return false;
  const sceneVideo = prepared.video;
  const wantsSound = prepared.scene?.video?.muted === false;
  configureSceneVideoElement(sceneVideo, prepared.scene, false);
  watchVideoFrames(sceneVideo);
  try {
    await sceneVideo.play();
    sceneVideo.dataset.state = "playing";
    return true;
  } catch (error) {
    if (!wantsSound || !allowMutedFallback) return false;
    sceneVideo.muted = true;
    sceneVideo.defaultMuted = true;
    sceneVideo.dataset.soundState = "waiting-for-interaction";
    try {
      await sceneVideo.play();
      sceneVideo.dataset.state = "playing-muted-until-interaction";
      return true;
    } catch {
      return false;
    }
  }
}

function restoreSavedScene() {
  const requestedEngineScene = ENGINE_SCENE_BY_CHAPTER_SCENE[chapterState.currentScene] || config.id;
  if (requestedEngineScene === config.id) {
    currentSceneId = config.id;
    canvas.dataset.currentScene = config.id;
    updateCurrentChapterScene(config.id, false);
    return true;
  }

  const target = findSceneConfig(requestedEngineScene);
  const prepared = preloadedScenes.get(requestedEngineScene);
  if (!target || !prepared) {
    console.warn(`无法恢复场景 ${chapterState.currentScene}，已回到瑞金村庄。`);
    chapterState.currentScene = "village";
    currentSceneId = config.id;
    canvas.dataset.currentScene = config.id;
    saveChapterState();
    return false;
  }

  video.pause();
  pingPongController?.suspend();
  for (const [sceneId, item] of preloadedScenes) {
    if (sceneId !== requestedEngineScene) item.video?.pause();
  }

  const restoredMesh = createPanoramaMesh(prepared.texture, 1, target.id);
  threeScene.remove(panoramaMesh);
  panoramaMesh.material.dispose();
  panoramaMesh = restoredMesh;
  threeScene.add(panoramaMesh);
  threeCamera.position.set(0, 0, 0);
  currentSceneId = target.id;
  canvas.dataset.currentScene = target.id;
  canvas.dataset.backgroundTexture = prepared.video ? "VideoTexture" : "Texture";
  sceneCaption.textContent = target.caption || sceneCaption.textContent;
  sceneTitle.textContent = target.title || sceneTitle.textContent;
  if (prepared.video) {
    configureSceneVideoElement(prepared.video, target, false);
    watchVideoFrames(prepared.video);
  }
  switchSceneAudio(target.audio, prepared.audio);
  updateCurrentChapterScene(target.id, false);
  syncChapterMusicForContext(0);
  frameDirty = true;
  return true;
}

function resizeRenderer() {
  if (!renderer || !threeCamera) return;
  const width = Math.max(1, viewport.clientWidth);
  const height = Math.max(1, viewport.clientHeight);
  renderer.setSize(width, height, false);
  updateViewFov();
  threeCamera.aspect = width / height;
  threeCamera.fov = viewVFov / DEG;
  threeCamera.updateProjectionMatrix();
  frameDirty = true;
}

function updateViewFov() {
  const aspect = Math.max(viewport.clientWidth / Math.max(viewport.clientHeight, 1), 0.6);
  viewVFov = baseVFov / cameraState.zoom;
  viewHFov = Math.min(2 * Math.atan(Math.tan(viewVFov / 2) * aspect), 88 * DEG);
}

function maxYaw() {
  return Math.max(0, arcRadians / 2 - viewHFov / 2 - edgeGuard);
}

function imagePointToWorld(u, v, sceneId = currentSceneId) {
  const geometryU = 1 - u;
  const theta = Math.PI - arcRadians / 2 + geometryU * arcRadians;
  return new THREE.Vector3(RADIUS * Math.sin(theta), (0.5 - v) * getSceneCylinderHeight(sceneId), RADIUS * Math.cos(theta));
}

function expandCharacterBounds(bounds, scale, leftLimit = 0, rightLimit = 1) {
  const centerU = (bounds.left + bounds.right) / 2;
  const centerV = (bounds.top + bounds.bottom) / 2;
  const width = (bounds.right - bounds.left) * scale;
  const height = (bounds.bottom - bounds.top) * scale;
  return {
    left: Math.max(leftLimit, centerU - width / 2),
    right: Math.min(rightLimit, centerU + width / 2),
    top: Math.max(0, centerV - height / 2),
    bottom: Math.min(1, centerV + height / 2)
  };
}

function addCharacterHitMesh({ sceneId, type, element, bounds, scale, hitBounds }) {
  const area = hitBounds || expandCharacterBounds(bounds, scale);
  const centerU = (area.left + area.right) / 2;
  const centerV = (area.top + area.bottom) / 2;
  const width = Math.max(0.45, RADIUS * arcRadians * (area.right - area.left));
  const height = Math.max(0.9, getSceneCylinderHeight(sceneId) * (area.bottom - area.top));
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  const position = imagePointToWorld(centerU, centerV, sceneId);
  const radialScale = (RADIUS - 0.035) / RADIUS;
  position.x *= radialScale;
  position.z *= radialScale;
  mesh.position.copy(position);
  mesh.lookAt(0, position.y, 0);
  mesh.userData = { sceneId, type, element };
  mesh.name = `character-hit-${type}`;
  threeScene.add(mesh);
  characterHitMeshes.push(mesh);
}

function buildCharacterHitMeshes() {
  addCharacterHitMesh({
    sceneId: config.id,
    type: "civilian",
    element: villagerHotspot,
    bounds: hotspotData.villager.bounds,
    scale: 1.7
  });
  const soldierRecords = soldierHotspots
    .map(element => {
      const key = element.dataset.hotspotKey;
      const record = hotspotData[key];
      return record ? { element, key, record, center: (record.bounds.left + record.bounds.right) / 2 } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.center - b.center);
  for (let index = 0; index < soldierRecords.length; index += 1) {
    const soldier = soldierRecords[index];
    const previous = soldierRecords[index - 1];
    const next = soldierRecords[index + 1];
    const leftLimit = previous ? (previous.center + soldier.center) / 2 + 0.001 : 0;
    const rightLimit = next ? (soldier.center + next.center) / 2 - 0.001 : 1;
    addCharacterHitMesh({
      sceneId: config.id,
      type: "soldier",
      element: soldier.element,
      bounds: soldier.record.bounds,
      scale: 1.65,
      hitBounds: expandCharacterBounds(soldier.record.bounds, 1.65, leftLimit, rightLimit)
    });
  }
  addCharacterHitMesh({
    sceneId: "yang-ancestral-hall-exterior",
    type: "messenger",
    element: messengerHotspot,
    bounds: hotspotData.messenger.bounds,
    scale: 1.7
  });
  for (const element of meetingCharacterHotspots) {
    const characterId = element.dataset.characterId;
    const character = hotspotData.meetingCharacters[characterId];
    if (!character) continue;
    const orderedCharacters = meetingCharacterHotspots
      .map(item => {
        const id = item.dataset.characterId;
        const record = hotspotData.meetingCharacters[id];
        return record ? { id, center: (record.bounds.left + record.bounds.right) / 2 } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.center - b.center);
    const characterIndex = orderedCharacters.findIndex(item => item.id === characterId);
    const previous = orderedCharacters[characterIndex - 1];
    const next = orderedCharacters[characterIndex + 1];
    const center = orderedCharacters[characterIndex].center;
    const leftLimit = previous ? (previous.center + center) / 2 + 0.002 : 0;
    const rightLimit = next ? (center + next.center) / 2 - 0.002 : 1;
    addCharacterHitMesh({
      sceneId: "yang-ancestral-hall-interior",
      type: `meeting:${characterId}`,
      element,
      bounds: character.bounds,
      scale: 1.55,
      hitBounds: expandCharacterBounds(character.bounds, 1.55, leftLimit, rightLimit)
    });
  }
}

function raycastCharacter(clientX, clientY) {
  if (!threeCamera || narrationActive || archiveOpen || activeTransition || dialogueOpen || finaleOpen) return null;
  const rect = viewport.getBoundingClientRect();
  characterPointer.x = ((clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
  characterPointer.y = -((clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1;
  characterRaycaster.setFromCamera(characterPointer, threeCamera);
  const candidates = characterHitMeshes.filter(mesh => mesh.userData.sceneId === currentSceneId);
  return characterRaycaster.intersectObjects(candidates, false)[0]?.object || null;
}

function setHoveredCharacter(mesh) {
  if (hoveredCharacterHit === mesh) return;
  hoveredCharacterHit?.userData.element.classList.remove("ray-hover");
  hoveredCharacterHit = mesh;
  hoveredCharacterHit?.userData.element.classList.add("ray-hover");
  viewport.classList.toggle("character-interaction", Boolean(mesh));
}

function setupCharacterRaycastInteraction() {
  viewport.addEventListener("pointermove", event => {
    if (cameraState.dragging) {
      setHoveredCharacter(null);
      return;
    }
    if (event.target.closest("button, .chapter-finale, .dialogue")) {
      setHoveredCharacter(null);
      return;
    }
    setHoveredCharacter(raycastCharacter(event.clientX, event.clientY));
  });
  viewport.addEventListener("pointerleave", () => setHoveredCharacter(null));
  viewport.addEventListener("click", event => {
    if (cameraState.dragMoved) {
      cameraState.dragMoved = false;
      return;
    }
    if (event.target.closest("button, .chapter-finale, .dialogue")) return;
    const hit = raycastCharacter(event.clientX, event.clientY);
    if (!hit) return;
    openDialogue(hit.userData.type, hit.userData.element);
  });
}

function projectImagePoint(u, v) {
  const world = imagePointToWorld(u, v);
  const direction = new THREE.Vector3();
  threeCamera.getWorldDirection(direction);
  const inFront = world.clone().normalize().dot(direction) > 0;
  const projected = world.clone().project(threeCamera);
  return {
    x: (projected.x * 0.5 + 0.5) * viewport.clientWidth,
    y: (0.5 - projected.y * 0.5) * viewport.clientHeight,
    visible: inFront && Math.abs(projected.x) < 1.18 && Math.abs(projected.y) < 1.25 && projected.z > -1 && projected.z < 1
  };
}

function projectHotspot(element, bounds, minWidth, minHeight, hitScale = 1, acceptsPointer = true) {
  const center = projectImagePoint((bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2);
  if (!center.visible) {
    element.classList.remove("projected");
    element.style.pointerEvents = "none";
    return;
  }
  const points = [
    projectImagePoint(bounds.left, bounds.top), projectImagePoint(bounds.right, bounds.top),
    projectImagePoint(bounds.left, bounds.bottom), projectImagePoint(bounds.right, bounds.bottom)
  ];
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const projectedLeft = Math.max(0, Math.min(...xs));
  const projectedTop = Math.max(0, Math.min(...ys));
  const projectedRight = Math.min(viewport.clientWidth, Math.max(...xs));
  const projectedBottom = Math.min(viewport.clientHeight, Math.max(...ys));
  const centerX = (projectedLeft + projectedRight) / 2;
  const centerY = (projectedTop + projectedBottom) / 2;
  const desiredWidth = Math.max(minWidth, projectedRight - projectedLeft) * hitScale;
  const desiredHeight = Math.max(minHeight, projectedBottom - projectedTop) * hitScale;
  const left = Math.max(0, centerX - desiredWidth / 2);
  const top = Math.max(0, centerY - desiredHeight / 2);
  const right = Math.min(viewport.clientWidth, centerX + desiredWidth / 2);
  const bottom = Math.min(viewport.clientHeight, centerY + desiredHeight / 2);
  element.style.left = `${left}px`;
  element.style.top = `${top}px`;
  element.style.width = `${Math.max(0, right - left)}px`;
  element.style.height = `${Math.max(0, bottom - top)}px`;
  element.style.pointerEvents = !activeTransition && acceptsPointer ? "auto" : "none";
  element.classList.add("projected");
}

function separateHorizontalHotspots(elements, gap = 6) {
  const items = elements
    .filter(element => element.classList.contains("projected"))
    .map(element => {
      const rect = element.getBoundingClientRect();
      return { element, left: rect.left, right: rect.right, center: rect.left + rect.width / 2 };
    })
    .sort((a, b) => a.center - b.center);

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const previous = items[index - 1];
    const next = items[index + 1];
    const leftBoundary = previous ? (previous.center + item.center) / 2 + gap / 2 : 0;
    const rightBoundary = next ? (item.center + next.center) / 2 - gap / 2 : viewport.clientWidth;
    const left = Math.max(item.left, leftBoundary);
    const right = Math.min(item.right, rightBoundary);
    item.element.style.left = `${left}px`;
    item.element.style.width = `${Math.max(24, right - left)}px`;
  }
}

function updateHotspots() {
  const transition = sceneTransitions.get(currentSceneId);
  const activeElements = new Set();
  if (currentSceneId === config.id) {
    activeElements.add(villagerHotspot);
    projectHotspot(villagerHotspot, hotspotData.villager.bounds, 44, 110, 1, false);
    for (const hotspot of soldierHotspots) {
      const soldier = hotspotData[hotspot.dataset.hotspotKey];
      if (!soldier) continue;
      activeElements.add(hotspot);
      projectHotspot(hotspot, soldier.bounds, 44, 130, 1, false);
    }
    if (transition) {
      activeElements.add(roadHotspot);
      projectHotspot(roadHotspot, hotspotData[transition.hotspot].bounds, 90, 130);
    }
  } else if (currentSceneId === "yang-ancestral-hall-exterior" && transition) {
    activeElements.add(messengerHotspot);
    projectHotspot(messengerHotspot, hotspotData.messenger.bounds, 48, 150, 1, false);
    activeElements.add(doorHotspot);
    projectHotspot(doorHotspot, hotspotData[transition.hotspot].bounds, 100, 190);
  } else if (currentSceneId === "yang-ancestral-hall-interior") {
    for (const hotspot of meetingCharacterHotspots) {
      const character = hotspotData.meetingCharacters[hotspot.dataset.characterId];
      if (!character) continue;
      activeElements.add(hotspot);
      projectHotspot(hotspot, character.bounds, 48, 116, 1, false);
    }
    separateHorizontalHotspots(meetingCharacterHotspots);
  }
  for (const element of [villagerHotspot, ...soldierHotspots, roadHotspot, messengerHotspot, doorHotspot, ...meetingCharacterHotspots]) {
    if (activeElements.has(element)) continue;
    element.classList.remove("projected");
    element.style.pointerEvents = "none";
  }
  updateMeetingStageUI();
}

function playTransitionCue(source) {
  if (!source) return;
  transitionCueAudio?.pause();
  transitionCueAudio = new Audio(source);
  transitionCueAudio.volume = 0.26;
  transitionCueAudio.play().catch(() => {});
}

function switchSceneAudio(audioConfig, preparedAudio) {
  ambientAudio?.pause();
  if (!audioConfig?.source) {
    ambientAvailable = false;
    audioStarted = false;
    ambientAudio.volume = clamp(config.audio.volume, 0, 1);
    ambientAudio.dataset.state = "paused-no-target-audio";
    return;
  }
  const replacement = preparedAudio || new Audio(audioConfig.source);
  ambientAudio.remove();
  ambientAudio = replacement;
  ambientAudio.id = "ruijin-ambient-audio";
  ambientAudio.hidden = true;
  ambientAudio.loop = true;
  ambientAudio.preload = "auto";
  ambientAudio.volume = clamp(audioConfig.volume ?? 0.3, 0, 1);
  ambientAudio.dataset.volume = ambientAudio.volume.toFixed(2);
  ambientAudio.dataset.playbackMode = "loop";
  ambientAudio.setAttribute("playsinline", "");
  document.body.appendChild(ambientAudio);
  ambientAvailable = true;
  ambientAudio.play().then(() => {
    audioStarted = true;
    ambientAudio.dataset.state = "playing";
  }).catch(() => {});
}

function finishSceneTransition(state) {
  state.targetMesh.position.set(0, 0, 0);
  state.targetMesh.material.opacity = 1;
  state.targetMesh.material.transparent = false;
  state.targetMesh.material.depthWrite = true;
  state.targetMesh.renderOrder = 0;
  threeCamera.position.set(0, 0, 0);

  threeScene.remove(state.sourceMesh);
  state.sourceMesh.material.dispose();
  panoramaMesh = state.targetMesh;
  currentSceneId = state.target.id;
  updateCurrentChapterScene(currentSceneId);
  canvas.dataset.backgroundTexture = state.prepared.video ? "VideoTexture" : "Texture";
  canvas.dataset.currentScene = state.target.id;
  sceneCaption.textContent = state.target.caption || sceneCaption.textContent;
  sceneTitle.textContent = state.target.title || sceneTitle.textContent;

  const sourceVideo = getSceneVideo(state.sourceSceneId);
  if (state.sourceSceneId === config.id && pingPongController) pingPongController.suspend();
  else sourceVideo?.pause();
  if (state.prepared.video) {
    playPreparedSceneVideo(state.prepared, true);
  }
  switchSceneAudio(state.target.audio, state.prepared.audio);
  syncChapterMusicForContext(900);

  activeTransition = null;
  viewport.classList.remove("scene-transitioning");
  updateHotspots();
  frameDirty = true;
  state.resolve(state.target.id);
}

function updateSceneTransition(now) {
  const state = activeTransition;
  if (!state) return false;
  const elapsed = now - state.startedAt;
  const pushProgress = clamp(elapsed / state.pushDuration, 0, 1);
  threeCamera.position.copy(state.pushDirection).multiplyScalar(easeInOutCubic(pushProgress) * state.pushDistance);

  if (elapsed >= state.pushDuration) {
    const fadeProgress = clamp((elapsed - state.pushDuration) / state.fadeDuration, 0, 1);
    const faded = smoothstep(fadeProgress);
    state.targetMesh.position.copy(threeCamera.position);
    state.sourceMesh.material.opacity = 1 - faded;
    state.targetMesh.material.opacity = faded;
    if (ambientAudio && ambientAvailable) ambientAudio.volume = state.startingVolume * (1 - faded);
    if (fadeProgress >= 1) finishSceneTransition(state);
  }
  frameDirty = true;
  return true;
}

function transitionToScene(transitionConfig) {
  if (narrationActive || archiveOpen || activeTransition || dialogueOpen || currentSceneId !== transitionConfig.source) return Promise.resolve(false);
  if (transitionConfig.source === config.id && !isVillageBriefingComplete()) return Promise.resolve(false);
  if (transitionConfig.source === "yang-ancestral-hall-exterior" && !chapterState.messengerSeen) return Promise.resolve(false);
  const prepared = preloadedScenes.get(transitionConfig.target.id);
  if (!prepared) return Promise.reject(new Error("下一场景尚未预载完成"));

  cameraState.dragging = false;
  cameraState.targetYaw = cameraState.yaw;
  cameraState.targetPitch = cameraState.pitch;
  cameraState.targetZoom = cameraState.zoom;
  viewport.classList.remove("dragging");
  viewport.classList.add("scene-transitioning");
  playTransitionCue(transitionConfig.transitionSound);

  const targetMesh = createPanoramaMesh(prepared.texture, 0, transitionConfig.target.id);
  targetMesh.renderOrder = 2;
  panoramaMesh.renderOrder = 1;
  panoramaMesh.material.transparent = true;
  panoramaMesh.material.depthWrite = false;
  threeScene.add(targetMesh);

  if (prepared.video) {
    playPreparedSceneVideo(prepared, true);
  }

  const pushDirection = new THREE.Vector3();
  threeCamera.getWorldDirection(pushDirection);
  return new Promise(resolve => {
    activeTransition = {
      startedAt: performance.now(), pausedAt: 0,
      pushDuration: transitionConfig.pushDurationMs ?? 1200,
      fadeDuration: transitionConfig.fadeDurationMs ?? 650,
      pushDistance: transitionConfig.pushDistance ?? 1.3,
      pushDirection, sourceMesh: panoramaMesh, targetMesh,
      sourceSceneId: currentSceneId,
      target: transitionConfig.target, prepared,
      startingVolume: ambientAudio?.volume ?? 0, resolve
    };
    frameDirty = true;
    startRenderLoop();
  });
}

function setSceneVideoPlayback(sceneId, shouldPlay, restart = false) {
  const sceneVideo = getSceneVideo(sceneId);
  if (!sceneVideo) return Promise.resolve(false);
  if (restart) sceneVideo.currentTime = 0;
  if (!shouldPlay) {
    sceneVideo.pause();
    return Promise.resolve(true);
  }
  return sceneVideo.play().then(() => true).catch(() => false);
}

window.ruijinSceneEngine = {
  getCurrentSceneId: () => currentSceneId,
  transitionToScene,
  setSceneVideoPlayback,
  getChapterState: () => ({ ...chapterState, meetingCharactersSeen: [...chapterState.meetingCharactersSeen] }),
  getChapterProgress: () => ({ ...calculateChapterProgress() }),
  updateChapterState,
  saveChapterState,
  getChapterMusicState: () => chapterMusic ? ({
    currentTime: chapterMusic.currentTime,
    paused: chapterMusic.paused,
    volume: chapterMusic.volume,
    context: chapterMusic.dataset.context,
    state: chapterMusic.dataset.state
  }) : null,
};

function renderLoop(now) {
  if (!pageVisible) return;
  const yawDelta = cameraState.targetYaw - cameraState.yaw;
  const pitchDelta = cameraState.targetPitch - cameraState.pitch;
  const zoomDelta = cameraState.targetZoom - cameraState.zoom;
  const cameraMoving = Math.abs(yawDelta) > 0.00003 || Math.abs(pitchDelta) > 0.00003 || Math.abs(zoomDelta) > 0.00003;

  if (cameraMoving && !activeTransition) {
    cameraState.yaw += yawDelta * 0.2;
    cameraState.pitch += pitchDelta * 0.2;
    cameraState.zoom += zoomDelta * 0.16;
    updateViewFov();
    const yawLimit = maxYaw();
    cameraState.targetYaw = clamp(cameraState.targetYaw, -yawLimit, yawLimit);
    cameraState.yaw = clamp(cameraState.yaw, -yawLimit, yawLimit);
    threeCamera.fov = viewVFov / DEG;
    threeCamera.updateProjectionMatrix();
    frameDirty = true;
  }

  threeCamera.rotation.x = cameraState.pitch;
  threeCamera.rotation.y = -cameraState.yaw;
  const reverseChanged = currentSceneId === config.id ? (pingPongController?.update(now) ?? false) : false;
  const transitionChanged = updateSceneTransition(now);

  if (frameDirty || cameraMoving || reverseChanged || transitionChanged || firstRender) {
    renderer.render(threeScene, threeCamera);
    updateHotspots();
    frameDirty = false;
    firstRender = false;
  }
  renderHandle = requestAnimationFrame(renderLoop);
}

function startRenderLoop() {
  cancelAnimationFrame(renderHandle);
  renderHandle = requestAnimationFrame(renderLoop);
}

function setupInteraction() {
  const unlockSceneVideoSound = () => {
    const currentVideo = getSceneVideo();
    const currentScene = findSceneConfig(currentSceneId);
    if (currentVideo && currentScene?.video?.muted === false && currentVideo.muted) {
      currentVideo.muted = false;
      currentVideo.defaultMuted = false;
      currentVideo.volume = 1;
      currentVideo.dataset.soundState = "sound-on";
    }
  };
  viewport.addEventListener("click", unlockSceneVideoSound, true);
  viewport.addEventListener("pointerdown", event => {
    unlockSceneVideoSound();
    tryStartMedia(true);
    if (narrationActive || archiveOpen || dialogueOpen || finaleOpen || activeTransition || event.button !== 0 || event.target.closest("button")) return;
    cameraState.dragging = true;
    cameraState.pointerId = event.pointerId;
    cameraState.startX = event.clientX;
    cameraState.startY = event.clientY;
    cameraState.originYaw = cameraState.targetYaw;
    cameraState.originPitch = cameraState.targetPitch;
    cameraState.dragMoved = false;
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("dragging");
  });

  viewport.addEventListener("pointermove", event => {
    if (!cameraState.dragging || event.pointerId !== cameraState.pointerId) return;
    const dx = event.clientX - cameraState.startX;
    const dy = event.clientY - cameraState.startY;
    if (Math.hypot(dx, dy) > 7) cameraState.dragMoved = true;
    cameraState.targetYaw = clamp(cameraState.originYaw - dx * 0.00145, -maxYaw(), maxYaw());
    cameraState.targetPitch = clamp(cameraState.originPitch + dy * 0.0012, -pitchLimit, pitchLimit);
  });

  const stopDrag = event => {
    if (!cameraState.dragging || event.pointerId !== cameraState.pointerId) return;
    cameraState.dragging = false;
    cameraState.pointerId = null;
    viewport.classList.remove("dragging");
  };
  viewport.addEventListener("pointerup", stopDrag);
  viewport.addEventListener("pointercancel", stopDrag);
  viewport.addEventListener("wheel", event => {
    if (narrationActive || archiveOpen || dialogueOpen || finaleOpen || activeTransition) return;
    event.preventDefault();
    cameraState.targetZoom = clamp(cameraState.targetZoom - event.deltaY * 0.00018, 0.96, 1.08);
  }, { passive: false });
}

function setupSceneTransition() {
  const handleSceneExit = (element, event) => {
    const transition = sceneTransitions.get(currentSceneId);
    if (narrationActive || archiveOpen || !transition || activeTransition) return;
    if (element === roadHotspot && currentSceneId === config.id && !isVillageBriefingComplete()) {
      showSceneNotice("先听听村里正在发生什么。");
      return;
    }
    if (element === doorHotspot && currentSceneId === "yang-ancestral-hall-exterior" && !chapterState.messengerSeen) {
      showSceneNotice("先问问门边的通信员。");
      return;
    }
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--ripple-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--ripple-y", `${event.clientY - rect.top}px`);
    element.classList.remove("click-feedback");
    void element.offsetWidth;
    element.classList.add("click-feedback");
    setTimeout(() => element.classList.remove("click-feedback"), 580);
    transitionToScene(transition).catch(error => console.error(error));
  };
  roadHotspot.addEventListener("click", event => handleSceneExit(roadHotspot, event));
  doorHotspot.addEventListener("click", event => handleSceneExit(doorHotspot, event));
}

function getDialogueRecord(type) {
  if (type?.startsWith("meeting:")) {
    return dialogueData.meetingCharacters?.[type.slice("meeting:".length)];
  }
  return dialogueData[type];
}

function createArchiveKeyword(label, archive, className = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `archive-keyword ${className}`.trim();
  button.dataset.archiveId = archive.id;
  button.title = "查看历史档案";
  button.setAttribute("aria-label", `查看历史档案：${archive.title}`);
  const text = document.createElement("span");
  text.textContent = label;
  const mark = document.createElement("i");
  mark.textContent = "档";
  mark.setAttribute("aria-hidden", "true");
  button.append(text, mark);
  button.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    openHistoryArchive(archive.id, button);
  });
  return button;
}

function renderArchiveKeywords(container, text) {
  container.replaceChildren();
  const source = typeof text === "string" ? text : "";
  let plainTextStart = 0;
  let cursor = 0;
  while (cursor < source.length) {
    const match = archiveKeywordEntries.find(entry => source.startsWith(entry.keyword, cursor));
    if (!match) {
      cursor += 1;
      continue;
    }
    if (cursor > plainTextStart) container.appendChild(document.createTextNode(source.slice(plainTextStart, cursor)));
    container.appendChild(createArchiveKeyword(match.keyword, match.archive));
    cursor += match.keyword.length;
    plainTextStart = cursor;
  }
  if (plainTextStart < source.length) container.appendChild(document.createTextNode(source.slice(plainTextStart)));
}

function renderDialogueSpeaker(record) {
  speakerName.replaceChildren();
  const archive = record.characterId
    ? archiveById.get(record.characterId)
    : archiveData.find(item => item.category === "人物档案" && item.title === record.speaker);
  if (archive) {
    speakerName.appendChild(createArchiveKeyword(record.speaker, archive, "archive-person-name"));
  } else {
    speakerName.textContent = record.speaker;
  }
}

function createArchiveFact(label, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "archive-fact";
  const term = document.createElement("dt");
  term.textContent = label;
  const detail = document.createElement("dd");
  detail.textContent = value || "待补充";
  wrapper.append(term, detail);
  return wrapper;
}

function createArchiveListSection(title, items) {
  if (!Array.isArray(items) || !items.length) return null;
  const section = document.createElement("section");
  section.className = "archive-list-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  const list = document.createElement("ul");
  for (const item of items) {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    list.appendChild(listItem);
  }
  section.append(heading, list);
  return section;
}

function createArchiveImagePlaceholder(record) {
  const placeholder = document.createElement("figure");
  placeholder.className = "archive-image-placeholder";
  const mark = document.createElement("span");
  mark.textContent = "影像资料";
  const caption = document.createElement("figcaption");
  caption.textContent = record.imagePlaceholder || "历史图片待补充";
  placeholder.append(mark, caption);
  return placeholder;
}

function closeArchiveImageViewer() {
  if (!archiveImageViewerOpen) return false;
  archiveImageViewerOpen = false;
  archiveImageViewer.classList.remove("open");
  archiveImageViewer.setAttribute("aria-hidden", "true");
  const returnFocus = archiveImageReturnFocus;
  archiveImageReturnFocus = null;
  window.setTimeout(() => returnFocus?.focus({ preventScroll: true }), 180);
  return true;
}

function openArchiveImageViewer(record, trigger) {
  if (!record.image || archiveImageViewerOpen) return false;
  archiveImageViewerOpen = true;
  archiveImageReturnFocus = trigger instanceof HTMLElement ? trigger : null;
  archiveImageViewerImage.src = record.image;
  archiveImageViewerImage.alt = record.imageAlt || `${record.title}历史图片`;
  archiveImageViewerCaption.textContent = record.imageCaption || record.title;
  archiveImageViewer.dataset.archiveId = record.id;
  archiveImageViewer.classList.add("open");
  archiveImageViewer.setAttribute("aria-hidden", "false");
  window.setTimeout(() => archiveImageViewerClose.focus({ preventScroll: true }), 180);
  return true;
}

function createArchiveImage(record) {
  if (!record.image) return createArchiveImagePlaceholder(record);

  const figure = document.createElement("figure");
  figure.className = "archive-image-record";
  const mark = document.createElement("span");
  mark.className = "archive-image-heading";
  mark.textContent = "影像资料";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "archive-image-button";
  button.setAttribute("aria-label", `放大查看：${record.imageAlt || record.title}`);
  const image = document.createElement("img");
  image.src = record.image;
  image.alt = record.imageAlt || `${record.title}历史图片`;
  image.loading = "lazy";
  image.decoding = "async";
  image.draggable = false;
  const zoomCue = document.createElement("span");
  zoomCue.className = "archive-image-zoom-cue";
  zoomCue.textContent = "点击放大";
  button.append(image, zoomCue);
  const caption = document.createElement("figcaption");
  caption.textContent = record.imageCaption || record.title;
  button.addEventListener("click", () => openArchiveImageViewer(record, button));
  image.addEventListener("error", () => {
    figure.replaceWith(createArchiveImagePlaceholder(record));
  }, { once: true });
  figure.append(mark, button, caption);
  return figure;
}

function renderHistoryArchive(record) {
  historyArchiveContent.replaceChildren();

  const category = document.createElement("p");
  category.className = "archive-category";
  category.textContent = record.category || "历史资料";
  const title = document.createElement("h2");
  title.id = "historyArchiveTitle";
  title.textContent = record.title;
  const divider = document.createElement("span");
  divider.className = "archive-title-divider";
  divider.setAttribute("aria-hidden", "true");

  const facts = document.createElement("dl");
  facts.className = "archive-facts";
  facts.appendChild(createArchiveFact("时间", record.time));
  if (record.identity) facts.appendChild(createArchiveFact("身份", record.identity));

  const descriptionSection = document.createElement("section");
  descriptionSection.className = "archive-description";
  const descriptionHeading = document.createElement("h3");
  descriptionHeading.textContent = record.category === "人物档案" ? "人物简介" : "简介";
  const description = document.createElement("p");
  description.textContent = record.description || "档案内容待补充。";
  descriptionSection.append(descriptionHeading, description);

  const fragment = document.createDocumentFragment();
  fragment.append(category, title, divider, facts, descriptionSection);
  if (record.historicalRole) {
    const roleSection = document.createElement("section");
    roleSection.className = "archive-description";
    const roleHeading = document.createElement("h3");
    roleHeading.textContent = "历史角色";
    const role = document.createElement("p");
    role.textContent = record.historicalRole;
    roleSection.append(roleHeading, role);
    fragment.appendChild(roleSection);
  }
  for (const section of [
    createArchiveListSection("相关事件", record.events),
    createArchiveListSection("相关人物", record.people),
    createArchiveListSection("相关地点", record.places)
  ]) {
    if (section) fragment.appendChild(section);
  }

  fragment.appendChild(createArchiveImage(record));
  historyArchiveContent.appendChild(fragment);
}

function openHistoryArchive(archiveId, trigger = document.activeElement) {
  if (window.LongMarchTeaching?.openArchive(archiveId)) return true;
  const record = archiveById.get(archiveId);
  if (!record || archiveOpen) return false;
  archiveOpen = true;
  archiveReturnFocus = trigger instanceof HTMLElement ? trigger : null;
  renderHistoryArchive(record);
  historyArchive.dataset.archiveId = record.id;
  historyArchive.classList.add("open");
  historyArchive.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("history-archive-active");
  viewport.classList.add("in-history-archive");
  window.setTimeout(() => historyArchiveClose.focus({ preventScroll: true }), 280);
  return true;
}

function closeHistoryArchive() {
  if (!archiveOpen) return false;
  closeArchiveImageViewer();
  archiveOpen = false;
  historyArchive.classList.remove("open");
  historyArchive.setAttribute("aria-hidden", "true");
  document.documentElement.classList.remove("history-archive-active");
  viewport.classList.remove("in-history-archive");
  const returnFocus = archiveReturnFocus;
  archiveReturnFocus = null;
  window.setTimeout(() => returnFocus?.focus({ preventScroll: true }), 260);
  return true;
}

function setupHistoryArchive() {
  historyArchiveClose.addEventListener("click", closeHistoryArchive);
  archiveImageViewerClose.addEventListener("click", closeArchiveImageViewer);
  archiveImageViewer.querySelector(".archive-image-viewer-backdrop").addEventListener("click", closeArchiveImageViewer);
  document.addEventListener("keydown", event => {
    if (event.key !== "Escape" || !archiveOpen) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (archiveImageViewerOpen) {
      closeArchiveImageViewer();
      return;
    }
    closeHistoryArchive();
  }, true);
}

function renderDialoguePage() {
  const record = getDialogueRecord(activeDialogueType);
  if (!record) return;
  dialogue.dataset.speechType = record.label?.includes("情境台词") ? "dramatized" : "narration";
  const pages = record.pages || record.lines || [];
  const line = dialogueUseRecap ? record.recap : pages[dialoguePage];
  const hasNextPage = !dialogueUseRecap && dialoguePage < pages.length - 1;
  const showInitialProfile = Boolean(record.identity) && !dialogueWasSeen && !dialogueUseRecap && dialoguePage === 0;
  dialogueMeta.textContent = showInitialProfile ? `人物档案：${record.identity}` : "";
  dialogueMeta.hidden = !showInitialProfile;
  renderArchiveKeywords(dialogueText, line);
  dialogueOptions.replaceChildren();

  const button = document.createElement("button");
  button.type = "button";
  button.dataset.dialogueAction = hasNextPage ? "continue" : "finish";
  if (!hasNextPage) button.className = "quiet";
  const mark = document.createElement("span");
  mark.textContent = hasNextPage ? "›" : "×";
  button.append(mark, document.createTextNode(hasNextPage ? "继续" : "结束"));
  dialogueOptions.appendChild(button);
}

function getDialogueContext(type) {
  if (type === "civilian") return { scene: config.id, hotspotKey: "villager" };
  if (type === "soldier") return { scene: config.id, hotspotKey: "redArmySoldierLeft" };
  if (type === "messenger") return { scene: "yang-ancestral-hall-exterior", hotspotKey: "messenger" };
  if (type?.startsWith("meeting:")) {
    return {
      scene: "yang-ancestral-hall-interior",
      characterId: type.slice("meeting:".length),
      hotspotKey: null
    };
  }
  if (type === "meetingSummary") {
    return { scene: "yang-ancestral-hall-interior", hotspotKey: null };
  }
  return null;
}

function openDialogue(type, hotspot) {
  const context = getDialogueContext(type);
  if (!context || narrationActive || archiveOpen || activeTransition || dialogueOpen || currentSceneId !== context.scene) return;
  const record = getDialogueRecord(type);
  if (!record) return;
  activeDialogueType = type;
  dialoguePage = 0;
  dialogueWasSeen = record.characterId
    ? chapterState.meetingCharactersSeen.includes(record.characterId)
    : chapterState[record.stateKey] === true;
  dialogueUseRecap = dialogueWasSeen && Boolean(record.recap);
  dialogueReturnHotspot = hotspot;
  renderDialogueSpeaker(record);
  speakerLabel.textContent = record.label;
  speakerMark.textContent = record.mark;
  renderDialoguePage();
  dialogueOpen = true;
  setChapterMusicLevel("dialogue", CHAPTER_MUSIC_LEVELS.dialogue, 620);
  dialogue.classList.add("open");
  dialogue.setAttribute("aria-hidden", "false");
  viewport.classList.add("in-dialogue");

  const hotspotKey = hotspot?.dataset.hotspotKey || context.hotspotKey;
  const hotspotRecord = context.characterId
    ? hotspotData.meetingCharacters?.[context.characterId]
    : hotspotData[hotspotKey];
  if (hotspotRecord?.bounds) {
    const bounds = hotspotRecord.bounds;
    const personYaw = (((bounds.left + bounds.right) / 2) - 0.5) * arcRadians;
    cameraState.targetYaw += (personYaw - cameraState.targetYaw) * 0.12;
    cameraState.targetZoom = 1.045;
  }
  setTimeout(() => dialogueOptions.querySelector("button")?.focus({ preventScroll: true }), 230);
}

function closeDialogue() {
  dialogueOpen = false;
  dialogue.classList.remove("open");
  dialogue.setAttribute("aria-hidden", "true");
  viewport.classList.remove("in-dialogue");
  cameraState.targetZoom = 1;
  activeDialogueType = null;
  syncChapterMusicForContext(760);
  dialogueReturnHotspot.focus({ preventScroll: true });
}

function setupDialogue() {
  villagerHotspot.addEventListener("click", () => openDialogue("civilian", villagerHotspot));
  for (const hotspot of soldierHotspots) {
    hotspot.addEventListener("click", () => openDialogue("soldier", hotspot));
  }
  messengerHotspot.addEventListener("click", () => openDialogue("messenger", messengerHotspot));
  for (const hotspot of meetingCharacterHotspots) {
    hotspot.addEventListener("click", () => openDialogue(`meeting:${hotspot.dataset.characterId}`, hotspot));
  }
  meetingSummaryButton.addEventListener("click", () => openDialogue("meetingSummary", meetingSummaryButton));
  strategicDecisionButton.addEventListener("click", handleStrategicDecisionEntry);
  dialogueClose.addEventListener("click", closeDialogue);
  dialogueOptions.addEventListener("click", event => {
    const action = event.target.closest("button")?.dataset.dialogueAction;
    if (!action || !activeDialogueType) return;
    if (action === "continue") {
      dialoguePage += 1;
      renderDialoguePage();
      dialogueOptions.querySelector("button")?.focus({ preventScroll: true });
      return;
    }
    if (action === "finish") {
      const record = getDialogueRecord(activeDialogueType);
      if (record.characterId && !chapterState.meetingCharactersSeen.includes(record.characterId)) {
        updateChapterState({
          meetingCharactersSeen: [...chapterState.meetingCharactersSeen, record.characterId]
        });
      } else if (record.stateKey && !chapterState[record.stateKey]) {
        updateChapterState({ [record.stateKey]: true });
      }
      closeDialogue();
    }
  });
  document.addEventListener("keydown", event => {
    tryStartMedia(true);
    if (event.key === "Escape" && dialogueOpen) closeDialogue();
    if (event.key === "Escape" && finaleOpen) closeChapterFinale();
    if ((event.key === "h" || event.key === "H") && !dialogueOpen && !finaleOpen) document.documentElement.classList.toggle("show-hotspot-debug");
  });
}

function handleStrategicDecisionEntry() {
  if (narrationActive || archiveOpen || currentSceneId !== "yang-ancestral-hall-interior" || activeTransition || dialogueOpen || finaleOpen) return;
  if (!isMeetingStageComplete()) {
    showSceneNotice("先听完所有参会人物的意见。");
    return;
  }
  openChapterFinale();
}

function getFinaleEntryLabel() {
  if (chapterState.diaryCompleted) return "第一章已完成";
  if (chapterState.telegramSent) return "整理长征日记";
  if (chapterState.strategicChoiceCompleted) return "向共产国际发出电报";
  return "参与最后决策";
}

function getFinaleStage() {
  if (chapterState.diaryCompleted) return "summary";
  if (chapterState.telegramSent) return "diary";
  if (chapterState.strategicChoiceCompleted) return "telegram";
  return "decision";
}

function setFinaleStage(stage, eyebrow, title) {
  chapterFinalePanel.dataset.stage = stage;
  chapterFinaleEyebrow.textContent = eyebrow;
  chapterFinaleTitle.textContent = title;
  syncChapterMusicForContext(stage === "decision" ? 1200 : 850);
}

function openChapterFinale() {
  if (!isMeetingStageComplete() || currentSceneId !== "yang-ancestral-hall-interior") return;
  finaleOpen = true;
  finaleBusy = false;
  chapterFinale.classList.add("open");
  chapterFinale.setAttribute("aria-hidden", "false");
  viewport.classList.add("in-finale");
  renderFinaleStage(getFinaleStage());
  setTimeout(() => chapterFinaleContent.querySelector("button")?.focus({ preventScroll: true }), 180);
}

function closeChapterFinale() {
  if (!finaleOpen || finaleBusy) return;
  finaleOpen = false;
  chapterFinale.classList.remove("open");
  chapterFinale.setAttribute("aria-hidden", "true");
  viewport.classList.remove("in-finale");
  syncChapterMusicForContext(800);
  strategicDecisionButton.focus({ preventScroll: true });
}

function renderFinaleStage(stage) {
  selectedStrategy = null;
  if (stage === "decision") renderDecisionStage();
  if (stage === "telegram") renderTelegramStage();
  if (stage === "diary") renderDiaryStage();
  if (stage === "summary") renderDiarySummary(true);
}

function renderDecisionStage() {
  setFinaleStage("decision", "1934年5月起 · 决策情境", "为什么需要准备战略转移？");
  chapterFinaleContent.innerHTML = `
    <p class="finale-lead">广昌失守，苏区缩小，兵员与物资不断消耗。结合三人的职责与意见，判断哪一种方案更有利于保存红军主力。</p>
    <p class="history-note">这是基于史实的形势判断练习。1934年5月中央已开始准备撤离，具体筹划历时数月，10月实行战略转移。</p>
    <div class="strategy-options" role="group" aria-label="战略选择">
      ${Object.entries(STRATEGY_OPTIONS).map(([key, option]) => `
        <button class="strategy-option" type="button" data-strategy="${key}" aria-pressed="false">
          <span>${key}</span><strong>${option.text}</strong>
        </button>
      `).join("")}
    </div>
    <div id="strategyFeedback" class="strategy-feedback" role="status" aria-live="polite" hidden></div>
  `;
}

function showStrategyFeedback(key) {
  const option = STRATEGY_OPTIONS[key];
  if (!option) return;
  selectedStrategy = key;
  for (const button of chapterFinaleContent.querySelectorAll("[data-strategy]")) {
    const selected = button.dataset.strategy === key;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
    button.disabled = true;
  }
  const feedback = chapterFinaleContent.querySelector("#strategyFeedback");
  feedback.hidden = false;
  feedback.innerHTML = `
    <p>${option.feedback}</p>
    <button class="finale-primary-button" type="button" data-finale-action="${option.confirmable ? "confirm-strategy" : "reconsider"}">
      ${option.confirmable ? "确认判断，了解转移准备" : "重新考虑"}
    </button>
  `;
  feedback.querySelector("button")?.focus({ preventScroll: true });
}

function confirmStrategicTransfer() {
  if (selectedStrategy !== "C" || finaleBusy) return;
  updateChapterState({ strategicChoiceCompleted: true });
  window.dispatchEvent(new CustomEvent("ruijin:strategic-choice-complete", {
    detail: { choice: "strategic-transfer" }
  }));
  renderTelegramStage();
}

function renderTelegramStage() {
  setFinaleStage("telegram", "中央苏区 · 通信记录", "向共产国际发出电报");
  const alreadySent = chapterState.telegramSent;
  chapterFinaleContent.innerHTML = `
    <div class="telegram-sheet ${alreadySent ? "sent" : ""}">
      <p class="telegram-kicker">内容概述 · 非历史原文</p>
      <h3>致共产国际</h3>
      <p>中央苏区形势严峻。为保存红军主力，拟实施战略转移，请示相关意见。</p>
      <div class="telegram-rule" aria-hidden="true"></div>
      <p id="telegramStatus" class="telegram-status" aria-live="polite">${alreadySent ? "已收到回电，战略转移计划进入准备阶段" : "电报稿已整理，等待发送。"}</p>
    </div>
    <div class="finale-actions">
      <button class="finale-primary-button" type="button" data-finale-action="${alreadySent ? "open-diary" : "send-telegram"}">
        ${alreadySent ? "整理长征日记" : "发送电报"}
      </button>
    </div>
  `;
}

function playTelegramCodeSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const beats = [0, .12, .22, .37, .49, .64, .76];
  for (const offset of beats) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = offset % .2 < .1 ? 690 : 760;
    gain.gain.setValueAtTime(.0001, context.currentTime + offset);
    gain.gain.exponentialRampToValueAtTime(.045, context.currentTime + offset + .01);
    gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + offset + .065);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(context.currentTime + offset);
    oscillator.stop(context.currentTime + offset + .075);
  }
  window.setTimeout(() => context.close().catch(() => {}), 1200);
}

function scheduleTelegramStep(callback, delay) {
  const id = window.setTimeout(callback, delay);
  telegramTimerIds.push(id);
}

function sendTelegram() {
  if (finaleBusy || chapterState.telegramSent) return;
  finaleBusy = true;
  const sheet = chapterFinaleContent.querySelector(".telegram-sheet");
  const button = chapterFinaleContent.querySelector("[data-finale-action='send-telegram']");
  const status = chapterFinaleContent.querySelector("#telegramStatus");
  sheet.classList.add("sending");
  button.disabled = true;
  button.textContent = "发送中……";
  status.textContent = "正在发送电报……";
  playTelegramCodeSound();

  scheduleTelegramStep(() => {
    status.textContent = "电报已发出";
    sheet.classList.add("sent");
  }, 620);
  scheduleTelegramStep(() => {
    updateChapterState({ telegramSent: true });
    finaleBusy = false;
    status.textContent = "已收到回电，战略转移计划进入准备阶段";
    button.disabled = false;
    button.textContent = "整理长征日记";
    button.dataset.finaleAction = "open-diary";
    button.focus({ preventScroll: true });
  }, 1480);
}

function renderDiaryStage() {
  diaryQuestionIndex = 0;
  diaryQuestionSolved = false;
  setFinaleStage("diary", "长征日记整理 · 第一篇", "我的长征日记·第一篇");
  renderDiaryQuestion();
}

function renderDiaryQuestion() {
  const item = DIARY_QUESTIONS[diaryQuestionIndex];
  diaryQuestionSolved = false;
  chapterFinaleContent.innerHTML = `
    <div class="diary-paper">
      <p class="diary-subtitle">瑞金：出发前的抉择</p>
      <p class="diary-guide">整理刚刚了解到的信息，记录长征开始的背景。</p>
      <div class="diary-progress" aria-label="日记题目进度">${diaryQuestionIndex + 1} / ${DIARY_QUESTIONS.length}</div>
      <h3>${item.question}</h3>
      <div class="diary-options" role="group" aria-label="第${diaryQuestionIndex + 1}题选项">
        ${item.options.map((option, index) => `
          <button type="button" data-diary-answer="${index}"><span>${String.fromCharCode(65 + index)}</span>${option}</button>
        `).join("")}
      </div>
      <div id="diaryFeedback" class="diary-feedback" role="status" aria-live="polite" hidden></div>
    </div>
  `;
}

function answerDiaryQuestion(answerIndex) {
  if (diaryQuestionSolved) return;
  const item = DIARY_QUESTIONS[diaryQuestionIndex];
  const correct = answerIndex === item.answer;
  const buttons = chapterFinaleContent.querySelectorAll("[data-diary-answer]");
  for (const button of buttons) {
    button.disabled = true;
    button.classList.toggle("selected-correct", correct && Number(button.dataset.diaryAnswer) === answerIndex);
    button.classList.toggle("selected-review", !correct && Number(button.dataset.diaryAnswer) === answerIndex);
  }
  const feedback = chapterFinaleContent.querySelector("#diaryFeedback");
  feedback.hidden = false;
  feedback.innerHTML = `
    <strong>${correct ? "理解正确" : "再结合会议形势想一想"}</strong>
    <p>${item.explanation}</p>
    <button class="finale-primary-button" type="button" data-finale-action="${correct ? "next-question" : "retry-question"}">
      ${correct ? (diaryQuestionIndex === DIARY_QUESTIONS.length - 1 ? "整理日记总结" : "下一题") : "重新选择"}
    </button>
  `;
  diaryQuestionSolved = correct;
  feedback.querySelector("button")?.focus({ preventScroll: true });
}

function nextDiaryQuestion() {
  if (!diaryQuestionSolved) return;
  if (diaryQuestionIndex < DIARY_QUESTIONS.length - 1) {
    diaryQuestionIndex += 1;
    renderDiaryQuestion();
    chapterFinaleContent.querySelector("[data-diary-answer]")?.focus({ preventScroll: true });
    return;
  }
  renderDiarySummary(false);
}

function renderDiarySummary(completed) {
  setFinaleStage("summary", "我的长征日记 · 第一篇", "瑞金：出发前的抉择");
  chapterFinaleContent.innerHTML = `
    <div class="diary-paper diary-summary ${completed ? "completed" : ""}">
      <p>今天，我在瑞金了解了长征开始前的形势。</p>
      <p>第五次反“围剿”陷入困境，中央苏区范围不断缩小，红军主力持续承受压力。为了保存革命力量、摆脱不利局面，中央开始考虑实施战略转移。</p>
      <h3>我明白了：</h3>
      <ul>
        <li>长征不是仓促出发</li>
        <li>战略转移是严峻形势下的理性选择</li>
        <li>保存力量，是为了继续革命事业</li>
        <li>面对困难，需要根据实际及时调整方向</li>
      </ul>
      <div class="ruijin-stamp ${completed ? "stamped" : ""}" aria-label="瑞金章节印章">瑞金<br><small>第一章</small></div>
      <div id="chapterCompleteMessage" class="chapter-complete-message" ${completed ? "" : "hidden"}>
        <strong>第一章完成</strong><span>下一站：于都</span>
      </div>
    </div>
    ${completed ? "" : `<div class="finale-actions"><button class="finale-primary-button" type="button" data-finale-action="stamp-ruijin">盖上瑞金印章</button></div>`}
  `;
}

function stampRuijinChapter() {
  if (finaleBusy || chapterState.diaryCompleted) return;
  finaleBusy = true;
  const stamp = chapterFinaleContent.querySelector(".ruijin-stamp");
  const button = chapterFinaleContent.querySelector("[data-finale-action='stamp-ruijin']");
  stamp.classList.add("stamping");
  button.disabled = true;
  window.setTimeout(() => {
    updateChapterState({ diaryCompleted: true });
    finaleBusy = false;
    stamp.classList.remove("stamping");
    stamp.classList.add("stamped");
    button.remove();
    const message = chapterFinaleContent.querySelector("#chapterCompleteMessage");
    message.hidden = false;
    message.classList.add("revealed");
    window.dispatchEvent(new CustomEvent("ruijin:chapter-complete", {
      detail: { unlockedLocation: "yudu" }
    }));
    window.setTimeout(() => {
      playEndingNarrationIfNeeded().catch(error => console.error("章节结束旁白播放失败：", error));
    }, 1500);
  }, 760);
}

function setupChapterFinale() {
  chapterFinaleClose.addEventListener("click", closeChapterFinale);
  chapterFinale.querySelector(".chapter-finale-backdrop").addEventListener("click", closeChapterFinale);
  chapterFinaleContent.addEventListener("click", event => {
    const strategyButton = event.target.closest("[data-strategy]");
    if (strategyButton) {
      showStrategyFeedback(strategyButton.dataset.strategy);
      return;
    }
    const answerButton = event.target.closest("[data-diary-answer]");
    if (answerButton) {
      answerDiaryQuestion(Number(answerButton.dataset.diaryAnswer));
      return;
    }
    const action = event.target.closest("[data-finale-action]")?.dataset.finaleAction;
    if (action === "reconsider") renderDecisionStage();
    if (action === "confirm-strategy") confirmStrategicTransfer();
    if (action === "send-telegram") sendTelegram();
    if (action === "open-diary") renderDiaryStage();
    if (action === "retry-question") renderDiaryQuestion();
    if (action === "next-question") nextDiaryQuestion();
    if (action === "stamp-ruijin") stampRuijinChapter();
  });
}

function setupAmbientAudio() {
  ambientAudio = new Audio(config.audio.source);
  ambientAudio.id = "ruijin-ambient-audio";
  ambientAudio.hidden = true;
  ambientAudio.loop = true;
  ambientAudio.preload = "auto";
  ambientAudio.volume = clamp(config.audio.volume, 0, 1);
  ambientAudio.dataset.volume = ambientAudio.volume.toFixed(2);
  ambientAudio.dataset.playbackMode = "loop";
  const sync = () => { ambientAudio.dataset.state = ambientAudio.paused ? "paused" : "playing"; };
  ambientAudio.addEventListener("play", sync);
  ambientAudio.addEventListener("pause", sync);
  ambientAudio.setAttribute("playsinline", "");
  document.body.appendChild(ambientAudio);
  ambientAudio.load();
}

async function tryStartMedia(userInitiated = false) {
  const currentVideo = getSceneVideo();
  const currentScene = findSceneConfig(currentSceneId);
  const wantsSceneSound = currentScene?.video?.muted === false;
  const unlockingSceneSound = Boolean(currentVideo && wantsSceneSound && currentVideo.muted && userInitiated);
  if (unlockingSceneSound) {
    currentVideo.muted = false;
    currentVideo.defaultMuted = false;
    currentVideo.volume = 1;
    currentVideo.dataset.soundState = "sound-on";
  }
  if (currentVideo && pageVisible && (currentVideo.paused || unlockingSceneSound)) {
    if (currentSceneId === config.id && pingPongController?.direction === "manual-reverse") {
      // Runtime reverse fallback advances through renderLoop seeking.
    } else {
      try {
        await currentVideo.play();
      } catch {
        if (wantsSceneSound) {
          currentVideo.muted = true;
          currentVideo.defaultMuted = true;
          currentVideo.dataset.soundState = "waiting-for-interaction";
          await currentVideo.play().catch(() => {});
        }
      }
    }
  }
  await tryStartChapterMusic(userInitiated);
  if (!ambientAvailable || !ambientAudio || !pageVisible || !ambientAudio.paused) return;
  try {
    await ambientAudio.play();
    audioStarted = true;
    ambientAudio.dataset.state = "playing";
  } catch { /* browsers may require the first pointer or keyboard gesture */ }
}

function setupVisibilityHandling() {
  document.addEventListener("visibilitychange", () => {
    pageVisible = !document.hidden;
    if (!pageVisible) {
      cancelAnimationFrame(renderHandle);
      if (currentSceneId === config.id && pingPongController) pingPongController.suspend();
      else getSceneVideo()?.pause();
      activeTransition?.prepared.video?.pause();
      ambientAudio?.pause();
      chapterMusic?.pause();
      if (activeTransition) activeTransition.pausedAt = performance.now();
      return;
    }
    frameDirty = true;
    firstRender = true;
    if (activeTransition?.pausedAt) {
      activeTransition.startedAt += performance.now() - activeTransition.pausedAt;
      activeTransition.pausedAt = 0;
    }
    if (currentSceneId === config.id && pingPongController) pingPongController.resume();
    else getSceneVideo()?.play().catch(() => {});
    if (activeTransition?.prepared.video) activeTransition.prepared.video.play().catch(() => {});
    if (ambientAvailable && audioStarted) ambientAudio?.play().catch(() => {});
    if (chapterMusicStarted) chapterMusic?.play().catch(() => {});
    syncChapterMusicForContext(0);
    startRenderLoop();
  });
}

function createLeaves() {
  const count = matchMedia("(max-width: 700px)").matches ? 4 : 7;
  for (let i = 0; i < count; i += 1) {
    const leaf = document.createElement("i");
    leaf.className = "leaf";
    leaf.style.left = `${8 + Math.random() * 86}%`;
    leaf.style.setProperty("--size", `${8 + Math.random() * 8}px`);
    leaf.style.setProperty("--opacity", `${0.28 + Math.random() * 0.38}`);
    leaf.style.setProperty("--blur", `${Math.random() < 0.25 ? 0.8 : 0}px`);
    leaf.style.setProperty("--duration", `${15 + Math.random() * 15}s`);
    leaf.style.setProperty("--delay", `${-Math.random() * 24}s`);
    leaves.appendChild(leaf);
  }
}

async function bootstrap() {
  try {
    await resolveStartupMemoryChoice();
    setupChapterMusic();
    await loadChapter();
    setupChapterNavigationUI();
    loading.querySelector("p").textContent = "正在载入动态影像……";
    const loadedVideo = await loadBackgroundVideo();
    setupThree(loadedVideo.playbackMode);
    buildCharacterHitMeshes();
    setupAmbientAudio();
    for (const transition of config.transitions || []) {
      sceneTransitions.set(transition.source, transition);
    }
    if (sceneTransitions.size) {
      loading.querySelector("p").textContent = "正在预载后续场景……";
      await Promise.allSettled(Array.from(sceneTransitions.values(), transition => preloadSceneAssets(transition.target)));
    }
    restoreSavedScene();
    setupInteraction();
    setupCharacterRaycastInteraction();
    setupSceneTransition();
    setupHistoryArchive();
    setupDialogue();
    setupChapterFinale();
    setupVisibilityHandling();
    createLeaves();
    if (currentSceneId === config.id) {
      await (pingPongController ? pingPongController.start() : video.play().catch(() => {}));
    } else {
      await playPreparedSceneVideo(preloadedScenes.get(currentSceneId), true);
    }
    tryStartMedia(false);
    saveChapterState();
    loading.classList.add("ready");
    startRenderLoop();
    if (chapterState.diaryCompleted) {
      await playEndingNarrationIfNeeded();
    } else {
      await playOpeningNarrationIfNeeded();
    }
  } catch (error) {
    loading.querySelector("p").textContent = error.message || "场景加载失败，请重新启动本章";
  }
}

window.addEventListener("resize", resizeRenderer, { passive: true });
window.addEventListener("beforeunload", () => {
  if (!chapterResetInProgress) {
    updateCurrentChapterScene(currentSceneId, false);
    saveChapterState();
  }
  cancelAnimationFrame(renderHandle);
  video?.pause();
  ambientAudio?.pause();
  chapterMusic?.pause();
  cancelAnimationFrame(chapterMusicFadeFrame);
  transitionCueAudio?.pause();
  videoTexture?.dispose();
  for (const prepared of preloadedScenes.values()) {
    prepared.video?.pause();
    prepared.texture?.dispose();
  }
  for (const mesh of characterHitMeshes) {
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  panoramaGeometry?.dispose();
  panoramaMesh?.material.dispose();
  activeTransition?.targetMesh?.material.dispose();
  renderer?.dispose();
});

bootstrap();
