(() => {
  "use strict";

  function removeOverlayButton() {
    document.querySelectorAll(".scene-close").forEach(button => button.remove());
  }

  removeOverlayButton();
  new MutationObserver(removeOverlayButton).observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
