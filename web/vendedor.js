window.addEventListener("load", function () {
  const API_URL = YACTUN_CONFIG.API_URL;

  const loginBox = document.getElementById("loginBox");
  const busquedaBox = document.getElementById("busquedaBox");
  const clienteBox = document.getElementById("clienteBox");

  const vendedorInput = document.getElementById("vendedorInput");
  const pinInput = document.getElementById("pinInput");
  const entrarBtn = document.getElementById("entrarBtn");
  const loginMsg = document.getElementById("loginMsg");

  const codigoInput = document.getElementById("codigoInput");
  const buscarBtn = document.getElementById("buscarBtn");
  const busquedaMsg = document.getElementById("busquedaMsg");

  const clienteNombreTxt = document.getElementById("clienteNombreTxt");
  const clienteCodigoTxt = document.getElementById("clienteCodigoTxt");
  const clientePuntosTxt = document.getElementById("clientePuntosTxt");
  const clienteMetaTxt = document.getElementById("clienteMetaTxt");
  const premioPendienteTxt = document.getElementById("premioPendienteTxt");

  const sumarCompraBtn = document.getElementById("sumarCompraBtn");
  const entregarPremioBtn = document.getElementById("entregarPremioBtn");
  const otroClienteBtn = document.getElementById("otroClienteBtn");
  const clienteMsg = document.getElementById("clienteMsg");

  let vendedorNombre = "Vendedor";
  let vendedorPin = "";
  let clienteActual = null;
  let configActual = {
    meta: 5,
    premio: "250 g de mix especial"
  };

  vendedorInput.value = localStorage.getItem("yactun_vendedor_nombre") || "Vendedor";
  pinInput.value = localStorage.getItem("yactun_vendedor_pin") || "";

  loginMsg.textContent = "Pantalla vendedor lista.";
  loginMsg.classList.add("ok");

  entrarBtn.onclick = function () {
    vendedorNombre = vendedorInput.value.trim() || "Vendedor";
    vendedorPin = pinInput.value.trim();

    if (!vendedorPin) {
      setMsg(loginMsg, "Ingresá el PIN vendedor.", "error");
      return;
    }

    localStorage.setItem("yactun_vendedor_nombre", vendedorNombre);
    localStorage.setItem("yactun_vendedor_pin", vendedorPin);

    loginBox.classList.add("hidden");
    busquedaBox.classList.remove("hidden");
    clienteBox.classList.add("hidden");

    setMsg(busquedaMsg, "Ingresá el código del cliente.", "");
    codigoInput.focus();
  };

  buscarBtn.onclick = buscarCliente;

  codigoInput.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") {
      buscarCliente();
    }
  });

  otroClienteBtn.onclick = function () {
    clienteActual = null;
    codigoInput.value = "";
    clienteBox.classList.add("hidden");
    busquedaBox.classList.remove("hidden");
    setMsg(busquedaMsg, "Ingresá el código del cliente.", "");
    setMsg(clienteMsg, "", "");
    codigoInput.focus();
  };

  function setMsg(el, texto, tipo) {
    if (!el) return;

    el.textContent = texto || "";
    el.classList.remove("error", "ok");

    if (tipo) {
      el.classList.add(tipo);
    }
  }

  function jsonp(params) {
    return new Promise(function (resolve, reject) {
      const callbackName = "jsonp_cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

      params.callback = callbackName;

      const url = API_URL + "?" + new URLSearchParams(params).toString();

      const script = document.createElement("script");
      script.src = url;
      script.async = true;

      const timeout = setTimeout(function () {
        cleanup();
        reject(new Error("Tiempo de espera agotado"));
      }, 30000);

      window[callbackName] = function (data) {
        cleanup();
        resolve(data);
      };

      script.onerror = function () {
        cleanup();
        reject(new Error("No se pudo conectar con el servidor"));
      };

      function cleanup() {
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      }

      document.body.appendChild(script);
    });
  }

  async function buscarCliente() {
    const codigo = codigoInput.value.trim();

    if (!codigo) {
      setMsg(busquedaMsg, "Ingresá el código del cliente.", "error");
      return;
    }

    buscarBtn.disabled = true;
    setMsg(busquedaMsg, "Consultando cliente...", "");

    try {
      const data = await jsonp({
        action: "consultarCliente",
        codigo: codigo
      });

      if (!data.ok) {
        setMsg(busquedaMsg, data.mensaje || "Cliente no encontrado.", "error");
        return;
      }

      clienteActual = data.cliente;
      configActual = data.config || configActual;

      clienteNombreTxt.textContent = clienteActual.nombre || "Cliente";
      clienteCodigoTxt.textContent = clienteActual.codigo || "------";
      clientePuntosTxt.textContent = clienteActual.puntosActuales || 0;
      clienteMetaTxt.textContent = configActual.meta || 5;

      if ((clienteActual.premiosPendientes || 0) > 0) {
        premioPendienteTxt.textContent = "🎁 Premio pendiente: " + (configActual.premio || "");
        premioPendienteTxt.classList.remove("hidden");
        entregarPremioBtn.classList.remove("hidden");
      } else {
        premioPendienteTxt.classList.add("hidden");
        entregarPremioBtn.classList.add("hidden");
      }

      busquedaBox.classList.add("hidden");
      clienteBox.classList.remove("hidden");

      setMsg(clienteMsg, "Cliente encontrado.", "ok");
    } catch (err) {
      setMsg(busquedaMsg, err.message, "error");
    } finally {
      buscarBtn.disabled = false;
    }
  }
});
