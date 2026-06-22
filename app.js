```javascript
const API_URL = "PEGAR_AQUI_LA_URL_DE_APPS_SCRIPT";

const formLogin = document.getElementById("formLogin");
const formSolicitud = document.getElementById("formSolicitud");

const seccionLogin = document.getElementById("seccionLogin");
const areaPrincipal = document.getElementById("areaPrincipal");

const mensajeCarga = document.getElementById("mensajeCarga");
const mensajeExito = document.getElementById("mensajeExito");
const mensajeError = document.getElementById("mensajeError");

const btnActualizar = document.getElementById("btnActualizar");
const btnCerrarSesion = document.getElementById("btnCerrarSesion");
const btnImprimir = document.getElementById("btnImprimir");

const tablaSolicitudesBody = document.getElementById("tablaSolicitudesBody");

document.addEventListener("DOMContentLoaded", () => {
    verificarSesion();

    formLogin.addEventListener("submit", iniciarSesion);
    formSolicitud.addEventListener("submit", registrarSolicitud);

    btnActualizar.addEventListener("click", cargarSolicitudes);
    btnCerrarSesion.addEventListener("click", cerrarSesion);
    btnImprimir.addEventListener("click", imprimirPDF);
});

function mostrarCarga(texto = "Cargando...") {
    ocultarMensajes();
    mensajeCarga.textContent = texto;
    mensajeCarga.hidden = false;
}

function mostrarExito(texto) {
    ocultarMensajes();
    mensajeExito.textContent = texto;
    mensajeExito.hidden = false;
}

function mostrarError(texto) {
    ocultarMensajes();
    mensajeError.textContent = texto;
    mensajeError.hidden = false;
}

function ocultarMensajes() {
    mensajeCarga.hidden = true;
    mensajeExito.hidden = true;
    mensajeError.hidden = true;
}

function mostrarAreaPrincipal() {
    seccionLogin.hidden = true;
    areaPrincipal.hidden = false;
}

function mostrarLogin() {
    areaPrincipal.hidden = true;
    seccionLogin.hidden = false;
}

function guardarSesion(usuario) {
    sessionStorage.setItem("usuario", JSON.stringify(usuario));
}

function obtenerSesion() {
    const usuario = sessionStorage.getItem("usuario");
    return usuario ? JSON.parse(usuario) : null;
}

function limpiarSesion() {
    sessionStorage.removeItem("usuario");
}

function verificarSesion() {
    const usuario = obtenerSesion();

    if (!usuario) {
        mostrarLogin();
        return;
    }

    cargarDatosUsuario(usuario);
    mostrarAreaPrincipal();
    cargarSolicitudes();
}

function cargarDatosUsuario(usuario) {
    document.getElementById("usuarioIdUsuario").textContent = usuario.idUsuario || "";
    document.getElementById("usuarioNombre").textContent = usuario.nombre || "";
    document.getElementById("usuarioCorreo").textContent = usuario.correo || "";
}

async function iniciarSesion(event) {
    event.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const pin = document.getElementById("pin").value.trim();

    if (!correo || !pin) {
        mostrarError("Ingrese correo y PIN.");
        return;
    }

    try {
        mostrarCarga("Validando usuario...");

        const params = new URLSearchParams();
        params.append("accion", "login");
        params.append("correo", correo);
        params.append("pin", pin);

        const response = await fetch(API_URL, {
            method: "POST",
            body: params
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Credenciales incorrectas.");
        }

        guardarSesion(data.usuario);

        cargarDatosUsuario(data.usuario);
        mostrarAreaPrincipal();
        mostrarExito("Inicio de sesión exitoso.");

        formLogin.reset();

        await cargarSolicitudes();

    } catch (error) {
        mostrarError(error.message || "No fue posible iniciar sesión.");
    }
}

async function registrarSolicitud(event) {
    event.preventDefault();

    const usuario = obtenerSesion();

    if (!usuario) {
        mostrarError("Sesión no válida.");
        return;
    }

    const tipoSolicitud = document.getElementById("tipoSolicitud").value.trim();
    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const prioridad = document.getElementById("prioridad").value;

    if (!tipoSolicitud || !titulo || !descripcion || !prioridad) {
        mostrarError("Complete todos los campos.");
        return;
    }

    try {
        mostrarCarga("Registrando solicitud...");

        const params = new URLSearchParams();

        params.append("accion", "crearSolicitud");
        params.append("idUsuario", usuario.idUsuario);
        params.append("solicitante", usuario.nombre);
        params.append("correo", usuario.correo);
        params.append("tipoSolicitud", tipoSolicitud);
        params.append("titulo", titulo);
        params.append("descripcion", descripcion);
        params.append("prioridad", prioridad);

        const response = await fetch(API_URL, {
            method: "POST",
            body: params
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "No fue posible registrar la solicitud.");
        }

        formSolicitud.reset();

        mostrarExito("Solicitud registrada correctamente.");

        await cargarSolicitudes();

    } catch (error) {
        mostrarError(error.message || "Error al registrar la solicitud.");
    }
}

async function cargarSolicitudes() {
    const usuario = obtenerSesion();

    if (!usuario) {
        return;
    }

    try {
        mostrarCarga("Consultando solicitudes...");

        const params = new URLSearchParams();

        params.append("accion", "listarSolicitudes");
        params.append("idUsuario", usuario.idUsuario);

        const response = await fetch(API_URL, {
            method: "POST",
            body: params
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "No fue posible consultar las solicitudes.");
        }

        construirTabla(data.solicitudes || []);

        ocultarMensajes();

    } catch (error) {
        mostrarError(error.message || "Error al consultar solicitudes.");
    }
}

function construirTabla(solicitudes) {
    tablaSolicitudesBody.innerHTML = "";

    if (!solicitudes.length) {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td colspan="7">No existen solicitudes registradas.</td>
        `;

        tablaSolicitudesBody.appendChild(fila);
        return;
    }

    solicitudes.forEach(item => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${item.idSolicitud || ""}</td>
            <td>${item.fechaRegistro || ""}</td>
            <td>${item.tipoSolicitud || ""}</td>
            <td>${item.titulo || ""}</td>
            <td>${item.descripcion || ""}</td>
            <td>${item.prioridad || ""}</td>
            <td>${item.estado || ""}</td>
        `;

        tablaSolicitudesBody.appendChild(fila);
    });
}

function cerrarSesion() {
    limpiarSesion();
    ocultarMensajes();

    formLogin.reset();
    formSolicitud.reset();

    tablaSolicitudesBody.innerHTML = "";

    mostrarLogin();
}

function imprimirPDF() {
    window.print();
}
```
