const SHOW_HOTSPOT_DEBUG = false;

export class HotspotLayer {
  constructor({ element, viewer, onActivate }) {
    this.element = element;
    this.viewer = viewer;
    this.onActivate = onActivate;
    this.hotspots = [];
    this.elements = new Map();
    this.layouts = new Map();
    this.pointer = null;
    this.element.classList.toggle("show-hotspot-debug", SHOW_HOTSPOT_DEBUG);
    viewer.viewport.addEventListener("pointermove", event => {
      if (event.pointerType === "touch") return;
      this.pointer = { x: event.clientX, y: event.clientY };
      this.updateProximity();
    }, { passive: true });
    viewer.viewport.addEventListener("pointerleave", () => {
      this.pointer = null;
      this.updateProximity();
    }, { passive: true });
  }

  setHotspots(hotspots, state) {
    this.hotspots = hotspots;
    this.elements.clear();
    this.layouts.clear();
    this.element.replaceChildren();
    for (const hotspot of hotspots) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `hotspot hotspot-hitbox ${hotspot.kind || "npc"}`;
      button.dataset.id = hotspot.id;
      button.dataset.kind = hotspot.kind || "npc";
      button.setAttribute("aria-label", hotspot.label);
      const prompt = document.createElement("span");
      prompt.className = "hotspot-label talk-prompt";
      prompt.setAttribute("aria-hidden", "true");
      prompt.textContent = (hotspot.kind || "npc") === "npc" ? "交谈" : hotspot.label;
      button.appendChild(prompt);
      if (state.completedHotspots.includes(hotspot.id)) button.classList.add("completed");
      button.addEventListener("click", event => { event.stopPropagation(); this.onActivate(hotspot, button); });
      this.element.appendChild(button);
      this.elements.set(hotspot.id, button);
    }
    this.update();
  }

  update() {
    this.layouts.clear();
    for (const hotspot of this.hotspots) {
      const button = this.elements.get(hotspot.id);
      const rect = this.viewer.projectBounds(hotspot.bounds);
      button.classList.toggle("visible", rect.visible);
      if (!rect.visible) {
        button.classList.remove("near", "view-focused");
        continue;
      }
      const minWidth = hotspot.kind === "continue" ? 100 : 56;
      const minHeight = hotspot.kind === "continue" ? 90 : 105;
      const width = Math.max(minWidth, rect.right - rect.left);
      const height = Math.max(minHeight, rect.bottom - rect.top);
      button.style.left = `${(rect.left + rect.right - width) / 2}px`;
      button.style.top = `${(rect.top + rect.bottom - height) / 2}px`;
      button.style.width = `${width}px`;
      button.style.height = `${height}px`;
      this.layouts.set(hotspot.id, {
        left: (rect.left + rect.right - width) / 2,
        top: (rect.top + rect.bottom - height) / 2,
        right: (rect.left + rect.right + width) / 2,
        bottom: (rect.top + rect.bottom + height) / 2
      });
      const centerX = this.viewer.viewport.clientWidth / 2;
      const centerY = this.viewer.viewport.clientHeight / 2;
      const dx = Math.max(rect.left - centerX, 0, centerX - rect.right);
      const dy = Math.max(rect.top - centerY, 0, centerY - rect.bottom);
      button.classList.toggle("view-focused", Math.hypot(dx, dy) <= 48);
    }
    this.updateProximity();
  }

  updateProximity() {
    for (const [id, button] of this.elements) {
      const rect = this.layouts.get(id);
      if (!this.pointer || !rect || !button.classList.contains("visible")) {
        button.classList.remove("near");
        continue;
      }
      const dx = Math.max(rect.left - this.pointer.x, 0, this.pointer.x - rect.right);
      const dy = Math.max(rect.top - this.pointer.y, 0, this.pointer.y - rect.bottom);
      button.classList.toggle("near", Math.hypot(dx, dy) <= 84);
    }
  }
}
