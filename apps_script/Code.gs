const SHEETS = {
  CLIENTES: "Clientes",
  MOVIMIENTOS: "Movimientos",
  PREMIOS: "Premios",
  CONFIG: "Config",
};

const HEADERS = {
  Clientes: [
    "clienteId",
    "codigo",
    "nombre",
    "celular",
    "email",
    "fechaAlta",
    "puntosActuales",
    "ciclosGanados",
    "premiosPendientes",
    "estado",
    "ultimaCompra",
  ],
  Movimientos: [
    "fecha",
    "clienteId",
    "codigo",
    "tipo",
    "puntosAntes",
    "puntosDespues",
    "vendedor",
    "observacion",
  ],
  Premios: [
    "fechaGanado",
    "clienteId",
    "codigo",
    "premio",
    "estado",
    "fechaEntregado",
    "vendedor",
  ],
  Config: [
    "clave",
    "valor",
  ],
};

function doGet(e) {
  return manejarRequest_(e);
}

function doPost(e) {
  return manejarRequest_(e);
}

function manejarRequest_(e) {
  try {
    const p = e && e.parameter ? e.parameter : {};
    const action = String(p.action || "").trim();

    let data;

    if (action === "ping") {
      data = apiPing_();
    } else if (action === "config") {
      data = apiConfig_();
    } else if (action === "validarPin") {
      data = apiValidarPin_(p);
    } else if (action === "registrarCliente") {
      data = apiRegistrarCliente_(p);
    } else if (action === "consultarCliente") {
      data = apiConsultarCliente_(p);
    } else if (action === "sumarCompra") {
      data = apiSumarCompra_(p);
    } else if (action === "entregarPremio") {
      data = apiEntregarPremio_(p);
    } else if (action === "informeMensual") {
      data = apiInformeMensual_(p);
    } else {
      data = {
        ok: false,
        error: "ACCION_INVALIDA",
        mensaje: "Accion no reconocida",
        action: action,
      };
    }

    return responder_(data, p.callback);
  } catch (err) {
    return responder_({
      ok: false,
      error: "ERROR_INTERNO",
      mensaje: String(err && err.message ? err.message : err),
    }, e && e.parameter ? e.parameter.callback : "");
  }
}

function setupInicial() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  prepararHoja_(ss, SHEETS.CLIENTES, HEADERS.Clientes);
  prepararHoja_(ss, SHEETS.MOVIMIENTOS, HEADERS.Movimientos);
  prepararHoja_(ss, SHEETS.PREMIOS, HEADERS.Premios);
  prepararHoja_(ss, SHEETS.CONFIG, HEADERS.Config);

  cargarConfigInicialSiFalta_(ss);

  return {
    ok: true,
    mensaje: "Planilla inicializada correctamente",
  };
}

function test() {
  return apiPing_();
}

function apiPing_() {
  return {
    ok: true,
    sistema: "YACTUN Club de Beneficios",
    version: "0.1.0",
    fecha: new Date().toISOString(),
  };
}

function apiConfig_() {
  const config = leerConfig_();

  return {
    ok: true,
    config: {
      negocio: config.negocio || "YACTÚN",
      subtitulo: config.subtitulo || "Club de Beneficios",
      meta: numero_(config.meta, 5),
      premio: config.premio || "250 g de mix especial",
      bloqueoMinutos: numero_(config.bloqueoMinutos, 10),
    },
  };
}


function apiValidarPin_(p) {
  const pin = limpiarTexto_(p.pin);

  if (!pin) {
    return {
      ok: false,
      error: "PIN_REQUERIDO",
      mensaje: "Ingresá el PIN vendedor",
    };
  }

  const config = leerConfig_();
  const pinVendedor = String(config.pinVendedor || "1234").trim();

  if (pin !== pinVendedor) {
    return {
      ok: false,
      error: "PIN_INVALIDO",
      mensaje: "PIN de vendedor incorrecto",
    };
  }

  return {
    ok: true,
    mensaje: "PIN correcto",
  };
}

