const PLAYER_SPEAKER = "红军战士";
const EMPHASIS_HOLD_MS = 760;
const FINAL_SETTLE_MS = 520;
const CORRECT_FEEDBACK_HOLD_MS = 700;
const NODE_EXIT_MS = 240;

export class DialogueSystem {
  constructor({ root, audio, onChoice, onComplete, onOpen, onClose }) {
    this.root = root;
    this.audio = audio;
    this.onChoice = onChoice;
    this.onComplete = onComplete;
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.viewport = root.closest(".viewport");
    this.name = root.querySelector("#speakerName");
    this.label = root.querySelector("#speakerLabel");
    this.mark = root.querySelector("#speakerMark");
    this.text = root.querySelector("#dialogueText");
    this.options = root.querySelector("#dialogueOptions");
    this.feedback = root.querySelector("#dialogueFeedback");
    this.concepts = root.querySelector("#dialogueConcepts");
    this.runToken = 0;
    this.advanceTimer = 0;
    this.choiceTimer = 0;
    this.choicesReady = false;

    root.querySelector("#dialogueClose").addEventListener("click", () => this.close(false));
    addEventListener("keydown", event => {
      if (event.key === "Escape" && this.isOpen()) this.close(false);
      if (
        (event.key === "Enter" || event.key === " ") &&
        this.isOpen() &&
        !this.isResponding &&
        this.choicesReady &&
        this.options.children.length === 1
      ) {
        event.preventDefault();
        this.options.firstElementChild.click();
      }
    });
  }

  open(dialogue, context = {}) {
    this.validate(dialogue);
    clearTimeout(this.advanceTimer);
    clearTimeout(this.choiceTimer);
    this.runToken += 1;
    this.dialogue = dialogue;
    this.nodes = dialogue.nodes;
    this.context = context;
    this.index = 0;
    this.isResponding = false;
    this.choicesReady = false;
    this.cuedNodes = new Set();
    if (dialogue.placement) this.setPlacement(dialogue.placement);
    this.root.classList.toggle("crossing-decision", dialogue.presentation === "crossing-decision");
    this.root.dataset.dialogueTitle = dialogue.title || "";
    this.onOpen?.(dialogue, context);
    this.viewport?.classList.add("in-dialogue");
    this.root.classList.add("open");
    this.root.setAttribute("aria-hidden", "false");
    this.audio.duck(true);
    this.render();
  }

  validate(dialogue) {
    if (!Array.isArray(dialogue?.nodes) || dialogue.nodes.length === 0) {
      throw new Error("对话数据必须使用非空的 DialogueNode nodes[]。");
    }

    dialogue.nodes.forEach((node, index) => {
      if (!Array.isArray(node.choices) || node.choices.length === 0) {
        throw new Error(`DialogueNode ${node.id || index} 缺少玩家 choices[]。`);
      }
      if (node.correct && !node.choices.some(choice => choice.id === node.correct)) {
        throw new Error(`DialogueNode ${node.id || index} 的正确选项不存在。`);
      }
    });
  }

  isOpen() {
    return this.root.classList.contains("open");
  }

  setPlacement(config = {}) {
    const allowedAnchors = new Set(["bottom-center", "bottom-left", "bottom-right"]);
    const anchor = allowedAnchors.has(config.anchor) ? config.anchor : "bottom-center";
    const maxWidth = Math.max(620, Math.min(Number(config.maxWidth) || 1180, 1240));
    this.root.dataset.placement = anchor;
    this.root.dataset.density = config.density === "compact" ? "compact" : "default";
    this.root.style.setProperty("--dialogue-scene-max-width", `${maxWidth}px`);
  }

