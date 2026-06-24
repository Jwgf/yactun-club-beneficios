(function () {
  "use strict";

  const sonidos = {
    tap: new Audio("../assets/audio/tap.wav"),
    ok: new Audio("../assets/audio/ok.wav"),
    scan: new Audio("../assets/audio/scan.wav"),
    premio: new Audio("../assets/audio/premio.wav"),
    error: new Audio("../assets/audio/error.wav")
  };

  let habilitado = false;
  const ultimoTexto = new WeakMap();

  Object.keys(sonidos).forEach(function (k) {
    sonidos[k].preload = "auto";
    sonidos[k].volume = 1.0;
  });

  function play(nombre) {
    if (!habilitado) return;

    const a = sonidos[nombre];
    if (!a) return;

    try {
      a.pause();
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) {
        p.catch(function () {});
      }
    } catch (err) {}
  }

  function analizarMensaje(txt) {
    const t = String(txt || "").toLowerCase();

    if (!t) return;

    if (
      t.indexOf("pin incorrecto") >= 0 ||
      t.indexOf("no se pudo") >= 0 ||
      t.indexOf("error") >= 0 ||
      t.indexOf("no encontrado") >= 0 ||
      t.indexOf("ingresa el pin") >= 0 ||
      t.indexOf("ingresá el pin") >= 0
    ) {
      play("error");
      return;
    }

    if (
      t.indexOf("qr leido") >= 0 ||
      t.indexOf("qr leído") >= 0
    ) {
      play("scan");
      return;
    }

    if (
      t.indexOf("gano premio") >= 0 ||
      t.indexOf("ganó premio") >= 0 ||
      t.indexOf("premio entregado") >= 0 ||
      t.indexOf("premio pendiente") >= 0
    ) {
      play("premio");
      return;
    }

    if (
      t.indexOf("cliente encontrado") >= 0 ||
      t.indexOf("compra registrada") >= 0 ||
      t.indexOf("pin correcto") >= 0
    ) {
      play("ok");
    }
  }

  function observarMensajes() {
    const nodos = document.querySelectorAll(".msg, #busquedaMsg, #clienteMsg, #loginMsg");

    nodos.forEach(function (el) {
      if (el.dataset.audioObs === "1") return;
      el.dataset.audioObs = "1";

      const obs = new MutationObserver(function () {
        const txt = el.textContent || "";
        const previo = ultimoTexto.get(el);

        if (txt && txt !== previo) {
          ultimoTexto.set(el, txt);
          analizarMensaje(txt);
        }
      });

      obs.observe(el, {
        childList: true,
        characterData: true,
        subtree: true
      });
    });
  }

  document.addEventListener("pointerdown", function () {
    habilitado = true;
  }, { passive: true });

  document.addEventListener("click", function (ev) {
    const btn = ev.target.closest("button");
    if (!btn) return;

    habilitado = true;
    play("tap");
  });

  document.addEventListener("DOMContentLoaded", observarMensajes);
  window.addEventListener("load", observarMensajes);

  window.YactunSonido = {
    play: play
  };
})();
