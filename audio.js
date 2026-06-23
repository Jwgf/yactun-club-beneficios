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

    const t0 = c.currentTime;
    const t1 = t0 + duracionMs / 1000;

    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(volumen, t0 + 0.015);
    gain.gain.setValueAtTime(volumen, Math.max(t0 + 0.02, t1 - 0.035));
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(t0);
    osc.stop(t1 + 0.04);
  }

  function secuencia(lista) {
    let espera = 0;

    lista.forEach(function (item) {
      setTimeout(function () {
        tono(item.f, item.d, item.v || 0.75, item.t || "square");
      }, espera);

      espera += item.d + (item.p || 55);
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
      tono(850, 110, 0.65, "square");
    },

    ok: function () {
      vibrar(50);
      secuencia([
        { f: 720, d: 130, v: 0.75 },
        { f: 980, d: 170, v: 0.75 }
      ]);
    },

    scan: function () {
      vibrar(45);
      secuencia([
        { f: 1150, d: 110, v: 0.78 },
        { f: 1500, d: 130, v: 0.78 }
      ]);
    },

    premio: function () {
      vibrar([70, 40, 70]);
      secuencia([
        { f: 660, d: 130, v: 0.78 },
        { f: 880, d: 150, v: 0.78 },
        { f: 1200, d: 220, v: 0.78 }
      ]);
    },

    error: function () {
      vibrar(150);
      secuencia([
        { f: 260, d: 220, v: 0.8 },
        { f: 170, d: 260, v: 0.8 }
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
