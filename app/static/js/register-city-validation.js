function toggleCiudadAlcaldiaAddListener() {    
    const ciudad_label = document.getElementById('label-ciudad');
    document.getElementById('estado').addEventListener('input', function() {
                let estado = document.getElementById('estado').value;
                if (estado === '7') { // CDMX
                    ciudad_label.textContent = 'Alcaldía';
                } else {
                    ciudad_label.textContent = 'Ciudad';
                }
    });
}

function formValidationAddListener() {
    const form = document.getElementById('form-register-city');
    form.addEventListener('submit', function(event) {
        
        checkStateValidity();

        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopPropagation();
        }
        form.classList.add('was-validated');
    });
}

function checkStateValidity() {
    let estado = document.getElementById('estado');
    let value = parseInt(estado.value);
    if (isNaN(value) || value < 1 || value > 32) {
        estado.setCustomValidity('Selecciona un estado de la lista.');
    } else {
        estado.setCustomValidity('');
    }
}

function stateInputAddListener() {
    const estado = document.getElementById('estado');
    estado.addEventListener('input', function() {
        checkStateValidity();
    });
}

document.addEventListener('DOMContentLoaded', function() {
    toggleCiudadAlcaldiaAddListener();
    formValidationAddListener();
    stateInputAddListener();
});