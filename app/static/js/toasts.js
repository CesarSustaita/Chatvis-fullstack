function showToastError(error_msg) {
    Toastify({
        text: error_msg,
        duration: 2400,
        gravity: 'top',
        position: 'center',
        style: {
            background: "linear-gradient(to left, #e33a3a, #db3838)",
        },
        close: true,
        stopOnFocus: true,
    }).showToast();
}

function showToastSuccess(success_msg) {
    Toastify({
        text: success_msg,
        duration: 2400,
        gravity: 'top',
        position: 'center',
        style: {
            background: "linear-gradient(to right, #2cb983, #29ab7b)",
        },
        close: true,
        stopOnFocus: true,
    }).showToast();
}

function showToastWarning(warning_msg) {
    Toastify({
        text: warning_msg,
        duration: 2400,
        gravity: 'top',
        position: 'center',
        style: {
            background: "linear-gradient(to right, #f7b42c, #f5a82a)",
        },
        close: true,
        stopOnFocus: true,
    }).showToast();
}

function showToastInfo(info_msg) {
    Toastify({
        text: info_msg,
        duration: 2400,
        gravity: 'top',
        position: 'center',
        style: {
            background: "linear-gradient(to right, #2c9fb9, #2a97b1)",
        },
        close: true,
        stopOnFocus: true,
    }).showToast();
}
