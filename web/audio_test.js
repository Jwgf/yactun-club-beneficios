(function () {
  "use strict";

  const msg = document.getElementById("msg");

  const sonidos = {
    tap: new Audio("assets/audio/tap.wav"),
    ok: new Audio("assets/audio/ok.wav"),
    scan: new Audio("assets/audio/scan.wav"),
    premio: new Audio("assets/audio/premio.wav"),
    error: new Audio("assets/audio/error.wav")
  };

  Object.keys(sonidos).forEach(function (k) {
    sonidos[k].preload = "auto";
    sonidos[k].volume = 1.0;
  });

  function setMsg(t, tipo) {
    msg.textContent = t || "";
    msg.classList.remove("ok", "error");
    if (tipo) msg.classList.add(tipo);
  }

  function play(nombre) {
    const a = sonidos[nombre];
    if (!a) return;

    try {
      a.pause();
      a.currentTime = 0;
      const p = a.play();

      if (p && p.catch) {
        p.catch(function (err) {
          setMsg("El navegador bloqueo el audio. Toca Activar audio primero.", "error");
        });
      }

      setMsg("Sonido: " + nombre, "ok");
    } catch (err) {
      setMsg("Error de audio: " + err.message, "error");
    }
  }

  document.getElementById("btnActivar").onclick = function () {
    play("tap");
    setMsg("Audio activado", "ok");
  };

  document.getElementById("btnTap").onclick = function () { play("tap"); };
  document.getElementById("btnOk").onclick = function () { play("ok"); };
  document.getElementById("btnScan").onclick = function () { play("scan"); };
  document.getElementById("btnPremio").onclick = function () { play("premio"); };
  document.getElementById("btnError").onclick = function () { play("error"); };
})();