function apiRegistrarCliente_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const nombre = limpiarTexto_(p.nombre);
    const celular = limpiarTexto_(p.celular);
    const email = limpiarTexto_(p.email).toLowerCase();

    if (!nombre) {
      return {
        ok: false,
        error: "NOMBRE_REQUERIDO",
        mensaje: "Falta ingresar el nombre",
      };
    }

    if (!celular) {
      return {
        ok: false,
        error: "CELULAR_REQUERIDO",
        mensaje: "Falta ingresar el celular",
      };
    }

    if (!email) {
      return {
        ok: false,
        error: "EMAIL_REQUERIDO",
        mensaje: "Falta ingresar el email",
      };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEETS.CLIENTES);

    const existente = buscarClientePorCelularOEmail_(celular, email);
    if (existente) {
      return {
        ok: true,
        existente: true,
        mensaje: "Cliente ya registrado",
        cliente: clientePublico_(existente.obj),
      };
    }

    const clienteId = Utilities.getUuid();
    const codigo = generarCodigoUnico_();
    const ahora = new Date();

    const row = [
      clienteId,
      codigo,
      nombre,
      celular,
      email,
      ahora,
      0,
      0,
      0,
      "ACTIVO",
      "",
    ];

    sh.appendRow(row);

    agregarMovimiento_({
      fecha: ahora,
      clienteId: clienteId,
      codigo: codigo,
      tipo: "ALTA_CLIENTE",
      puntosAntes: 0,
      puntosDespues: 0,
      vendedor: "",
      observacion: "Registro inicial",
    });

    const cliente = {
      clienteId: clienteId,
      codigo: codigo,
      nombre: nombre,
      celular: celular,
      email: email,
      fechaAlta: ahora,
      puntosActuales: 0,
      ciclosGanados: 0,
      premiosPendientes: 0,
      estado: "ACTIVO",
      ultimaCompra: "",
    };

    return {
      ok: true,
      existente: false,
      mensaje: "Cliente registrado correctamente",
      cliente: clientePublico_(cliente),
    };
  } finally {
    lock.releaseLock();
  }
}

function apiConsultarCliente_(p) {
  const ref = limpiarTexto_(p.clienteId || p.codigo);

  if (!ref) {
    return {
      ok: false,
      error: "CLIENTE_REQUERIDO",
      mensaje: "Falta clienteId o codigo",
    };
  }

  const encontrado = buscarCliente_(ref);

  if (!encontrado) {
    return {
      ok: false,
      error: "CLIENTE_NO_ENCONTRADO",
      mensaje: "Cliente no encontrado",
    };
  }

  return {
    ok: true,
    cliente: clientePublico_(encontrado.obj),
    config: apiConfig_().config,
  };
}

