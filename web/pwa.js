(function () {
  "use strict";

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js?v=2", {
        updateViaCache: "none"
      }).then(function (registration) {
        registration.update();

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      }).catch(function () {
        // No mostramos error al usuario.
      });
    });

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && navigator.serviceWorker.controller) {
        navigator.serviceWorker.getRegistration().then(function (registration) {
          if (registration) {
            registration.update();
          }
        });
      }
    });
  }
})();
