const reader = new FileReader();

reader.onload = function (e) {
    const content = e.target.result;
    sessionStorage.clear(); // Limpia datos previos
    sessionStorage.setItem('chat_file_content', content);
    const file = document.getElementById('chat_file_input').files[0];
    sessionStorage.setItem('chat_file_name', file.name);
    sessionStorage.setItem('first_load_after_upload', 'true');

    window.location.href = '/analisis'; // Redirige a la página de análisis
};


document.addEventListener('DOMContentLoaded', function () {
    // Select file button
    let input = document.getElementById('chat_file_input');
    let selectFileButton = document.getElementById('selectFileButton');

    selectFileButton.addEventListener('click', function () {
        input.click();
    });

    input.addEventListener('change', function () {
        const file = input.files[0]; // Obtiene el archivo seleccionado

        if (file) {
            document.getElementById('spinner').classList.remove('d-none'); // Muestra el spinner
            document.getElementById('fileIcon').classList.add('d-none'); // Oculta el ícono de archivo
            document.getElementById('message').innerText = 'Cargando...';

            if (file.type === 'text/plain') { // Si el archivo es de tipo texto plano
                console.log('File selected:', file);
                reader.readAsText(file, 'UTF-8');

            } else { // Si el archivo no es de tipo texto plano
                document.getElementById('spinner').classList.add('d-none'); // Oculta el spinner
                document.getElementById('fileIcon').classList.remove('d-none'); // Muestra el ícono de archivo
                document.getElementById('message').innerText = 'Arrastra y suelta tu conversación con extensión ".txt".';
                // swal("Error", "El archivo debe ser de tipo .txt", "error");
                showToastError('El archivo debe ser de tipo texto'); // Cambiado a Toast de error para consistencia
            }
        }
    });

});


function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    document.getElementById('message').innerText = 'Suelta tu archivo aquí.';
    document.getElementById('ArrastrarArchivo').classList.add('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0]; // Obtiene el archivo arrastrado

    if (file) {
        const input = document.getElementById('chat_file_input');
        input.files = event.dataTransfer.files; // Asigna el archivo arrastrado al input
        document.getElementById('ArrastrarArchivo').classList.remove('drag-over');
        input.dispatchEvent(new Event('change')); // Simula el evento de cambio
    }
    document.getElementById('ArrastrarArchivo').classList.remove('drag-over');
}

function handleDragLeave(event) {
    event.preventDefault();
    document.getElementById('message').innerText = 'Arrastra y suelta tu conversación con extensión ".txt".';
    document.getElementById('ArrastrarArchivo').classList.remove('drag-over');
}