function apiSumarCompra_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const pin = limpiarTexto_(p.pin);
    const ref = limpiarTexto_(p.clienteId || p.codigo);
    const vendedor = limpiarTexto_(p.vendedor) || "Vendedor";

    const config = leerConfig_();
    const pinVendedor = String(config.pinVendedor || "1234");
    const meta = numero_(config.meta, 5);
    const premio = String(config.premio || "250 g de mix especial");
    const bloqueoMinutos = numero_(config.bloqueoMinutos, 10);

    if (pin !== pinVendedor) {
      return {
        ok: false,
        error: "PIN_INVALIDO",
        mensaje: "PIN de vendedor incorrecto",
      };
    }

    if (!ref) {
      return {
        ok: false,
        error: "CLIENTE_REQUERIDO",
        mensaje: "Falta clienteId o codigo",
      };
    }

    const encontrado = buscarCliente_(ref);

    if (!encontrado) {
      return {
        ok: false,
        error: "CLIENTE_NO_ENCONTRADO",
        mensaje: "Cliente no encontrado",
      };
    }

    const cliente = encontrado.obj;

    if (cliente.estado !== "ACTIVO") {
      return {
        ok: false,
        error: "CLIENTE_INACTIVO",
        mensaje: "El cliente no esta activo",
      };
    }

    const ahora = new Date();

    if (cliente.ultimaCompra) {
      const ultima = new Date(cliente.ultimaCompra);
      const diffMin = (ahora.getTime() - ultima.getTime()) / 60000;

      if (diffMin >= 0 && diffMin < bloqueoMinutos) {
        return {
          ok: false,
          error: "COMPRA_RECIENTE",
          mensaje: "Ya se registro una compra recientemente para este cliente",
          minutosRestantes: Math.ceil(bloqueoMinutos - diffMin),
          cliente: clientePublico_(cliente),
        };
      }
    }

    const puntosAntes = numero_(cliente.puntosActuales, 0);
    const puntosCompra = puntosAntes + 1;

    let puntosFinales = puntosCompra;
    let ciclosGanados = numero_(cliente.ciclosGanados, 0);
    let premiosPendientes = numero_(cliente.premiosPendientes, 0);
    let ganoPremio = false;

    if (puntosCompra >= meta) {
      ganoPremio = true;
      puntosFinales = 0;
      ciclosGanados += 1;
      premiosPendientes += 1;

      agregarPremio_({
        fechaGanado: ahora,
        clienteId: cliente.clienteId,
        codigo: cliente.codigo,
        premio: premio,
        estado: "PENDIENTE",
        fechaEntregado: "",
        vendedor: vendedor,
      });
    }

    actualizarCliente_(encontrado.rowIndex, {
      puntosActuales: puntosFinales,
      ciclosGanados: ciclosGanados,
      premiosPendientes: premiosPendientes,
      ultimaCompra: ahora,
    });

    agregarMovimiento_({
      fecha: ahora,
      clienteId: cliente.clienteId,
      codigo: cliente.codigo,
      tipo: ganoPremio ? "COMPRA_PREMIO_GANADO" : "COMPRA",
      puntosAntes: puntosAntes,
      puntosDespues: puntosCompra,
      vendedor: vendedor,
      observacion: ganoPremio ? ("Premio ganado: " + premio) : "Compra registrada",
    });

    const actualizado = buscarCliente_(cliente.clienteId).obj;

    return {
      ok: true,
      mensaje: ganoPremio ? "Compra registrada. Premio ganado." : "Compra registrada",
      ganoPremio: ganoPremio,
      puntosAntes: puntosAntes,
      puntosCompra: puntosCompra,
      meta: meta,
      premio: premio,
      cliente: clientePublico_(actualizado),
    };
  } finally {
    lock.releaseLock();
  }
}

function apiEntregarPremio_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const pin = limpiarTexto_(p.pin);
    const ref = limpiarTexto_(p.clienteId || p.codigo);
    const vendedor = limpiarTexto_(p.vendedor) || "Vendedor";

    const config = leerConfig_();
    const pinVendedor = String(config.pinVendedor || "1234");

    if (pin !== pinVendedor) {
      return {
        ok: false,
        error: "PIN_INVALIDO",
        mensaje: "PIN de vendedor incorrecto",
      };
    }

    if (!ref) {
      return {
        ok: false,
        error: "CLIENTE_REQUERIDO",
        mensaje: "Falta clienteId o codigo",
      };
    }

    const encontrado = buscarCliente_(ref);

    if (!encontrado) {
      return {
        ok: false,
        error: "CLIENTE_NO_ENCONTRADO",
        mensaje: "Cliente no encontrado",
      };
    }

    const cliente = encontrado.obj;
    const pendientes = numero_(cliente.premiosPendientes, 0);

    if (pendientes <= 0) {
      return {
        ok: false,
        error: "SIN_PREMIOS_PENDIENTES",
        mensaje: "El cliente no tiene premios pendientes",
        cliente: clientePublico_(cliente),
      };
    }

    const ahora = new Date();

    marcarPrimerPremioPendienteComoEntregado_(cliente.clienteId, ahora, vendedor);

    actualizarCliente_(encontrado.rowIndex, {
      premiosPendientes: Math.max(0, pendientes - 1),
    });

    agregarMovimiento_({
      fecha: ahora,
      clienteId: cliente.clienteId,
      codigo: cliente.codigo,
      tipo: "PREMIO_ENTREGADO",
      puntosAntes: numero_(cliente.puntosActuales, 0),
      puntosDespues: numero_(cliente.puntosActuales, 0),
      vendedor: vendedor,
      observacion: "Premio entregado",
    });

    const actualizado = buscarCliente_(cliente.clienteId).obj;

    return {
      ok: true,
      mensaje: "Premio entregado correctamente",
      cliente: clientePublico_(actualizado),
    };
  } finally {
    lock.releaseLock();
  }
}

