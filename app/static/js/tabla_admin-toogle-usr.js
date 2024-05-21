// Obtener el valor de admin desde el div oculto
document.addEventListener("DOMContentLoaded", function () {
    var adminValue = document.getElementById("adminValue").innerText.trim();
    var isAdmin = adminValue;
    if (isAdmin == 0) {
      document.getElementById("noAdminToggle").style.display = "none";
      document.getElementById("noAdminTable").style.display = "none";
      document.getElementById("showNoAdmin").style.display = "block";
    }
});

// Obtener los elementos del DOM
const btnradio1 = document.getElementById('btnradio1');
const btnradio2 = document.getElementById('btnradio2');
const usuariosContent = document.getElementById('usuariosContent');
const analizadorContent = document.getElementById('analizadorContent');

function redirectToAnalizador() {
    window.location.href = urls.dashboard;
  }
  
  function redirectToUsuarios() {
    window.location.href = urls.tabla_admin;
  }
  