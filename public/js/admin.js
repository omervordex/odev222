document.querySelectorAll('[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (event) => {
    const message = form.getAttribute('data-confirm');
    if (!window.confirm(message)) {
      event.preventDefault();
    }
  });
});

const picker = document.querySelector('[data-image-picker]');

if (picker) {
  const input = picker.querySelector('[data-image-input]');
  const preview = picker.querySelector('[data-image-preview]');
  const empty = picker.querySelector('[data-image-empty]');
  const clear = picker.querySelector('[data-image-clear]');
  const remove = picker.querySelector('[data-image-remove]');
  const drop = picker.querySelector('[data-image-drop]');
  const note = picker.querySelector('[data-image-note]');
  const current = picker.getAttribute('data-current') || '';
  const maxBytes = 5 * 1024 * 1024;
  const accepted = ['image/jpeg', 'image/png', 'image/webp'];

  function show(src) {
    if (!src) {
      preview.hidden = true;
      preview.removeAttribute('src');
      empty.hidden = false;
      return;
    }

    preview.src = src;
    preview.hidden = false;
    empty.hidden = true;
  }

  function useFile(file) {
    if (!file) {
      return;
    }

    if (!accepted.includes(file.type)) {
      input.value = '';
      note.textContent = 'Yalnızca JPG, PNG veya WEBP seçin.';
      return;
    }

    if (file.size > maxBytes) {
      input.value = '';
      note.textContent = 'Dosya 5 MB sınırını aşıyor.';
      return;
    }

    note.textContent = '';
    if (remove) {
      remove.checked = false;
    }

    const reader = new FileReader();
    reader.onload = () => show(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  input.addEventListener('change', () => {
    useFile(input.files && input.files[0]);
  });

  ['dragenter', 'dragover'].forEach((name) => {
    drop.addEventListener(name, (event) => {
      event.preventDefault();
      drop.classList.add('is-dragover');
    });
  });

  drop.addEventListener('dragleave', () => {
    drop.classList.remove('is-dragover');
  });

  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    drop.classList.remove('is-dragover');
    const file = event.dataTransfer.files && event.dataTransfer.files[0];
    if (!file) {
      return;
    }

    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    useFile(file);
  });

  clear.addEventListener('click', () => {
    input.value = '';
    note.textContent = '';
    show(remove && remove.checked ? '' : current);
  });

  if (remove) {
    remove.addEventListener('change', () => {
      input.value = '';
      note.textContent = '';
      show(remove.checked ? '' : current);
    });
  }
}
