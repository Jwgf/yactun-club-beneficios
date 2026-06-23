(function () {
  "use strict";

  let ctx = null;
  let habilitado = false;

  function crearContexto() {
    if (ctx) return ctx;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    ctx = new AudioContextClass();
    return ctx;
  }

  function unlock() {
    const c = crearContexto();
    if (!c) return;

    if (c.state === "suspended") {
      c.resume().catch(function () {});
    }

    habilitado = true;
  }

  function tono(freq, duracionMs, volumen, tipo) {
    const c = crearContexto();
    if (!c || !habilitado) return;

    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = tipo || "square";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(volumen, c.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duracionMs / 1000);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start();
    osc.stop(c.currentTime + duracionMs / 1000 + 0.03);
  }

  function secuencia(lista) {
    let espera = 0;

    lista.forEach(function (item) {
      setTimeout(function () {
        tono(item.f, item.d, item.v || 0.22, item.t || "square");
      }, espera);

      espera += item.d + (item.p || 45);
    });
  }

  function vibrar(ms) {
    if (navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }

  const YactunAudio = {
    unlock: unlock,

    tap: function () {
      tono(760, 55, 0.20, "square");
    },

    ok: function () {
      vibrar(40);
      secuencia([
        { f: 660, d: 90, v: 0.24 },
        { f: 920, d: 120, v: 0.24 }
      ]);
    },

    scan: function () {
      vibrar(35);
      secuencia([
        { f: 1100, d: 70, v: 0.25 },
        { f: 1450, d: 80, v: 0.25 }
      ]);
    },

    premio: function () {
      vibrar([60, 40, 60]);
      secuencia([
        { f: 660, d: 100, v: 0.26 },
        { f: 880, d: 120, v: 0.26 },
        { f: 1180, d: 160, v: 0.26 }
      ]);
    },

    error: function () {
      vibrar(120);
      secuencia([
        { f: 240, d: 170, v: 0.28 },
        { f: 160, d: 220, v: 0.28 }
      ]);
    }
  };

  window.YactunAudio = YactunAudio;

  document.addEventListener("pointerdown", function () {
    unlock();
  }, { once: false });

  document.addEventListener("click", function (ev) {
    const boton = ev.target.closest("button");
    if (!boton) return;
    if (boton.dataset.noAudio === "1") return;

    unlock();
    YactunAudio.tap();
  });
})();
