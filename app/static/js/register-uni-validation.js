function validateCheckboxSelection() {
    const checkbox = document.getElementById("terminos-checkbox");
    if (!checkbox.checked) {
        checkbox.setCustomValidity('Debes aceptar los términos y condiciones.');
    } else {
        checkbox.setCustomValidity('');
    }
}

function checkboxAddListener() {
    const checkbox = document.getElementById("terminos-checkbox");
    checkbox.addEventListener('change', function () {
        validateCheckboxSelection();
    });
}
function addFormValidation() {
    const form = document.getElementById('form-register-uni')
    form.addEventListener('submit', event => {
        
        validateCheckboxSelection();

        if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()
        }

        form.classList.add('was-validated')
    }, false)
}

document.addEventListener('DOMContentLoaded', () => {
    checkboxAddListener();
    addFormValidation();
});