function prepararHoja_(ss, nombreHoja, encabezados) {
  let sh = ss.getSheetByName(nombreHoja);

  if (!sh) {
    sh = ss.insertSheet(nombreHoja);
  }

  const actual = sh.getRange(1, 1, 1, encabezados.length).getValues()[0];
  let necesitaEncabezado = false;

  for (let i = 0; i < encabezados.length; i++) {
    if (actual[i] !== encabezados[i]) {
      necesitaEncabezado = true;
      break;
    }
  }

  if (necesitaEncabezado) {
    sh.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  }

  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, encabezados.length);

  const headerRange = sh.getRange(1, 1, 1, encabezados.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#f4d7a1");
}

function cargarConfigInicialSiFalta_(ss) {
  const sh = ss.getSheetByName(SHEETS.CONFIG);
  const datos = sh.getDataRange().getValues();

  if (datos.length > 1) {
    return;
  }

  const configInicial = [
    ["negocio", "YACTÚN"],
    ["subtitulo", "Club de Beneficios"],
    ["meta", "5"],
    ["premio", "250 g de mix especial"],
    ["pinVendedor", "1234"],
    ["bloqueoMinutos", "10"],
  ];

  sh.getRange(2, 1, configInicial.length, 2).setValues(configInicial);
  sh.autoResizeColumns(1, 2);
}

function leerConfig_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.CONFIG);
  const values = sh.getDataRange().getValues();

  const config = {};

  for (let i = 1; i < values.length; i++) {
    const key = String(values[i][0] || "").trim();
    const value = values[i][1];

    if (key) {
      config[key] = value;
    }
  }

  return config;
}

function buscarCliente_(ref) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.CLIENTES);
  const values = sh.getDataRange().getValues();
  const headers = values[0];

  const idxClienteId = headers.indexOf("clienteId");
  const idxCodigo = headers.indexOf("codigo");

  const refStr = String(ref);

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idxClienteId]) === refStr || String(values[i][idxCodigo]) === refStr) {
      return {
        rowIndex: i + 1,
        obj: rowToObj_(headers, values[i]),
      };
    }
  }

  return null;
}

function buscarClientePorCelularOEmail_(celular, email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.CLIENTES);
  const values = sh.getDataRange().getValues();
  const headers = values[0];

  const idxCelular = headers.indexOf("celular");
  const idxEmail = headers.indexOf("email");

  const cel = String(celular || "").trim();
  const mail = String(email || "").trim().toLowerCase();

  for (let i = 1; i < values.length; i++) {
    const rowCel = String(values[i][idxCelular] || "").trim();
    const rowMail = String(values[i][idxEmail] || "").trim().toLowerCase();

    if ((cel && rowCel === cel) || (mail && rowMail === mail)) {
      return {
        rowIndex: i + 1,
        obj: rowToObj_(headers, values[i]),
      };
    }
  }

  return null;
}

function actualizarCliente_(rowIndex, cambios) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.CLIENTES);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];

  Object.keys(cambios).forEach(function (key) {
    const idx = headers.indexOf(key);
    if (idx >= 0) {
      sh.getRange(rowIndex, idx + 1).setValue(cambios[key]);
    }
  });
}

function agregarMovimiento_(m) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.MOVIMIENTOS);

  sh.appendRow([
    m.fecha,
    m.clienteId,
    m.codigo,
    m.tipo,
    m.puntosAntes,
    m.puntosDespues,
    m.vendedor,
    m.observacion,
  ]);
}

function agregarPremio_(p) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.PREMIOS);

  sh.appendRow([
    p.fechaGanado,
    p.clienteId,
    p.codigo,
    p.premio,
    p.estado,
    p.fechaEntregado,
    p.vendedor,
  ]);
}

