const LS_CLIENTE_ID = "yactun_cliente_id";
const LS_CLIENTE_CODIGO = "yactun_cliente_codigo";

const API_URL = YACTUN_CONFIG.API_URL;

const loadingBox = document.getElementById("loadingBox");
const registroBox = document.getElementById("registroBox");
const credencialBox = document.getElementById("credencialBox");
const fiestaBox = document.getElementById("fiestaBox");

const nombreInput = document.getElementById("nombreInput");
const celularInput = document.getElementById("celularInput");
const emailInput = document.getElementById("emailInput");
const registrarBtn = document.getElementById("registrarBtn");
const registroMsg = document.getElementById("registroMsg");

const saludoTxt = document.getElementById("saludoTxt");
const codigoTxt = document.getElementById("codigoTxt");
const puntosTxt = document.getElementById("puntosTxt");
const metaTxt = document.getElementById("metaTxt");
const premioTxt = document.getElementById("premioTxt");
const qrBox = document.getElementById("qrBox");
const actualizarBtn = document.getElementById("actualizarBtn");
const credencialMsg = document.getElementById("credencialMsg");

let clienteActual = null;
let configActual = {
  meta: 5,
  premio: "250 g de mix especial"
};

document.addEventListener("DOMContentLoaded", iniciar);
registrarBtn.addEventListener("click", registrarCliente);
actualizarBtn.addEventListener("click", actualizarCliente);

function iniciar() {
  const clienteId = localStorage.getItem(LS_CLIENTE_ID);

  if (clienteId) {
    consultarCliente(clienteId);
  } else {
    mostrarRegistro();
  }
}

function mostrarRegistro() {
  loadingBox.classList.add("hidden");
  credencialBox.classList.add("hidden");
  registroBox.classList.remove("hidden");
}

function mostrarCredencial() {
  loadingBox.classList.add("hidden");
  registroBox.classList.add("hidden");
  credencialBox.classList.remove("hidden");
}

function setMsg(el, texto, tipo) {
  el.textContent = texto || "";
  el.classList.remove("error", "ok");

  if (tipo) {
    el.classList.add(tipo);
  }
}

function jsonp(params) {
  return new Promise((resolve, reject) => {
    const callbackName = "jsonp_cb_" + Date.now() + "_" + Math.floor(Math.random() * 100000);

    params.callback = callbackName;

    const url = API_URL + "?" + new URLSearchParams(params).toString();

    const script = document.createElement("script");
    script.src = url;
    script.async = true;

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Tiempo de espera agotado"));
    }, 30000);

    window[callbackName] = (data) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
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

async function registrarCliente() {
  const nombre = nombreInput.value.trim();
  const celular = celularInput.value.trim();
  const email = emailInput.value.trim();

  if (!nombre || !celular || !email) {
    setMsg(registroMsg, "Complet\u00e1 nombre, celular y email.", "error");
    return;
  }

  registrarBtn.disabled = true;
  setMsg(registroMsg, "Registrando...", "");

  try {
    const data = await jsonp({
      action: "registrarCliente",
      nombre,
      celular,
      email
    });

    if (!data.ok) {
      setMsg(registroMsg, data.mensaje || "No se pudo registrar.", "error");
      return;
    }

    clienteActual = data.cliente;
    guardarClienteLocal(clienteActual);
    renderCliente(data.cliente, data.config);
    mostrarCredencial();
    setMsg(credencialMsg, data.mensaje || "Registro correcto.", "ok");
  } catch (err) {
    setMsg(registroMsg, err.message, "error");
  } finally {
    registrarBtn.disabled = false;
  }
}

async function consultarCliente(ref) {
  loadingBox.classList.remove("hidden");
  registroBox.classList.add("hidden");
  credencialBox.classList.add("hidden");

  try {
    const data = await jsonp({
      action: "consultarCliente",
      clienteId: ref
    });

    if (!data.ok) {
      localStorage.removeItem(LS_CLIENTE_ID);
      localStorage.removeItem(LS_CLIENTE_CODIGO);
      mostrarRegistro();
      setMsg(registroMsg, "No encontramos tu registro. Carg\u00e1 tus datos nuevamente.", "error");
      return;
    }

    clienteActual = data.cliente;
    guardarClienteLocal(clienteActual);
    renderCliente(data.cliente, data.config);
    mostrarCredencial();
  } catch (err) {
    mostrarRegistro();
    setMsg(registroMsg, "No se pudo consultar el registro: " + err.message, "error");
  }
}

async function actualizarCliente() {
  if (!clienteActual) {
    return;
  }

  actualizarBtn.disabled = true;
  setMsg(credencialMsg, "Actualizando...", "");

  try {
    const data = await jsonp({
      action: "consultarCliente",
      clienteId: clienteActual.clienteId
    });

    if (!data.ok) {
      setMsg(credencialMsg, data.mensaje || "No se pudo actualizar.", "error");
      return;
    }

    clienteActual = data.cliente;
    guardarClienteLocal(clienteActual);
    renderCliente(data.cliente, data.config);
    setMsg(credencialMsg, "Datos actualizados.", "ok");
  } catch (err) {
    setMsg(credencialMsg, err.message, "error");
  } finally {
    actualizarBtn.disabled = false;
  }
}

function guardarClienteLocal(cliente) {
  localStorage.setItem(LS_CLIENTE_ID, cliente.clienteId);
  localStorage.setItem(LS_CLIENTE_CODIGO, cliente.codigo);
}

function renderCliente(cliente, config) {
  configActual = config || configActual;

  saludoTxt.textContent = "Hola, " + cliente.nombre;
  codigoTxt.textContent = cliente.codigo;
  puntosTxt.textContent = cliente.puntosActuales;
  metaTxt.textContent = configActual.meta || 5;

  generarQR(cliente);

  if (cliente.premiosPendientes > 0) {
    premioTxt.textContent = "\uD83C\uDF81 \u00a1Felicitaciones! Ten\u00e9s un premio pendiente: " +
    premioTxt.classList.remove("hidden");
    mostrarFiesta();
  } else {
    premioTxt.classList.add("hidden");
    fiestaBox.classList.add("hidden");
  }
}

function generarQR(cliente) {
  qrBox.innerHTML = "";

  const contenidoQR = JSON.stringify({
    tipo: "YACTUN_CLIENTE",
    clienteId: cliente.clienteId,
    codigo: cliente.codigo
  });

  QRCode.toCanvas(contenidoQR, {
    width: 220,
    margin: 1,
    errorCorrectionLevel: "M"
  }, function (err, canvas) {
    if (err) {
      qrBox.textContent = "QR no disponible";
      return;
    }

    qrBox.appendChild(canvas);
  });
}

function mostrarFiesta() {
  fiestaBox.classList.remove("hidden");

  setTimeout(() => {
    fiestaBox.classList.add("hidden");
  }, 5000);
}

