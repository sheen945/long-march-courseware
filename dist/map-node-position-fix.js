(() => {
  "use strict";

  const names = ["瑞金", "于都"];
  const minimumSeparation = 44;
  const anchors = new Map();
  const observed = new WeakSet();
  const positionPattern = /translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)\s*$/;

  function readProjectedPosition(anchor) {
    const match = anchor.style.transform.match(positionPattern);
    if (!match) return null;
    return { x: Number(match[1]), y: Number(match[2]) };
  }

  function setMargin(anchor, x, y) {
    const nextLeft = `${x.toFixed(3)}px`;
    const nextTop = `${y.toFixed(3)}px`;
    if (anchor.style.marginLeft !== nextLeft) anchor.style.marginLeft = nextLeft;
    if (anchor.style.marginTop !== nextTop) anchor.style.marginTop = nextTop;
  }

  function updatePair() {
    const ruijin = anchors.get("瑞金");
    const yudu = anchors.get("于都");
    if (!ruijin || !yudu) return;

    const ruijinPosition = readProjectedPosition(ruijin);
    const yuduPosition = readProjectedPosition(yudu);
    if (!ruijinPosition || !yuduPosition) return;

    const dx = ruijinPosition.x - yuduPosition.x;
    const dy = ruijinPosition.y - yuduPosition.y;
    const distance = Math.hypot(dx, dy);

    if (distance >= minimumSeparation) {
      setMargin(ruijin, 0, 0);
      setMargin(yudu, 0, 0);
      return;
    }

    const directionX = distance > 0.01 ? dx / distance : 1;
    const directionY = distance > 0.01 ? dy / distance : 0;
    const push = (minimumSeparation - distance) / 2;

    setMargin(ruijin, directionX * push, directionY * push);
    setMargin(yudu, -directionX * push, -directionY * push);
  }

  const positionObserver = new MutationObserver(updatePair);

  function discoverAnchors() {
    document.querySelectorAll(".node-anchor").forEach(anchor => {
      const name = anchor.querySelector(".node-name")?.textContent?.trim();
      if (!names.includes(name)) return;

      anchors.set(name, anchor);
      if (!observed.has(anchor)) {
        observed.add(anchor);
        positionObserver.observe(anchor, {
          attributes: true,
          attributeFilter: ["style"],
        });
      }
    });
    updatePair();
  }

  new MutationObserver(discoverAnchors).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  discoverAnchors();
})();
