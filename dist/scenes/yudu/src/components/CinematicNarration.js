const DEFAULT_STEP_MS = 2400;
const DEFAULT_FADE_MS = 620;

const wait = duration => new Promise(resolve => setTimeout(resolve, duration));

export class CinematicNarration {
  constructor({ root }) {
    this.root = root;
    this.copy = root.querySelector("#cinematicCopy");
    this.skipButton = root.querySelector("#cinematicSkip");
    this.runToken = 0;
    this.skipRequested = false;
    this.awaitingContinue = false;
    this.resolveWait = null;
    this.skipButton.addEventListener("click", () => this.handleControl());
  }

  isOpen() {
    return this.root.classList.contains("open");
  }

  waitOrControl(duration) {
    return new Promise(resolve => {
      const timer = Number.isFinite(duration) ? setTimeout(done, duration) : null;
      const previousResolve = this.resolveWait;
      function done() {
        if (timer) clearTimeout(timer);
        resolve();
      }
      this.resolveWait = () => {
        if (previousResolve && previousResolve !== this.resolveWait) previousResolve();
        done();
      };
    });
  }

  handleControl() {
    if (!this.isOpen()) return;
    if (this.awaitingContinue) {
      this.finish();
      return;
    }
    this.skipRequested = true;
    this.resolveWait?.();
  }

  revealForContinue({ steps, cumulative, cumulativeLines }) {
    if (cumulative) {
      cumulativeLines.forEach(line => line.classList.add("visible"));
    } else {
      const last = steps[steps.length - 1] || {};
      this.root.classList.toggle("title-step", last.kind === "title");
      this.root.classList.toggle("emphasis-step", last.emphasis === true);
      this.copy.textContent = last.text || "";
      this.root.classList.add("text-visible");
    }
    this.skipRequested = false;
    this.awaitingContinue = true;
    this.skipButton.textContent = "继续";
    this.skipButton.hidden = false;
  }

  async play(config, { onStep } = {}) {
    const steps = Array.isArray(config?.steps) ? config.steps : [];
    if (!steps.length) return;

    this.cancel();
    const token = this.runToken;
    const completed = new Promise(resolve => { this.resolveRun = resolve; });
    const cumulative = config.cumulative === true;
    this.skipRequested = false;
    this.awaitingContinue = false;
    this.skipButton.textContent = config.skipLabel || "跳过";
    this.skipButton.hidden = false;
    this.root.classList.toggle("use-scene-background", config.background === "scene");
    this.root.classList.toggle("transparent-background", config.background === "transparent");
    this.root.classList.toggle("cumulative-mode", cumulative);
    this.root.style.setProperty("--cinematic-line-ms", `${config.fadeMs ?? DEFAULT_FADE_MS}ms`);
    this.copy.replaceChildren();
    this.copy.classList.toggle("cumulative", cumulative);
    const cumulativeLines = cumulative
      ? steps.map(step => {
          const line = document.createElement("span");
          line.className = "cinematic-line";
          if (step.kind === "title") line.classList.add("title-line");
          if (step.emphasis === true) line.classList.add("emphasis-line");
          line.textContent = step.text || "";
          this.copy.appendChild(line);
          return line;
        })
      : [];
    this.root.classList.add("open");
    this.root.setAttribute("aria-hidden", "false");

    await Promise.race([this.waitOrControl(config.openDelayMs ?? 180), completed]);
    for (let index = 0; index < steps.length; index += 1) {
      if (token !== this.runToken || this.skipRequested) break;
      const step = steps[index];
      const duration = Math.max(900, step.durationMs ?? DEFAULT_STEP_MS);
      const fadeMs = Math.min(duration * .36, step.fadeMs ?? config.fadeMs ?? DEFAULT_FADE_MS);
      onStep?.(step, index);

      if (cumulative) {
        const line = cumulativeLines[index];
        requestAnimationFrame(() => {
          if (token === this.runToken) line.classList.add("visible");
        });
        await Promise.race([this.waitOrControl(duration), completed]);
        continue;
      }

      this.root.classList.toggle("title-step", step.kind === "title");
      this.root.classList.toggle("emphasis-step", step.emphasis === true);
      this.copy.textContent = step.text || "";
      requestAnimationFrame(() => {
        if (token === this.runToken) this.root.classList.add("text-visible");
      });
      await Promise.race([this.waitOrControl(Math.max(320, duration - fadeMs)), completed]);
      if (token !== this.runToken || this.skipRequested) break;
      this.root.classList.remove("text-visible");
      await Promise.race([this.waitOrControl(fadeMs), completed]);
    }

    if (token === this.runToken && !this.awaitingContinue) {
      if (config.endHoldMs > 0 && !this.skipRequested) {
        await Promise.race([this.waitOrControl(config.endHoldMs), completed]);
      }
      this.revealForContinue({ steps, cumulative, cumulativeLines });
    }
    await completed;
  }

  finish() {
    if (!this.isOpen() || this.closing) return;
    this.closing = true;
    const token = ++this.runToken;
    this.resolveWait?.();
    this.root.classList.remove("text-visible");
    const closeDelay = Number.parseInt(getComputedStyle(this.root).getPropertyValue("--cinematic-close-ms"), 10) || 620;
    const uiTimeout = window.LongMarchClassroom?.native.timeout || window.setTimeout.bind(window);
    uiTimeout(() => {
      if (token !== this.runToken) return;
      this.root.classList.remove("open", "title-step", "emphasis-step", "use-scene-background", "transparent-background", "cumulative-mode");
      this.root.setAttribute("aria-hidden", "true");
      this.copy.replaceChildren();
      this.copy.classList.remove("cumulative");
      this.skipButton.hidden = false;
      this.skipButton.textContent = "跳过";
      this.skipRequested = false;
      this.awaitingContinue = false;
      this.closing = false;
      this.resolveRun?.();
      this.resolveRun = null;
      this.resolveWait = null;
    }, closeDelay);
  }

  cancel() {
    this.runToken += 1;
    this.closing = false;
    this.resolveWait?.();
    this.root.classList.remove("open", "text-visible", "title-step", "emphasis-step", "use-scene-background", "transparent-background", "cumulative-mode");
    this.root.setAttribute("aria-hidden", "true");
    this.copy.replaceChildren();
    this.copy.classList.remove("cumulative");
    this.skipButton.hidden = false;
    this.skipButton.textContent = "跳过";
    this.skipRequested = false;
    this.awaitingContinue = false;
    this.resolveRun?.();
    this.resolveRun = null;
    this.resolveWait = null;
  }
}