function marcarPrimerPremioPendienteComoEntregado_(clienteId, fecha, vendedor) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEETS.PREMIOS);
  const values = sh.getDataRange().getValues();
  const headers = values[0];

  const idxClienteId = headers.indexOf("clienteId");
  const idxEstado = headers.indexOf("estado");
  const idxFechaEntregado = headers.indexOf("fechaEntregado");
  const idxVendedor = headers.indexOf("vendedor");

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idxClienteId]) === String(clienteId) && String(values[i][idxEstado]) === "PENDIENTE") {
      sh.getRange(i + 1, idxEstado + 1).setValue("ENTREGADO");
      sh.getRange(i + 1, idxFechaEntregado + 1).setValue(fecha);
      sh.getRange(i + 1, idxVendedor + 1).setValue(vendedor);
      return true;
    }
  }

  return false;
}

function generarCodigoUnico_() {
  let codigo;

  for (let i = 0; i < 50; i++) {
    codigo = String(Math.floor(100000 + Math.random() * 900000));

    if (!buscarCliente_(codigo)) {
      return codigo;
    }
  }

  return String(new Date().getTime()).slice(-8);
}

function clientePublico_(cliente) {
  return {
    clienteId: cliente.clienteId,
    codigo: cliente.codigo,
    nombre: cliente.nombre,
    puntosActuales: numero_(cliente.puntosActuales, 0),
    ciclosGanados: numero_(cliente.ciclosGanados, 0),
    premiosPendientes: numero_(cliente.premiosPendientes, 0),
    estado: cliente.estado,
    ultimaCompra: fechaISO_(cliente.ultimaCompra),
  };
}

function rowToObj_(headers, row) {
  const obj = {};

  headers.forEach(function (h, i) {
    obj[h] = row[i];
  });

  return obj;
}

function limpiarTexto_(v) {
  return String(v || "").trim();
}

function numero_(v, def) {
  const n = Number(v);
  return isNaN(n) ? def : n;
}

function fechaISO_(v) {
  if (!v) {
    return "";
  }

  try {
    return new Date(v).toISOString();
  } catch (err) {
    return "";
  }
}

