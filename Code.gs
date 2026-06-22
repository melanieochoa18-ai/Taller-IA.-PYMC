const SPREADSHEET_ID = "PEGAR_AQUI_EL_ID_DE_GOOGLE_SHEETS";

function doGet(e) {
  try {
    const accion = (e && e.parameter && e.parameter.accion) ? e.parameter.accion : "prueba";

    if (accion === "listarSolicitudes") {
      return listarSolicitudes(e.parameter);
    }

    return respuesta(true, "Servicio disponible", {
      aplicacion: "Centro de Requerimientos"
    });

  } catch (error) {
    return respuesta(false, error.toString());
  }
}

function doPost(e) {
  try {
    const params = e.parameter || {};
    const accion = params.accion || "";

    switch (accion) {
      case "login":
        return login(params);

      case "crearSolicitud":
        return crearSolicitud(params);

      case "listarSolicitudes":
        return listarSolicitudes(params);

      default:
        return respuesta(false, "Acción no válida");
    }

  } catch (error) {
    return respuesta(false, error.toString());
  }
}

function login(params) {
  try {
    validarEstructura();

    const correo = String(params.correo || "").trim().toLowerCase();
    const pin = String(params.pin || "").trim();

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName("Usuarios");

    const datos = hoja.getDataRange().getValues();

    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];

      const usuario = {
        idUsuario: fila[0],
        nombre: fila[1],
        correo: String(fila[2] || "").toLowerCase(),
        pin: String(fila[3] || ""),
        estado: fila[4]
      };

      if (
        usuario.correo === correo &&
        usuario.pin === pin &&
        String(usuario.estado).toLowerCase() === "activo"
      ) {
        return respuesta(true, "Inicio de sesión correcto", {
          usuario: {
            idUsuario: usuario.idUsuario,
            nombre: usuario.nombre,
            correo: usuario.correo
          }
        });
      }
    }

    return respuesta(false, "Correo, PIN o estado inválido");

  } catch (error) {
    return respuesta(false, error.toString());
  }
}

function crearSolicitud(params) {
  try {
    validarEstructura();

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName("Solicitudes");

    const idSolicitud = generarIdSolicitud();
    const fechaRegistro = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      "yyyy-MM-dd HH:mm:ss"
    );

    hoja.appendRow([
      idSolicitud,
      fechaRegistro,
      params.idUsuario || "",
      params.solicitante || "",
      params.correo || "",
      params.tipoSolicitud || "",
      params.titulo || "",
      params.descripcion || "",
      params.prioridad || "",
      "Pendiente"
    ]);

    return respuesta(true, "Solicitud registrada correctamente", {
      idSolicitud: idSolicitud,
      fechaRegistro: fechaRegistro,
      estado: "Pendiente"
    });

  } catch (error) {
    return respuesta(false, error.toString());
  }
}

function listarSolicitudes(params) {
  try {
    validarEstructura();

    const idUsuario = String(params.idUsuario || "").trim();

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const hoja = ss.getSheetByName("Solicitudes");

    const datos = hoja.getDataRange().getValues();
    const solicitudes = [];

    for (let i = 1; i < datos.length; i++) {
      const fila = datos[i];

      if (String(fila[2]) === idUsuario) {
        solicitudes.push({
          idSolicitud: fila[0],
          fechaRegistro: fila[1],
          idUsuario: fila[2],
          solicitante: fila[3],
          correo: fila[4],
          tipoSolicitud: fila[5],
          titulo: fila[6],
          descripcion: fila[7],
          prioridad: fila[8],
          estado: fila[9]
        });
      }
    }

    return respuesta(true, "Consulta realizada correctamente", {
      solicitudes: solicitudes
    });

  } catch (error) {
    return respuesta(false, error.toString());
  }
}

function validarEstructura() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const usuarios = ss.getSheetByName("Usuarios");
  const solicitudes = ss.getSheetByName("Solicitudes");

  if (!usuarios) {
    throw new Error('No existe la hoja "Usuarios"');
  }

  if (!solicitudes) {
    throw new Error('No existe la hoja "Solicitudes"');
  }

  return true;
}

function generarIdSolicitud() {
  return "SOL-" + new Date().getTime();
}

function respuesta(ok, mensaje, datos) {
  return ContentService
    .createTextOutput(
      JSON.stringify({
        ok: ok,
        mensaje: mensaje,
        datos: datos || {}
      })
    )
    .setMimeType(ContentService.MimeType.JSON);
}
