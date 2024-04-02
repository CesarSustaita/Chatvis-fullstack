// Validación de contraseñas
const password = document.getElementById('password')
const passwordVerify = document.getElementById('password-verify')
const passwordFeedback = document.getElementById('password-invalid-feedback')
const passwordVerifyFeedback = document.getElementById('password-verify-invalid-feedback')
let regex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[\\d!"\'#$%&/=?¡|°¨*,.\\-;:_<>€@¿{}\\[\\]\\(\\)])[A-Za-z\\d!"\'#$%&/=?¡|°¨*,.\\-;:_<>€@¿{}\\[\\]\\(\\)]{8,}$')

let msgMinLength = 'La contraseña debe tener al menos 8 caracteres.'
let msgPattern = 'La contraseña debe tener al menos una letra mayúscula, una letra minúscula, y un número o un caracter especial.'
let msgNoMatch = 'Las contraseñas no coinciden.'

password.addEventListener('input', () => {
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

    if (password.value !== passwordVerify.value) {
        passwordVerify.setCustomValidity(msgNoMatch)
        passwordVerifyFeedback.innerText = msgNoMatch
    } else {
        passwordVerify.setCustomValidity('')
        passwordVerifyFeedback.innerText = ''
    }
})

passwordVerify.addEventListener('input', () => {
    if (password.value !== passwordVerify.value) {
        passwordVerify.setCustomValidity(msgNoMatch)
        passwordVerifyFeedback.innerText = msgNoMatch
    } else {
        passwordVerify.setCustomValidity('')
        passwordVerifyFeedback.innerText = ''
    }
})
