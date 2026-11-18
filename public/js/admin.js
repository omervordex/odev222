document.querySelectorAll('[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    const message = form.getAttribute('data-confirm');
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  });
});
