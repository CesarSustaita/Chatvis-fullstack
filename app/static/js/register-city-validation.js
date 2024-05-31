function toggleCiudadAlcaldiaAddListener() {    
    const ciudad_label = document.getElementById('label-ciudad');
    document.getElementById('estado-mx').addEventListener('input', function() {
                let estado = document.getElementById('estado-mx').value;
                if (estado === '7' || estado === 'Ciudad de México') { // CDMX
                    ciudad_label.textContent = 'Alcaldía';
                } else {
                    ciudad_label.textContent = 'Ciudad';
                }
    });
}

function toggleEstadoInputListener() {
    const pais = document.getElementById('pais');

    pais.addEventListener('input', function() {
        let containerEstadoMX = document.getElementById('containerEstadoMX');
        let containerEstadoIntl = document.getElementById('containerEstadoIntl');
        let estadoMXInput = document.getElementById('estado-mx');

        if (strIsLikeMexico(pais.value)) {
            containerEstadoMX.classList.remove('d-none');
            containerEstadoIntl.classList.add('d-none');
            estadoMXInput.required = true;
        } else {
            containerEstadoMX.classList.add('d-none');
            containerEstadoIntl.classList.remove('d-none');
            estadoMXInput.required = false;
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
    let paisValue = document.getElementById('pais').value;

    if (strIsLikeMexico(paisValue)) {
        let estadoMX = document.getElementById('estado-mx');
        let valueMX = estadoMX.value;
        if (valueMX == "Selecciona el estado") {
            estadoMX.setCustomValidity('Selecciona un estado de la lista.');
        } else {
            estadoMX.setCustomValidity('');
        }
    } else {
        let estado = document.getElementById('estado');
        let value = estado.value;
        if (value == "") {
            estado.setCustomValidity('Introduce tu estado.');
        } else {
            estado.setCustomValidity('');
        }
    }
}

function stateInputAddListener() {
    const estado = document.getElementById('estado');
    estado.addEventListener('input', function() {
        checkStateValidity();
    });

    const estadoMX = document.getElementById('estado-mx');
    estadoMX.addEventListener('input', function () {
        checkStateValidity();
        // Copy value to hidden input Estado (Definitive)
        if (estadoMX.value !== "Selecciona el estado") {
            document.getElementById('estado').value = estadoMX.value;
        } else {
            document.getElementById('estado').value = '';
        }
    });
}

function selectSavedEstadoMX() {
    let estadoMX = document.getElementById('estado-mx');
    let estado = document.getElementById('estado').value;
    if (estado !== '') {
        estadoMX.value = estado;
    }
}

function checkIfSavedOtherCountry() {
    let pais = document.getElementById('pais').value;

    let containerEstadoMX = document.getElementById('containerEstadoMX');
    let containerEstadoIntl = document.getElementById('containerEstadoIntl');
    let estadoMXInput = document.getElementById('estado-mx');

    if (!strIsLikeMexico(pais)) {
        containerEstadoMX.classList.add('d-none');
        containerEstadoIntl.classList.remove('d-none');
        estadoMXInput.required = false;
    } else {
        containerEstadoMX.classList.remove('d-none');
        containerEstadoIntl.classList.add('d-none');
        estadoMXInput.required = true;
    }
}

function strIsLikeMexico(str) {
    strUpper = str.toUpperCase();
    return strUpper === 'MEXICO' || strUpper === 'MÉXICO' || strUpper === 'MX' || strUpper === 'MEX' || strUpper === 'MÉX';
}

document.addEventListener('DOMContentLoaded', function() {
    toggleCiudadAlcaldiaAddListener();
    formValidationAddListener();
    stateInputAddListener();
    toggleEstadoInputListener();
    selectSavedEstadoMX();
    checkIfSavedOtherCountry();
});