  render() {
    const node = this.nodes[this.index];
    if (!node) {
      this.finish();
      return;
    }

    clearTimeout(this.choiceTimer);
    this.isResponding = false;
    this.choicesReady = false;
    this.root.classList.remove("node-leaving");
    this.root.classList.add("node-entering");
    this.feedback.textContent = "";
    this.options.replaceChildren();
    this.options.classList.remove("choices-visible");
    this.options.classList.add("choices-pending");
    this.options.setAttribute("aria-hidden", "true");
    this.concepts.replaceChildren();
    this.concepts.hidden = true;
    this.root.classList.remove("choice-mode", "response-mode", "action-mode", "player-response", "npc-feedback", "movie-playing", "text-medium", "text-long");
    this.name.textContent = node.speaker || this.dialogue.speaker || "旁白";
    this.label.textContent = node.label || this.dialogue.label || "LONG MARCH";
    this.mark.textContent = (node.speaker || this.dialogue.speaker || "征").slice(0, 1);

    if (node.kind === "movie") this.renderMovie(node);
    else {
      this.text.textContent = node.text || "";
      this.applyTextLength(node.text);
    }
    if (node.stageDirection) this.feedback.textContent = node.stageDirection;

    if (node.words?.length) {
      this.concepts.hidden = false;
      for (const word of node.words) {
        const chip = document.createElement("span");
        chip.textContent = word;
        this.concepts.appendChild(chip);
      }
    }

    if (node.cue && !this.cuedNodes.has(this.index)) {
      this.cuedNodes.add(this.index);
      this.audio.playCue(node.cue);
    }

    this.renderChoices(node);
    this.scheduleChoiceReveal(node);
    const token = this.runToken;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (token === this.runToken && this.isOpen()) this.root.classList.remove("node-entering");
    }));
  }

  renderMovie(node) {
    this.text.replaceChildren();
    const title = document.createElement("strong");
    title.className = "movie-status";
    title.textContent = node.title || "影片准备中";
    this.text.appendChild(title);
  }

  applyTextLength(value) {
    const length = Array.from(value || "").length;
    this.root.classList.toggle("text-medium", length > 24 && length <= 43);
    this.root.classList.toggle("text-long", length > 43);
  }

  choiceDelayFor(value) {
    const length = Array.from(value || "").length;
    if (length <= 12) return 800;
    if (length <= 34) return 1400;
    return 2000;
  }

  scheduleChoiceReveal(node) {
    const token = this.runToken;
    const delay = Math.max(0, node.choiceDelayMs ?? this.choiceDelayFor(node.text));
    clearTimeout(this.choiceTimer);
    this.choiceTimer = setTimeout(() => {
      if (token !== this.runToken || !this.isOpen() || this.isResponding) return;
      this.choicesReady = true;
      this.options.classList.remove("choices-pending");
      this.options.classList.add("choices-visible");
      this.options.setAttribute("aria-hidden", "false");
    }, delay);
  }

  hideChoices() {
    clearTimeout(this.choiceTimer);
    this.choicesReady = false;
    this.options.classList.remove("choices-visible");
    this.options.classList.add("choices-pending");
    this.options.setAttribute("aria-hidden", "true");
  }

  transitionOut(callback) {
    const token = this.runToken;
    clearTimeout(this.advanceTimer);
    this.hideChoices();
    this.isResponding = true;
    this.root.classList.remove("node-entering");
    this.root.classList.add("node-leaving");
    this.advanceTimer = setTimeout(() => {
      if (token !== this.runToken || !this.isOpen()) return;
      callback();
    }, NODE_EXIT_MS);
  }

  renderChoices(node) {
    const multiple = node.choices.length > 1;
    const actionOnly = node.choices.length === 1 && node.choices[0].type === "action";
    this.root.classList.toggle("choice-mode", multiple);
    this.root.classList.toggle("response-mode", !multiple && !actionOnly);
    this.root.classList.toggle("action-mode", actionOnly);

    let solved = false;
    node.choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = actionOnly
        ? "dialogue-action"
        : multiple
          ? "dialogue-choice"
          : "dialogue-response";

      if (multiple) {
        const key = document.createElement("span");
        key.className = "choice-key";
        key.textContent = choice.id || String.fromCharCode(65 + index);
        button.appendChild(key);
      } else if (actionOnly) {
        const icon = document.createElement("span");
        icon.className = "action-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "▶";
        button.appendChild(icon);
      }

      const text = document.createElement("strong");
      text.textContent = choice.text;
      button.appendChild(text);
      if (!multiple && !actionOnly) {
        const arrow = document.createElement("span");
        arrow.className = "response-arrow";
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "›";
        button.appendChild(arrow);
      }

      button.addEventListener("click", async () => {
        if (solved || this.isResponding || !this.choicesReady) return;
        const hasCorrectAnswer = Boolean(node.correct);
        const correct = !hasCorrectAnswer || choice.id === node.correct;
        this.onChoice?.({ node, choice, correct, dialogue: this.dialogue, context: this.context });

        if (choice.retryFeedback) {
          solved = true;
          button.classList.add("wrong");
          for (const option of this.options.children) option.disabled = true;
          this.showRetryFeedback(node, choice.retryFeedback);
          return;
        }

        const acceptedBranch = Boolean(choice.next) || choice.accepted === true;
        if (!correct && !acceptedBranch) {
          button.classList.add("wrong");
          this.feedback.textContent = choice.feedbackWrong || node.feedbackWrong || "";
          return;
        }

        solved = true;
        button.classList.add(correct ? "correct" : "selected");
        for (const option of this.options.children) option.disabled = true;
        const correctFeedback = correct && hasCorrectAnswer
          ? (choice.feedbackCorrect || node.feedbackCorrect || "")
          : "";
        this.feedback.textContent = correctFeedback;
        this.hideChoices();

        if (choice.cue) {
          this.audio.playCue(choice.cue);
          this.scheduleAdvance(node, choice, 0);
          return;
        }

        if (choice.type === "media") {
          this.playMovie(node, choice);
          return;
        }

        if (choice.type === "action") {
          this.scheduleAdvance(node, choice, 120);
          return;
        }

        if (choice.emphasize === true) {
          this.showPlayerResponse(node, choice);
          return;
        }

        const isFinal = choice.complete === true || (
          choice.next == null &&
          this.index >= this.nodes.length - 1
        );
        const delay = correctFeedback
          ? (choice.feedbackHoldMs ?? node.feedbackHoldMs ?? CORRECT_FEEDBACK_HOLD_MS)
          : isFinal
            ? (choice.settleMs ?? node.settleMs ?? FINAL_SETTLE_MS)
            : 0;

        this.scheduleAdvance(node, choice, delay);
      });

      this.options.appendChild(button);
    });
  }

  showRetryFeedback(node, feedback) {
    this.transitionOut(() => {
      this.root.classList.remove("choice-mode", "response-mode", "action-mode", "player-response", "node-leaving");
      this.root.classList.add("npc-feedback", "node-entering");
      this.name.textContent = feedback.speaker || node.speaker || this.dialogue.speaker || "旁白";
      this.text.textContent = feedback.text;
      this.applyTextLength(feedback.text);
      this.options.replaceChildren();
      this.options.classList.remove("choices-visible", "choices-pending");
      this.options.setAttribute("aria-hidden", "true");
      this.feedback.textContent = "";
      requestAnimationFrame(() => requestAnimationFrame(() => this.root.classList.remove("node-entering")));
      this.scheduleRender(feedback.holdMs ?? 1400);
    });
  }

  scheduleRender(delay) {
    const token = this.runToken;
    clearTimeout(this.advanceTimer);
    this.advanceTimer = setTimeout(() => {
      if (token !== this.runToken || !this.isOpen()) return;
      this.transitionOut(() => this.render());
    }, delay);
  }

  showPlayerResponse(node, choice) {
    this.transitionOut(() => {
      this.root.classList.remove("choice-mode", "response-mode", "action-mode", "node-leaving");
      this.root.classList.add("player-response", "node-entering");
      this.name.textContent = choice.speaker || PLAYER_SPEAKER;
      this.label.textContent = "RED ARMY SOLDIER";
      this.mark.textContent = "红";
      this.text.textContent = choice.spokenText || choice.text;
      this.applyTextLength(choice.spokenText || choice.text);
      this.options.replaceChildren();
      this.concepts.replaceChildren();
      this.concepts.hidden = true;
      requestAnimationFrame(() => requestAnimationFrame(() => this.root.classList.remove("node-entering")));

      const holdMs = choice.holdMs ?? node.responseHoldMs ?? EMPHASIS_HOLD_MS;
      this.scheduleAdvance(node, choice, holdMs);
    });
  }

  playMovie(node, choice) {
    clearTimeout(this.choiceTimer);
    this.choicesReady = false;
    this.isResponding = true;
    this.root.classList.remove("choice-mode", "response-mode", "action-mode", "player-response");
    this.root.classList.add("movie-playing");
    this.options.replaceChildren();
    this.feedback.textContent = "";
    this.concepts.replaceChildren();
    this.concepts.hidden = true;

    const video = document.createElement("video");
    video.className = "dialogue-movie";
    video.controls = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.setAttribute("playsinline", "");
    video.src = node.source;
    this.movieElement = video;
    this.text.replaceChildren(video);

    const finish = async () => {
      await this.audio.releaseVideo(180);
      if (this.isOpen()) this.advance(node, choice);
    };
    video.addEventListener("ended", finish, { once: true });
    video.addEventListener("error", () => {
      this.feedback.textContent = "影片加载失败，请检查视频资源。";
      this.isResponding = false;
    }, { once: true });
    this.audio.attachVideo(video, { enabled: true, volume: node.volume ?? 1 }, 260);
  }

  scheduleAdvance(node, choice, delay) {
    const token = this.runToken;
    clearTimeout(this.advanceTimer);
    this.hideChoices();
    this.isResponding = true;
    this.advanceTimer = setTimeout(() => {
      if (token !== this.runToken || !this.isOpen()) return;
      this.transitionOut(() => this.advance(node, choice));
    }, delay);
  }

  advance(node, choice) {
    if (choice.complete === true) {
      this.finish();
      return;
    }

    if (choice.next) {
      const nextIndex = this.nodes.findIndex(candidate => candidate.id === choice.next);
      if (nextIndex < 0) throw new Error(`找不到下一对话节点：${choice.next}`);
      this.index = nextIndex;
    } else {
      this.index += 1;
    }
    this.render();
  }

  finish() {
    const completedDialogue = this.dialogue;
    const context = this.context;
    this.close(true);
    this.onComplete?.(completedDialogue, context);
  }

  close(completed) {
    if (!this.isOpen()) return;
    clearTimeout(this.advanceTimer);
    clearTimeout(this.choiceTimer);
    if (this.movieElement) {
      this.audio.releaseVideo(0);
      this.movieElement.pause();
      this.movieElement.removeAttribute("src");
      this.movieElement.load();
      this.movieElement = null;
    }
    this.runToken += 1;
    this.isResponding = false;
    this.choicesReady = false;
    this.options.classList.remove("choices-visible", "choices-pending");
    this.options.removeAttribute("aria-hidden");
    this.root.classList.remove("open", "choice-mode", "response-mode", "action-mode", "player-response", "npc-feedback", "movie-playing", "text-medium", "text-long", "node-entering", "node-leaving", "crossing-decision");
    delete this.root.dataset.dialogueTitle;
    this.root.setAttribute("aria-hidden", "true");
    this.viewport?.classList.remove("in-dialogue");
    this.audio.duck(false);
    this.onClose?.(completed, this.context);
  }
}
