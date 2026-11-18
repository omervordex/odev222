const toggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const inquiryForm = document.querySelector('[data-inquiry-form]');

if (inquiryForm) {
  inquiryForm.addEventListener('submit', () => {
    const button = inquiryForm.querySelector('[type="submit"]');
    if (button) {
      button.disabled = true;
      button.textContent = 'Gönderiliyor';
    }
  });
}
