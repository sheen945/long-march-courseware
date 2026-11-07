const SVG_NS = "http://www.w3.org/2000/svg";

export class ChapterMap {
  constructor({ root, onClose }) {
    this.root = root;
    this.onClose = onClose;
    this.eyebrow = root.querySelector("#mapEyebrow");
    this.title = root.querySelector("#mapTitle");
    this.stage = root.querySelector("#mapStage");
    this.status = root.querySelector("#mapStatus");
    this.closeButton = root.querySelector("#mapClose");
    this.closeButton.addEventListener("click", () => this.close());
    addEventListener("keydown", event => {
      if (event.key === "Escape" && this.isOpen()) this.close();
    });
  }

  isOpen() {
    return this.root.classList.contains("open");
  }

  open(config = {}) {
    this.render(config);
    this.root.classList.add("open");
    this.root.setAttribute("aria-hidden", "false");
    requestAnimationFrame(() => this.root.classList.add("animate"));
  }

  render(config) {
    this.root.classList.remove("animate");
    this.eyebrow.textContent = config.eyebrow || "长征路线";
    this.title.textContent = config.title || "章节完成";
    this.status.textContent = config.status || "";
    this.closeButton.textContent = config.closeLabel || "返回章节";
    this.stage.replaceChildren();

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 1000 420");
    svg.setAttribute("aria-hidden", "true");
    svg.classList.add("map-route");
    for (const [className, pathData] of [
      ["route-base", config.basePath],
      ["route-completed", config.completedPath],
      ["route-next", config.nextPath]
    ]) {
      if (!pathData) continue;
      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", pathData);
      path.classList.add(className);
      svg.appendChild(path);
    }
    this.stage.appendChild(svg);

    for (const node of config.nodes || []) {
      const marker = document.createElement("div");
      marker.className = `map-node ${node.state || ""}`.trim();
      marker.style.left = `${node.x}%`;
      marker.style.top = `${node.y}%`;
      marker.dataset.node = node.id || node.label;

      const dot = document.createElement("span");
      dot.className = "map-node-dot";
      const label = document.createElement("strong");
      label.textContent = node.label;
      marker.append(dot, label);

      if (node.state === "current") {
        const flag = document.createElement("i");
        flag.className = "map-flag";
        flag.setAttribute("aria-hidden", "true");
        marker.appendChild(flag);
      }
      this.stage.appendChild(marker);
    }
  }

  close({ silent = false } = {}) {
    if (!this.isOpen()) return;
    this.root.classList.remove("open", "animate");
    this.root.setAttribute("aria-hidden", "true");
    if (!silent) this.onClose?.();
  }
}
