function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    document.getElementById('message').innerText = 'Suelta tu archivo aquí.';
    document.getElementById('ArrastrarArchivo').classList.add('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      if (file.name.endsWith('.txt')) {
        const inputFile = document.getElementById('whatsChatSinAnimaciones');
        inputFile.files = event.dataTransfer.files; // Establece los archivos seleccionados en el input oculto
        inputFile.dispatchEvent(new Event('change')); // Simula el evento de cambio
        document.getElementById('ArrastrarArchivo').classList.remove('drag-over');
        // Oculta el área de arrastrar y soltar al cargar un archivo
        document.getElementById("dragAndDropArea").style.display = "none";
        document.getElementById("padding").style.display = "none";
        // Muestra el botón de subir archivo al cargar un archivo
        document.getElementById("uploadButton").style.display = "block";
        document.getElementById('message').innerText = 'Tu conversación se ha subido correctamente.';
      } else {
        document.getElementById('spinner').style.display = 'none';
        document.getElementById('fileIcon').style.display = 'block';
        document.getElementById('message').innerText = 'Suelta tu archivo aquí.';
        swal("Error", "El archivo debe ser de tipo .txt", "error");
      }
      document.getElementById('ArrastrarArchivo').classList.remove('drag-over');
    }
}

function handleDragLeave(event) {
    event.preventDefault();
    document.getElementById('message').innerText = 'Arrastra y suelta tu conversación con extensión ".txt".';
    document.getElementById('ArrastrarArchivo').classList.remove('drag-over');
}