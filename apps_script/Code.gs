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

function setupInicial() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  crearHojaConEncabezado_(ss, SHEETS.CLIENTES, HEADERS.Clientes);
  crearHojaConEncabezado_(ss, SHEETS.MOVIMIENTOS, HEADERS.Movimientos);
  crearHojaConEncabezado_(ss, SHEETS.PREMIOS, HEADERS.Premios);
  crearHojaConEncabezado_(ss, SHEETS.CONFIG, HEADERS.Config);

  cargarConfigInicial_(ss);

  return {
    ok: true,
    mensaje: "Planilla inicializada correctamente",
  };
}

function crearHojaConEncabezado_(ss, nombreHoja, encabezados) {
  let sh = ss.getSheetByName(nombreHoja);

  if (!sh) {
    sh = ss.insertSheet(nombreHoja);
  }

  sh.clear();

  sh.getRange(1, 1, 1, encabezados.length).setValues([encabezados]);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1, encabezados.length);

  const headerRange = sh.getRange(1, 1, 1, encabezados.length);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#f4d7a1");
}

function cargarConfigInicial_(ss) {
  const sh = ss.getSheetByName(SHEETS.CONFIG);

  const datos = [
    ["negocio", "YACTÚN"],
    ["subtitulo", "Club de Beneficios"],
    ["meta", "5"],
    ["premio", "250 g de mix especial"],
    ["pinVendedor", "1234"],
    ["bloqueoMinutos", "10"],
  ];

  sh.getRange(2, 1, datos.length, 2).setValues(datos);
  sh.autoResizeColumns(1, 2);
}

function test() {
  return {
    ok: true,
    mensaje: "Apps Script funcionando",
    fecha: new Date().toISOString(),
  };
}
