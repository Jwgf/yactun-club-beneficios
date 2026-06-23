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

  function tono(freq, duracionMs, volumen) {
    const c = crearContexto();
    if (!c || !habilitado) return;

    const osc = c.createOscillator();
    const gain = c.createGain();

    osc.type = "sine";
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
        tono(item.f, item.d, item.v || 0.09);
      }, espera);

      espera += item.d + (item.p || 35);
    });
  }

  const YactunAudio = {
    unlock: unlock,

    tap: function () {
      tono(720, 45, 0.06);
    },

    ok: function () {
      secuencia([
        { f: 660, d: 80, v: 0.085 },
        { f: 880, d: 110, v: 0.085 }
      ]);
    },

    scan: function () {
      secuencia([
        { f: 980, d: 55, v: 0.085 },
        { f: 1280, d: 70, v: 0.085 }
      ]);
    },

    premio: function () {
      secuencia([
        { f: 660, d: 90, v: 0.095 },
        { f: 880, d: 100, v: 0.095 },
        { f: 1180, d: 140, v: 0.095 }
      ]);
    },

    error: function () {
      secuencia([
        { f: 220, d: 140, v: 0.09 },
        { f: 160, d: 180, v: 0.09 }
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
