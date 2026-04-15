// ============================================================
//  MAISON SPORT — API Bridge
//  Code.gs  |  Desplegar como Web App en Google Apps Script
//  Acceso: "Cualquier persona" (Anyone)
// ============================================================

var SHEET_ALUMNOS_ID     = '1LsLOwM7MaeWLHbNyBmZ5YDfv57J0w6tdGUZUGClCij4';
var SHEET_ASISTENCIAS_ID = '1CI4cFoixKyZxsFtYs3f34N-LudZUN1T3Zx4QGg33yiY';

var TAB_ALUMNOS     = 'Alumnos';
var TAB_ASISTENCIAS = 'Asistencias';

// Columnas en sheet Alumnos (base 1)
var COL_NOMBRE    = 1; // A
var COL_QR_ID     = 2; // B
var COL_DIFF_DIAS = 3; // C
var COL_ESTADO    = 4; // D

// ── ENTRY POINT ───────────────────────────────────────────────
function doGet(e) {
  var output = _handle(e);
  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── ROUTER ────────────────────────────────────────────────────
function _handle(e) {
  var p      = e.parameter || {};
  var action = p.action || '';

  try {
    if (action === 'search')   return buscarPorNombre(p.q || '');
    if (action === 'qr')       return buscarPorQR(p.q || '');
    if (action === 'register') return registrarAsistencia(p.qrId || '', p.nombre || '');
    return { error: 'Acción no válida: ' + action };
  } catch (err) {
    return { error: err.message };
  }
}

// ── BUSCAR POR NOMBRE ─────────────────────────────────────────
function buscarPorNombre(query) {
  query = query.toLowerCase().trim();
  if (query.length < 2) return [];

  var datos = _getDatos();
  var result = [];

  for (var i = 1; i < datos.length; i++) {
    var nombre = (datos[i][COL_NOMBRE - 1] || '').toString();
    if (nombre.toLowerCase().indexOf(query) !== -1) {
      result.push(_toObj(datos[i]));
      if (result.length >= 8) break;
    }
  }
  return result;
}

// ── BUSCAR POR QR ─────────────────────────────────────────────
function buscarPorQR(qrId) {
  qrId = qrId.trim();
  if (!qrId) return null;

  var datos = _getDatos();
  for (var i = 1; i < datos.length; i++) {
    if ((datos[i][COL_QR_ID - 1] || '').toString().trim() === qrId) {
      return _toObj(datos[i]);
    }
  }
  return null;
}

// ── REGISTRAR ASISTENCIA ──────────────────────────────────────
function registrarAsistencia(qrId, nombre) {
  var hoja  = SpreadsheetApp.openById(SHEET_ASISTENCIAS_ID)
                            .getSheetByName(TAB_ASISTENCIAS);
  var ahora = new Date();
  var tz    = Session.getScriptTimeZone();
  var fecha = Utilities.formatDate(ahora, tz, 'dd/MM/yyyy');
  var hora  = Utilities.formatDate(ahora, tz, 'HH:mm:ss');
  hoja.appendRow([qrId, nombre, fecha, hora]);
  return { ok: true, fecha: fecha, hora: hora };
}

// ── HELPERS ───────────────────────────────────────────────────
function _getDatos() {
  return SpreadsheetApp.openById(SHEET_ALUMNOS_ID)
                       .getSheetByName(TAB_ALUMNOS)
                       .getDataRange().getValues();
}

function _toObj(fila) {
  var dias   = parseInt(fila[COL_DIFF_DIAS - 1], 10) || 0;
  var estado = (fila[COL_ESTADO - 1] || '').toString().trim().toLowerCase();
  var activo = estado === 'activo' || dias > 0;
  return {
    nombre       : (fila[COL_NOMBRE - 1] || '').toString().trim(),
    qrId         : (fila[COL_QR_ID  - 1] || '').toString().trim(),
    diasRestantes: dias,
    activo       : activo
  };
}
