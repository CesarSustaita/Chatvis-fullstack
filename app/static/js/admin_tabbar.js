var basePathname = window.location.pathname.split('/').slice(0, -1).join('/');

if (basePathname.endsWith("/admin")) {
    basePathname = basePathname.replace("/admin", "");
}

var analisisURL = "/admin/dashboard";
var tablaUsuariosURL = "/admin/tabla_usuarios";
var analisisURLWithChat = "/analisis";

function redirectToAnalizador() {
    window.location.href = basePathname + analisisURL;
}

function redirectToUsuarios() {
    window.location.href = basePathname + tablaUsuariosURL;
}

document.addEventListener('DOMContentLoaded', function () {
    if (thisPageis == "admin_tabla_usuarios") {
        document.getElementById("btnSwitchUsuarios").checked = true;
        document.getElementById("btnSwitchAnalisis").checked = false;
    } else {
        document.getElementById("btnSwitchAnalisis").checked = true;
        document.getElementById("btnSwitchUsuarios").checked = false;
    }

    // Check if there is a chat saved
    if (sessionStorage.getItem('chat_file_content')) {
        analisisURL = analisisURLWithChat;
    }
});