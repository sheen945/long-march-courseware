(() => {
  "use strict";

  // Keep wheel zoom inside the map without allowing the document to reflow.
  window.addEventListener("wheel", event => {
    const target = event.target;
    if (target instanceof Element && target.closest(".map-stage")) {
      event.preventDefault();
    }
  }, { capture: true, passive: false });
})();