function responder_(data, callback) {
  const json = JSON.stringify(data);

  if (callback) {
    const cb = String(callback).replace(/[^a-zA-Z0-9_.$]/g, "");
    return ContentService
      .createTextOutput(cb + "(" + json + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}



function apiInformeMensual_(p) {
  const clave = String(p.clave || "").trim();
  const periodo = String(p.periodo || p.mes || "").trim();

  const config = leerConfig_();
  const claveInforme = String(config.claveInforme || "").trim();

  if (!claveInforme) {
    return {
      ok: false,
      error: "CLAVE_INFORME_NO_CONFIGURADA",
      mensaje: "Falta configurar claveInforme en la hoja Config",
    };
  }

  if (!clave || clave !== claveInforme) {
    return {
      ok: false,
      error: "CLAVE_INFORME_INVALIDA",
      mensaje: "Clave de informe incorrecta",
    };
  }

  const per = periodoInforme_(periodo);
  if (!per.ok) {
    return per;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const clientesTodos = leerHojaParaInforme_(ss, SHEETS.CLIENTES);
  const movimientosTodos = leerHojaParaInforme_(ss, SHEETS.MOVIMIENTOS);
  const premiosTodos = leerHojaParaInforme_(ss, SHEETS.PREMIOS);

  const clientes = clientesTodos.filter(function (c) {
    return fechaDentroPeriodoInforme_(c.fechaAlta, per.inicio, per.fin);
  });

  const movimientos = movimientosTodos.filter(function (m) {
    return fechaDentroPeriodoInforme_(m.fecha, per.inicio, per.fin);
  });

  const premios = premiosTodos.filter(function (pr) {
    return (
      fechaDentroPeriodoInforme_(pr.fechaGanado, per.inicio, per.fin) ||
      fechaDentroPeriodoInforme_(pr.fechaEntregado, per.inicio, per.fin)
    );
  });

  const clientesActivos = {};
  movimientos.forEach(function (m) {
    if (m.clienteId) {
      clientesActivos[String(m.clienteId)] = true;
    }
  });

  const comprasRegistradas = movimientos.filter(function (m) {
    return String(m.tipo || "").toUpperCase() === "COMPRA";
  }).length;

  const premiosGenerados = premiosTodos.filter(function (pr) {
    return fechaDentroPeriodoInforme_(pr.fechaGanado, per.inicio, per.fin);
  }).length;

  const premiosEntregados = premiosTodos.filter(function (pr) {
    return fechaDentroPeriodoInforme_(pr.fechaEntregado, per.inicio, per.fin);
  }).length;

  const premiosPendientesTotales = premiosTodos.filter(function (pr) {
    return String(pr.estado || "").toUpperCase() === "PENDIENTE";
  }).length;

  return {
    ok: true,
    tipo: "informeMensual",
    periodo: per.periodo,
    generadoEn: fechaInforme_(new Date()),
    resumen: {
      clientesNuevos: clientes.length,
      clientesActivosDelMes: Object.keys(clientesActivos).length,
      movimientosDelMes: movimientos.length,
      comprasRegistradas: comprasRegistradas,
      premiosGenerados: premiosGenerados,
      premiosEntregados: premiosEntregados,
      premiosPendientesTotales: premiosPendientesTotales,
    },
    clientes: serializarListaInforme_(clientes),
    movimientos: serializarListaInforme_(movimientos),
    premios: serializarListaInforme_(premios),
  };
}

function leerHojaParaInforme_(ss, nombreHoja) {
  const sh = ss.getSheetByName(nombreHoja);
  if (!sh) {
    return [];
  }

  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) {
    return [];
  }

  const headers = values[0].map(function (h) {
    return String(h || "").trim();
  });

  const out = [];

  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    const obj = {};
    let tieneDatos = false;

    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) {
        continue;
      }

      obj[key] = row[c];

      if (row[c] !== "" && row[c] !== null && typeof row[c] !== "undefined") {
        tieneDatos = true;
      }
    }

    if (tieneDatos) {
      out.push(obj);
    }
  }

  return out;
}

function periodoInforme_(periodo) {
  const txt = String(periodo || "").trim();
  const m = txt.match(/^(\d{4})-(\d{2})$/);

  if (!m) {
    return {
      ok: false,
      error: "PERIODO_INVALIDO",
      mensaje: "El período debe tener formato YYYY-MM. Ejemplo: 2026-06",
    };
  }

  const anio = Number(m[1]);
  const mes = Number(m[2]);

  if (mes < 1 || mes > 12) {
    return {
      ok: false,
      error: "MES_INVALIDO",
      mensaje: "El mes debe estar entre 01 y 12",
    };
  }

  return {
    ok: true,
    periodo: txt,
    inicio: new Date(anio, mes - 1, 1, 0, 0, 0),
    fin: new Date(anio, mes, 1, 0, 0, 0),
  };
}

function fechaDentroPeriodoInforme_(valor, inicio, fin) {
  const f = convertirFechaInforme_(valor);
  if (!f) {
    return false;
  }

  return f >= inicio && f < fin;
}

function convertirFechaInforme_(valor) {
  if (!valor) {
    return null;
  }

  if (Object.prototype.toString.call(valor) === "[object Date]" && !isNaN(valor.getTime())) {
    return valor;
  }

  const d = new Date(valor);
  if (isNaN(d.getTime())) {
    return null;
  }

  return d;
}

function serializarListaInforme_(lista) {
  return lista.map(function (obj) {
    const out = {};

    Object.keys(obj).forEach(function (key) {
      const valor = obj[key];

      if (Object.prototype.toString.call(valor) === "[object Date]" && !isNaN(valor.getTime())) {
        out[key] = fechaInforme_(valor);
      } else {
        out[key] = valor;
      }
    });

    return out;
  });
}

function fechaInforme_(fecha) {
  return Utilities.formatDate(
    fecha,
    Session.getScriptTimeZone() || "America/Argentina/Buenos_Aires",
    "yyyy-MM-dd HH:mm:ss"
  );
}
