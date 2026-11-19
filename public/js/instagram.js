const cards = document.querySelectorAll('[data-ig-card]');
const grid = document.querySelector('[data-ig-grid]');
const embedSrc = 'https://www.instagram.com/embed.js';

function hideGridIfEmpty() {
  if (grid && !grid.querySelector('[data-ig-card]')) {
    grid.hidden = true;
  }
}

function showFallback(card) {
  if (!card.isConnected || card.classList.contains('is-embed')) {
    return;
  }

  const embed = card.querySelector('[data-ig-embed]');
  const fallback = card.querySelector('[data-ig-fallback]');

  if (embed) {
    embed.remove();
  }

  if (!fallback) {
    card.remove();
    hideGridIfEmpty();
    return;
  }

  card.classList.add('is-fallback');
}

function markReady(card) {
  const frame = card.querySelector('iframe');
  if (!frame || frame.offsetHeight < 180 || card.classList.contains('is-embed') || card.classList.contains('is-fallback')) {
    return false;
  }

  card.classList.add('is-embed');
  const fallback = card.querySelector('[data-ig-fallback]');
  if (fallback) {
    fallback.hidden = true;
  }
  return true;
}

if (cards.length) {
  const started = Date.now();
  const watch = window.setInterval(() => {
    cards.forEach(markReady);
    const pending = [...cards].some((card) => card.isConnected && !card.classList.contains('is-embed') && !card.classList.contains('is-fallback'));
    if (!pending || Date.now() - started > 8000) {
      window.clearInterval(watch);
      cards.forEach((card) => {
        if (!card.classList.contains('is-embed')) {
          showFallback(card);
        }
      });
    }
  }, 400);

  const scripts = document.querySelectorAll(`script[src="${embedSrc}"]`);
  if (scripts.length > 1) {
    scripts.forEach((script, index) => {
      if (index > 0) {
        script.remove();
      }
    });
  }

  const existing = scripts[0];
  if (existing) {
    existing.addEventListener('error', () => {
      cards.forEach(showFallback);
    });
  } else {
    const script = document.createElement('script');
    script.async = true;
    script.src = embedSrc;
    script.addEventListener('error', () => {
      cards.forEach(showFallback);
    });
    document.body.appendChild(script);
  }

  if (window.instgrm && window.instgrm.Embeds) {
    window.instgrm.Embeds.process();
  }
}
