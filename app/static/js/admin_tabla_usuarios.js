var modalDeleteUserConfirmation = document.getElementById('modalDeleteUserConfirmation');

modalDeleteUserConfirmation.addEventListener('show.bs.modal', function (event) {
    // Button that triggered the modal
    let button = event.relatedTarget;

    // Extract info
    let name = button.getAttribute('data-name');
    let email = button.getAttribute('data-email');

    // Update the modal's content.
    let modalDeleteUserName = modalDeleteUserConfirmation.querySelector('#modalDeleteUserName');
    modalDeleteUserName.textContent = name;

    let modalDeleteUserEmail = modalDeleteUserConfirmation.querySelector('#modalDeleteUserEmail');
    modalDeleteUserEmail.textContent = email;

    let modalDeleteUserFormInput = modalDeleteUserConfirmation.querySelector('#modalDeleteUserFormInput');
    modalDeleteUserFormInput.value = email;
});