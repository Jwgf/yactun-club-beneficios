const loginBox = document.getElementById("loginBox");
const busquedaBox = document.getElementById("busquedaBox");
const clienteBox = document.getElementById("clienteBox");

const vendedorInput = document.getElementById("vendedorInput");
const pinInput = document.getElementById("pinInput");
const entrarBtn = document.getElementById("entrarBtn");
const loginMsg = document.getElementById("loginMsg");

document.addEventListener("DOMContentLoaded", iniciar);

function iniciar() {
  loginMsg.textContent = "Pantalla vendedor lista.";
  loginMsg.classList.add("ok");

  entrarBtn.addEventListener("click", entrar);
}

function entrar() {
  const vendedor = vendedorInput.value.trim() || "Vendedor";
  const pin = pinInput.value.trim();

  if (!pin) {
    loginMsg.textContent = "Ingresá el PIN vendedor.";
    loginMsg.classList.remove("ok");
    loginMsg.classList.add("error");
    return;
  }

  localStorage.setItem("yactun_vendedor_nombre", vendedor);
  localStorage.setItem("yactun_vendedor_pin", pin);

  loginBox.classList.add("hidden");
  busquedaBox.classList.remove("hidden");
  clienteBox.classList.add("hidden");
}
