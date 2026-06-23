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

  const iniciarScannerBtn = document.getElementById("iniciarScannerBtn");
  const detenerScannerBtn = document.getElementById("detenerScannerBtn");
  const scannerBox = document.getElementById("scannerBox");
  const qrReader = document.getElementById("qrReader");

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
  let scanner = null;
  let scannerActivo = false;

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

    setMsg(busquedaMsg, "Escaneá el QR o ingresá el código del cliente.", "");
    codigoInput.focus();
  };

  buscarBtn.onclick = buscarCliente;
  sumarCompraBtn.onclick = sumarCompra;
  entregarPremioBtn.onclick = entregarPremio;
  iniciarScannerBtn.onclick = iniciarScanner;
  detenerScannerBtn.onclick = detenerScanner;

  codigoInput.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") {
      buscarCliente();
    }
  });

  otroClienteBtn.onclick = async function () {
    await detenerScanner();

    clienteActual = null;
    codigoInput.value = "";

    clienteBox.classList.add("hidden");
    busquedaBox.classList.remove("hidden");

    setMsg(busquedaMsg, "Escaneá el QR o ingresá el código del cliente.", "");
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

  async function iniciarScanner() {
    if (scannerActivo) return;

    if (typeof Html5Qrcode === "undefined") {
      setMsg(busquedaMsg, "No se cargó la librería del lector QR.", "error");
      return;
    }

    scannerBox.classList.remove("hidden");
    iniciarScannerBtn.classList.add("hidden");
    detenerScannerBtn.classList.remove("hidden");

    setMsg(busquedaMsg, "Iniciando cámara...", "");

    try {
      scanner = new Html5Qrcode("qrReader");

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 }
        },
        async function (decodedText) {
          const codigo = extraerCodigoDesdeQR(decodedText);

          if (!codigo) {
            setMsg(busquedaMsg, "QR no reconocido.", "error");
            return;
          }

          codigoInput.value = codigo;
          setMsg(busquedaMsg, "QR leído. Consultando cliente...", "ok");

          await detenerScanner();
          buscarCliente();
        },
        function () {
          // Errores de lectura cuadro a cuadro: se ignoran.
        }
      );

      scannerActivo = true;
      setMsg(busquedaMsg, "Apuntá la cámara al QR del cliente.", "");
    } catch (err) {
      scannerActivo = false;
      scannerBox.classList.add("hidden");
      iniciarScannerBtn.classList.remove("hidden");
      detenerScannerBtn.classList.add("hidden");

      setMsg(busquedaMsg, "No se pudo iniciar la cámara: " + (err && err.message ? err.message : String(err)), "error");
    }
  }

  async function detenerScanner() {
    if (!scanner || !scannerActivo) {
      scannerBox.classList.add("hidden");
      iniciarScannerBtn.classList.remove("hidden");
      detenerScannerBtn.classList.add("hidden");
      return;
    }

    try {
      await scanner.stop();
      scanner.clear();
    } catch (err) {
      // No hacemos nada.
    }

    scanner = null;
    scannerActivo = false;

    scannerBox.classList.add("hidden");
    iniciarScannerBtn.classList.remove("hidden");
    detenerScannerBtn.classList.add("hidden");
  }

  function extraerCodigoDesdeQR(texto) {
    const limpio = String(texto || "").trim();

    try {
      const obj = JSON.parse(limpio);

      if (obj && obj.tipo === "YACTUN_CLIENTE" && obj.codigo) {
        return String(obj.codigo).trim();
      }

      if (obj && obj.codigo) {
        return String(obj.codigo).trim();
      }
    } catch (err) {
      // Si no es JSON, probamos como código directo.
    }

    if (/^[0-9]{4,10}$/.test(limpio)) {
      return limpio;
    }

    return "";
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

      renderCliente();

      busquedaBox.classList.add("hidden");
      clienteBox.classList.remove("hidden");

      setMsg(clienteMsg, "Cliente encontrado.", "ok");
    } catch (err) {
      setMsg(busquedaMsg, err.message, "error");
    } finally {
      buscarBtn.disabled = false;
    }
  }

  async function sumarCompra() {
    if (!clienteActual) {
      setMsg(clienteMsg, "Primero buscá un cliente.", "error");
      return;
    }

    sumarCompraBtn.disabled = true;
    entregarPremioBtn.disabled = true;
    setMsg(clienteMsg, "Registrando compra...", "");

    try {
      const data = await jsonp({
        action: "sumarCompra",
        codigo: clienteActual.codigo,
        pin: vendedorPin,
        vendedor: vendedorNombre
      });

      if (!data.ok) {
        setMsg(clienteMsg, data.mensaje || "No se pudo registrar la compra.", "error");
        return;
      }

      clienteActual = data.cliente;
      renderCliente();

      if (data.ganoPremio) {
        setMsg(clienteMsg, "🎉 Compra registrada. El cliente ganó premio: " + data.premio, "ok");
      } else {
        setMsg(clienteMsg, "Compra registrada correctamente.", "ok");
      }
    } catch (err) {
      setMsg(clienteMsg, err.message, "error");
    } finally {
      sumarCompraBtn.disabled = false;
      entregarPremioBtn.disabled = false;
    }
  }

  async function entregarPremio() {
    if (!clienteActual) {
      setMsg(clienteMsg, "Primero buscá un cliente.", "error");
      return;
    }

    entregarPremioBtn.disabled = true;
    sumarCompraBtn.disabled = true;
    setMsg(clienteMsg, "Marcando premio como entregado...", "");

    try {
      const data = await jsonp({
        action: "entregarPremio",
        codigo: clienteActual.codigo,
        pin: vendedorPin,
        vendedor: vendedorNombre
      });

      if (!data.ok) {
        setMsg(clienteMsg, data.mensaje || "No se pudo entregar el premio.", "error");
        return;
      }

      clienteActual = data.cliente;
      renderCliente();

      setMsg(clienteMsg, "Premio entregado correctamente.", "ok");
    } catch (err) {
      setMsg(clienteMsg, err.message, "error");
    } finally {
      entregarPremioBtn.disabled = false;
      sumarCompraBtn.disabled = false;
    }
  }

  function renderCliente() {
    if (!clienteActual) return;

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
  }
});




