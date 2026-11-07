(function () {
  "use strict";

  const CARDS = {
    ruijin: { lines: ["《瑞金篇》", "转移筹划", "1934年5月起", "江西瑞金"] },
    yudu: {
      lines: ["《于都篇》", "于都河畔", "1934年10月", "江西于都"],
      action: { label: "进入本章", event: "lm:start-yudu-chapter" },
      holdEntry: true
    },
    zunyi: {
      lines: ["《遵义篇》", "伟大转折", "1935年1月", "贵州遵义"],
      action: { label: "进入本章", event: "lm:start-zunyi-chapter" },
      holdEntry: true
    },
    chishui: {
      lines: ["《赤水篇》", "四渡赤水", "1935年初", "川黔滇边"],
      action: { label: "进入本章", event: "lm:start-chishui-chapter" },
      holdEntry: true
    },
    jinshajiang: { lines: ["《金沙江篇》", "巧渡金沙江", "1935年5月", "云南金沙江"] },
    luding: {
      lines: ["《泸定桥篇》", "飞夺泸定桥", "1935年5月", "四川大渡河"],
      action: { label: "开始本章", event: "lm:start-luding-chapter" },
      holdEntry: true
    },
    snowgrass: {
      lines: ["《雪山草地篇》", "雪山草地", "1935年夏", "川西高原"],
      action: { label: "进入本章", target: "#enterButton" },
      holdEntry: true
    },
    final: {
      lines: ["《会宁会师篇》", "万里征途", "1936年10月", "甘肃会宁"],
      action: { label: "进入终章", target: "#cinematicAdvance" },
      holdEntry: true
    }
  };

  function sceneKey() {
    return location.pathname.replace(/\\/g, "/").toLowerCase().match(/\/scenes\/([^/]+)/)?.[1] || "";
  }

  function skipExistingChapterCard(key) {
    return key === "xiangjiang";
  }

  function close(card) {
    if (!card || card.classList.contains("is-leaving")) return;
    document.body.classList.remove("lm-titlecard-pending");
    document.body.classList.remove("lm-titlecard-holding-entry");
    card.classList.add("is-leaving");
    window.setTimeout(() => card.remove(), 1200);
  }

  function triggerOriginalEntry(card, action) {
    const original = action?.target ? document.querySelector(action.target) : null;
    if (original && typeof original.click === "function") original.click();
    if (action?.event) {
      window.__longMarchTitlecardEvents = window.__longMarchTitlecardEvents || {};
      window.__longMarchTitlecardEvents[action.event] = true;
      window.dispatchEvent(new CustomEvent(action.event, { detail: { source: "chapter-titlecard" } }));
    }
    close(card);
  }

  function build() {
    if (window.LongMarchClassroom?.teacher) {
      document.body.classList.remove("lm-titlecard-pending", "lm-titlecard-holding-entry");
      const event = CARDS[sceneKey()]?.action?.event;
      if(event){ window.__longMarchTitlecardEvents = window.__longMarchTitlecardEvents || {}; window.__longMarchTitlecardEvents[event] = true; window.dispatchEvent(new Event(event)); }
      return;
    }
    const key = sceneKey();
    if (skipExistingChapterCard(key)) {
      document.body.classList.remove("lm-titlecard-pending");
      return;
    }
    const data = CARDS[key];
    if (!data) {
      document.body.classList.remove("lm-titlecard-pending");
      return;
    }
    const [title, subtitle, time, place] = data.lines;
    const manualEntry = !!data.action;
    const card = document.createElement("section");
    card.className = `lm-chapter-titlecard${manualEntry ? " lm-chapter-titlecard--manual" : ""}`;
    card.setAttribute("aria-label", `${title}开篇标题`);
    card.innerHTML = `
      <div class="lm-chapter-titlecard__lines">
        <p class="lm-chapter-titlecard__kicker">《长征》</p>
        <h2 class="lm-chapter-titlecard__title">${title}</h2>
        <strong class="lm-chapter-titlecard__subtitle">${subtitle}</strong>
        <time class="lm-chapter-titlecard__time">${time}</time>
        <span class="lm-chapter-titlecard__place">${place}</span>
        ${manualEntry ? `<button class="lm-chapter-titlecard__action" type="button">${data.action.label}</button>` : ""}
      </div>
      ${manualEntry ? "" : `<button class="lm-chapter-titlecard__skip" type="button">跳过</button>`}
    `;
    if (data.holdEntry) document.body.classList.add("lm-titlecard-holding-entry");
    document.body.appendChild(card);
    // The card is now in the DOM and covers the chapter surface. Release the
    // pre-paint guard so the original chapter can finish initializing beneath it.
    document.body.classList.remove("lm-titlecard-pending");
    const lines = Array.from(card.querySelectorAll(".lm-chapter-titlecard__lines > *"));
    lines.forEach((line, index) => {
      window.setTimeout(() => line.classList.add("revealed"), 220 + index * 320);
    });
    const closeNow = () => close(card);
    const actionButton = card.querySelector(".lm-chapter-titlecard__action");
    const skipButton = card.querySelector(".lm-chapter-titlecard__skip");
    if (actionButton) actionButton.addEventListener("click", () => triggerOriginalEntry(card, data.action));
    if (skipButton) skipButton.addEventListener("click", closeNow);
    if (!manualEntry) {
      card.addEventListener("click", event => {
        if (event.target === card) closeNow();
      });
    }
    const onKey = event => {
      if (event.key !== " " && event.key !== "Enter" && event.key !== "Escape") return;
      if (manualEntry) {
        if (event.key === "Escape") return;
        triggerOriginalEntry(card, data.action);
      } else {
        closeNow();
      }
      window.removeEventListener("keydown", onKey, true);
    };
    window.addEventListener("keydown", onKey, true);
    if (!manualEntry) window.setTimeout(closeNow, 3100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build, { once: true });
  } else {
    build();
  }
})();
