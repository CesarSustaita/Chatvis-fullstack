// Check if dark mode is enabled or disabled
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.setAttribute('data-bs-theme', 'dark');
} else {
    document.body.setAttribute('data-bs-theme', 'light');
}

// Check when dark mode is enabled or disabled
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
    if (event.matches) {
        document.body.setAttribute('data-bs-theme', 'dark');
    } else {
        document.body.setAttribute('data-bs-theme', 'light');
    }
});