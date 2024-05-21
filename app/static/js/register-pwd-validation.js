// Validación de contraseñas
const password = document.getElementById('password')
const passwordVerify = document.getElementById('password-verify')
const passwordFeedback = document.getElementById('password-invalid-feedback')
const passwordVerifyFeedback = document.getElementById('password-verify-invalid-feedback')
const regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d!"\'#$%&/=?¡|°¨*,.\\-;:_<>€@¿{}\\[\\]\\(\\)])[A-Za-z\\d!"\'#$%&/=?¡|°¨*,.\\-;:_<>€@¿{}\\[\\]\\(\\)]{8,}$')

const msgMinLength = 'La contraseña debe tener al menos 8 caracteres.'
const msgPattern = 'La contraseña debe tener al menos una letra mayúscula, una letra minúscula, y un número o un caracter especial.'
const msgNoMatch = 'Las contraseñas no coinciden.'

function checkPwdsMatchValidity() {
    if (password.value !== passwordVerify.value) {
        passwordVerify.setCustomValidity(msgNoMatch)
        passwordVerifyFeedback.innerText = msgNoMatch
    } else {
        passwordVerify.setCustomValidity('')
        passwordVerifyFeedback.innerText = ''
    }
}

function checkPasswordValidity() {
    if (password.value.length < 8) {
        password.setCustomValidity(msgMinLength)
        passwordFeedback.innerText = msgMinLength
    } else {
        if (!regex.test(password.value)) {
            password.setCustomValidity(msgPattern)
            passwordFeedback.innerText = msgPattern
        } else {
            password.setCustomValidity('')
            passwordFeedback.innerText = ''
        }
    }
}

function pwdFieldAddListener() {
    password.addEventListener('input', () => {
        checkPasswordValidity()
        checkPwdsMatchValidity()
    })
}

function pwdVerifyFieldAddListener() {
    passwordVerify.addEventListener('input', () => {
        checkPwdsMatchValidity()
    })
}

document.addEventListener('DOMContentLoaded', () => {
    pwdFieldAddListener()
    pwdVerifyFieldAddListener()
})