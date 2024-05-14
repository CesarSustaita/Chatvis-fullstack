// Obtener el valor de admin desde el div oculto
document.addEventListener("DOMContentLoaded", function () {
    var adminValue = document.getElementById("adminValue").innerText.trim();
    var isAdmin = adminValue;
    if (isAdmin != 0) {
      document.getElementById("noAdmin").style.display = "none";
    }
});

// Obtener los elementos del DOM
const btnradio1 = document.getElementById('btnradio1');
const btnradio2 = document.getElementById('btnradio2');
const usuariosContent = document.getElementById('usuariosContent');
const analizadorContent = document.getElementById('analizadorContent');

// Añadir eventos de clic a los botones
btnradio1.addEventListener('click', () => {
  usuariosContent.classList.remove('hidden');
  analizadorContent.classList.add('hidden');
});

btnradio2.addEventListener('click', () => {
  usuariosContent.classList.add('hidden');
  analizadorContent.classList.remove('hidden');
});

function redirectToAnalizador() {
  window.location.href = urls.dashboard;
}

function redirectToUsuarios() {
  window.location.href = urls.tabla_admin;
}
