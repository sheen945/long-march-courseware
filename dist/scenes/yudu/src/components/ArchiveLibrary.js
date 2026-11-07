export class ArchiveLibrary {
  constructor({ root, records, onOpen, onClose }) {
    this.root = root;
    this.records = new Map(records.map(record => [record.id, record]));
    this.onOpen = onOpen;
    this.onClose = onClose;
    this.content = root.querySelector("#archiveContent");
    this.closeButton = root.querySelector("#archiveClose");
    this.backdrop = root.querySelector("#archiveBackdrop");
    this.scrollContainer = root.closest(".viewport");
    this.closeButton.addEventListener("click", () => this.close());
    this.backdrop.addEventListener("click", () => this.close());
    addEventListener("keydown", event => { if (event.key === "Escape" && this.isOpen()) this.close(); });
  }

  isOpen() { return window.LongMarchTeaching?.isOpen() || this.root.classList.contains("open"); }

  captureScroll() {
    if (!this.scrollContainer) return;
    this.savedScroll = {
      left: this.scrollContainer.scrollLeft,
      top: this.scrollContainer.scrollTop
    };
  }

  restoreScroll() {
    if (!this.scrollContainer || !this.savedScroll) return;
    this.scrollContainer.scrollLeft = this.savedScroll.left;
    this.scrollContainer.scrollTop = this.savedScroll.top;
  }

  open(id, returnFocus = document.activeElement) {
    if (window.LongMarchTeaching?.openArchive(id, { onClose: () => { this.onClose?.(); this.restoreScroll(); } })) { this.captureScroll(); this.onOpen?.(); return true; }
    const record = this.records.get(id);
    if (!record) return false;
    this.returnFocus = returnFocus;
    this.captureScroll();
    this.renderRecord(record);
    if (!this.isOpen()) this.onOpen?.();
    this.root.classList.add("open");
    this.root.setAttribute("aria-hidden", "false");
    this.closeButton.focus({ preventScroll: true });
    this.restoreScroll();
    return true;
  }

  openIndex(unlockedIds, chapterId) {
    this.returnFocus = document.activeElement;
    this.captureScroll();
    this.content.replaceChildren();
    const heading = document.createElement("h2");
    heading.textContent = "已收录档案";
    const intro = document.createElement("p");
    intro.textContent = "档案库跨章节共用。完成场景互动后，相关人物、事件与文物档案将在这里解锁。";
    const list = document.createElement("div");
    list.className = "archive-index";
    for (const record of this.records.values()) {
      if (record.chapter !== chapterId && record.chapter !== "common") continue;
      const unlocked = unlockedIds.includes(record.id);
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("locked", !unlocked);
      button.disabled = !unlocked;
      button.textContent = unlocked ? record.title : "尚未解锁";
      const small = document.createElement("small");
      small.textContent = unlocked ? record.type : "完成对应人物交谈后解锁";
      button.appendChild(small);
      if (unlocked) button.addEventListener("click", () => this.renderRecord(record));
      list.appendChild(button);
    }
    this.content.append(heading, intro, list);
    if (!this.isOpen()) this.onOpen?.();
    this.root.classList.add("open");
    this.root.setAttribute("aria-hidden", "false");
    this.closeButton.focus({ preventScroll: true });
    this.restoreScroll();
  }

  renderRecord(record) {
    this.content.replaceChildren();
    const image = document.createElement("div");
    image.className = "archive-image";
    if (record.image) {
      image.classList.add("has-image");
      const picture = document.createElement("img");
      picture.src = record.image;
      picture.alt = record.title || record.name || "历史档案图片";
      picture.loading = "eager";
      picture.addEventListener("error", () => {
        image.classList.remove("has-image");
        image.replaceChildren(Object.assign(document.createElement("span"), { textContent: "历史图片暂不可用" }));
      }, { once: true });
      image.appendChild(picture);
    } else {
      const imageLabel = document.createElement("span");
      imageLabel.textContent = "历史图片待补充";
      image.appendChild(imageLabel);
    }
    const type = document.createElement("p");
    type.className = "archive-type";
    type.textContent = record.type;
    const title = document.createElement("h2");
    title.id = "archiveTitle";
    title.textContent = record.title;
    const name = document.createElement("p");
    name.className = "archive-name";
    name.textContent = record.name || record.event || "长征历史档案";
    this.content.append(image, type, title, name);
    this.addSection("历史事件", record.event);
    this.addSection("档案内容", record.content);
    this.addSection("文物介绍", record.artifact);
    if (record.sources?.length) {
      const heading = document.createElement("h3");
      heading.textContent = "资料来源";
      this.content.appendChild(heading);
      for (const source of record.sources) {
        const link = document.createElement("a");
        link.className = "archive-source";
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = source.label;
        this.content.appendChild(link);
      }
    }
  }

  addSection(title, content) {
    if (!content) return;
    const heading = document.createElement("h3");
    heading.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent = content;
    this.content.append(heading, paragraph);
  }

  close() {
    if(window.LongMarchTeaching?.isOpen()) { window.LongMarchTeaching.close(); return; }
    if (!this.isOpen()) return;
    this.root.classList.remove("open");
    this.root.setAttribute("aria-hidden", "true");
    this.onClose?.();
    this.returnFocus?.focus?.({ preventScroll: true });
    this.restoreScroll();
    this.savedScroll = null;
  }
}
