const wait = duration => new Promise(resolve => setTimeout(resolve, duration));

export class FinalePlayer {
  constructor({ root }) {
    this.root = root;
    this.video = root.querySelector("#finaleVideo");
    this.canvas = root.querySelector("#finaleFreezeFrame");
    this.error = root.querySelector("#finaleError");
    this.runToken = 0;
  }

  isOpen() {
    return this.root.classList.contains("open");
  }

  async play(config = {}, { beforeVideoStart, onVideoStart } = {}) {
    this.cancel();
    const token = this.runToken;
    this.root.style.setProperty("--finale-fade-ms", `${config.blackoutFadeMs ?? 650}ms`);
    this.root.classList.add("open", "blackout");
    this.root.setAttribute("aria-hidden", "false");
    this.error.textContent = "";
    this.canvas.hidden = true;

    const video = this.video;
    video.controls = false;
    video.muted = true;
    video.defaultMuted = true;
    video.volume = 0;
    video.loop = false;
    video.playsInline = true;
    video.preload = "auto";
    video.setAttribute("playsinline", "");

    const loaded = await this.loadVideo(config.source);
    if (!loaded || token !== this.runToken) return null;
    await wait(config.preRollMs ?? 500);
    if (token !== this.runToken) return null;
    const startPayload = await beforeVideoStart?.();
    if (token !== this.runToken) return null;

    video.currentTime = 0;
    this.root.classList.remove("blackout");
    this.root.classList.add("video-playing");
    try {
      const videoStart = video.play();
      const audioStart = onVideoStart?.(startPayload);
      await Promise.all([videoStart, audioStart]);
    } catch (error) {
      this.showError("最终影片无法自动播放。");
      throw error;
    }

    const playbackResult = await new Promise((resolve, reject) => {
      const ended = () => {
        cleanup();
        resolve("ended");
      };
      const failed = () => {
        cleanup();
        reject(new Error("最终影片播放失败。"));
      };
      const cleanup = () => {
        video.removeEventListener("ended", ended);
        video.removeEventListener("error", failed);
        if (this.cancelPlayback === cancelPlayback) this.cancelPlayback = null;
      };
      const cancelPlayback = () => {
        cleanup();
        resolve("cancelled");
      };
      this.cancelPlayback = cancelPlayback;
      video.addEventListener("ended", ended, { once: true });
      video.addEventListener("error", failed, { once: true });
    });
    if (playbackResult !== "ended" || token !== this.runToken) return null;

    const captured = this.captureFinalFrame();
    video.pause();
    this.root.classList.remove("video-playing");
    this.root.classList.add("frozen");
    if (captured) this.canvas.hidden = false;
    return {
      captured,
      duration: Number.isFinite(video.duration) ? video.duration : 0
    };
  }

  loadVideo(source) {
    return new Promise((resolve, reject) => {
      const video = this.video;
      const ready = () => {
        cleanup();
        resolve(true);
      };
      const failed = () => {
        cleanup();
        this.showError("最终影片加载失败，请检查视频资源。");
        reject(new Error("最终影片加载失败。"));
      };
      const cleanup = () => {
        video.removeEventListener("loadeddata", ready);
        video.removeEventListener("error", failed);
        if (this.cancelLoad === cancelLoad) this.cancelLoad = null;
      };
      const cancelLoad = () => {
        cleanup();
        resolve(false);
      };
      this.cancelLoad = cancelLoad;
      video.addEventListener("loadeddata", ready, { once: true });
      video.addEventListener("error", failed, { once: true });
      video.src = source;
      video.load();
    });
  }

  captureFinalFrame() {
    const width = this.video.videoWidth;
    const height = this.video.videoHeight;
    if (!width || !height) return false;
    try {
      this.canvas.width = width;
      this.canvas.height = height;
      const context = this.canvas.getContext("2d");
      context.drawImage(this.video, 0, 0, width, height);
      return true;
    } catch {
      return false;
    }
  }

  showError(message) {
    this.error.textContent = message;
    this.root.classList.add("has-error");
  }

  close() {
    if (!this.isOpen()) return;
    this.root.classList.remove("open", "video-playing", "frozen", "blackout", "has-error");
    this.root.setAttribute("aria-hidden", "true");
    setTimeout(() => this.cleanupMedia(), 700);
  }

  cancel() {
    this.runToken += 1;
    this.cancelLoad?.();
    this.cancelLoad = null;
    this.cancelPlayback?.();
    this.cancelPlayback = null;
    this.root.classList.remove("open", "video-playing", "frozen", "blackout", "has-error");
    this.root.setAttribute("aria-hidden", "true");
    this.cleanupMedia();
  }

  cleanupMedia() {
    this.video.pause();
    this.video.removeAttribute("src");
    this.video.load();
    this.canvas.hidden = true;
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.error.textContent = "";
  }
}
