(function () {
  const root = document.querySelector('[data-quiz]');
  const catalogNode = document.getElementById('quiz-catalog');
  if (!root || !catalogNode) {
    return;
  }

  const catalog = JSON.parse(catalogNode.textContent || '[]');
  const questions = [
    {
      id: 'style',
      text: 'Hangi tarz sana daha yakın?',
      options: [
        ['minimal', 'Minimal ve modern', '/images/demo-studio-round.jpg'],
        ['classic', 'Klasik ve zamansız', '/images/demo-archive-browline.jpg'],
        ['bold', 'Cesur ve dikkat çekici', '/images/demo-atelier-cateye.jpg'],
        ['elegant', 'Zarif ve sofistike', '/images/demo-gallery-portrait.jpg']
      ]
    },
    {
      id: 'shape',
      text: 'Hangi çerçeve şekli hoşuna gidiyor?',
      options: [
        ['round', 'Yuvarlak', '/images/demo-harbor-round.jpg'],
        ['square', 'Kare', '/images/demo-quiet-square.jpg'],
        ['rectangle', 'Dikdörtgen', '/images/demo-archive-browline.jpg'],
        ['cat-eye', 'Cat-eye', '/images/demo-atelier-cateye.jpg'],
        ['aviator', 'Aviator', '/images/demo-open-aviator.jpg']
      ]
    },
    {
      id: 'material',
      text: 'Hangi çerçeve materyalini tercih edersin?',
      options: [
        ['metal', 'İnce metal', '/images/demo-studio-round.jpg'],
        ['acetate', 'Asetat', '/images/demo-atelier-cateye.jpg'],
        ['light', 'Hafif ve minimal çerçeveler', '/images/demo-open-aviator.jpg'],
        ['any', 'Fark etmez', '/images/category-optical.jpg']
      ]
    },
    {
      id: 'occasion',
      text: 'Gözlüğü en çok nerede kullanacaksın?',
      options: [
        ['everyday', 'Günlük kullanım', '/images/demo-studio-round.jpg'],
        ['work', 'İş ve profesyonel ortamlar', '/images/demo-archive-browline.jpg'],
        ['fashion', 'Moda ve özel günler', '/images/demo-gallery-portrait.jpg'],
        ['outdoor', 'Açık hava aktiviteleri', '/images/demo-neon-round.jpg']
      ]
    },
    {
      id: 'color',
      text: 'Hangi renkleri tercih edersin?',
      options: [
        ['black', 'Siyah', '/images/demo-quiet-square.jpg'],
        ['silver', 'Gümüş veya metalik', '/images/demo-open-aviator.jpg'],
        ['clear', 'Şeffaf', '/images/category-contacts.jpg'],
        ['brown', 'Kahverengi veya desenli', '/images/demo-harbor-round.jpg'],
        ['any', 'Fark etmez', '/images/category-optical.jpg']
      ]
    },
    {
      id: 'looking',
      text: 'Ne tür gözlük arıyorsun?',
      options: [
        ['prescription', 'Numaralı gözlük', '/images/category-optical.jpg'],
        ['sunglasses', 'Güneş gözlüğü', '/images/category-sunglasses.jpg'],
        ['both', 'Her ikisi', '/images/demo-mirror-round.jpg'],
        ['exploring', 'Sadece tarzları keşfediyorum', '/images/hero-editorial.jpg']
      ]
    }
  ];

  const styleProducts = {
    round: ['studio-round', 'harbor-round', 'neon-round', 'mirror-round'],
    rectangular: ['archive-browline'],
    square: ['quiet-square'],
    aviator: ['open-aviator'],
    'cat-eye': ['atelier-cat-eye', 'gallery-portrait'],
    'minimal-metal': ['studio-round', 'harbor-round']
  };

  const labels = {
    round: 'Yuvarlak Çerçeveler',
    rectangular: 'Dikdörtgen Çerçeveler',
    square: 'Kare Çerçeveler',
    aviator: 'Aviator Modeller',
    'cat-eye': 'Cat-eye Modeller',
    'minimal-metal': 'Minimal Metal Çerçeveler'
  };

  const resultImages = {
    round: '/images/demo-studio-round.jpg',
    rectangular: '/images/demo-archive-browline.jpg',
    square: '/images/demo-quiet-square.jpg',
    aviator: '/images/demo-open-aviator.jpg',
    'cat-eye': '/images/demo-atelier-cateye.jpg',
    'minimal-metal': '/images/demo-studio-round.jpg'
  };

  const ask = root.querySelector('[data-quiz-ask]');
  const stage = root.querySelector('[data-quiz-stage]');
  const result = root.querySelector('[data-result]');
  const progress = root.querySelector('[data-progress]');
  const bar = root.querySelector('[data-progress-bar]');
  const question = root.querySelector('[data-question]');
  const options = root.querySelector('[data-options]');
  const prev = root.querySelector('[data-prev]');
  const next = root.querySelector('[data-next]');
  let step = 0;
  const answers = {};

  function add(scores, key, amount) {
    scores[key] = (scores[key] || 0) + amount;
  }

  function scoreAnswers() {
    const scores = {
      round: 0,
      rectangular: 0,
      square: 0,
      aviator: 0,
      'cat-eye': 0,
      'minimal-metal': 0
    };
    const style = answers.style;
    const shape = answers.shape;
    const material = answers.material;
    const occasion = answers.occasion;
    const color = answers.color;
    const looking = answers.looking;

    if (style === 'minimal') {
      add(scores, 'minimal-metal', 2);
      add(scores, 'rectangular', 1);
    } else if (style === 'classic') {
      add(scores, 'rectangular', 2);
      add(scores, 'round', 1);
    } else if (style === 'bold') {
      add(scores, 'square', 2);
      add(scores, 'cat-eye', 1);
    } else if (style === 'elegant') {
      add(scores, 'cat-eye', 2);
      add(scores, 'round', 1);
    }

    const shapeKey = shape === 'rectangle' ? 'rectangular' : shape;
    if (scores[shapeKey] !== undefined) {
      add(scores, shapeKey, 4);
    }
    if (shape === 'round') {
      add(scores, 'minimal-metal', 1);
    }

    if (material === 'metal') {
      add(scores, 'minimal-metal', 3);
      add(scores, 'aviator', 1);
      add(scores, 'round', 1);
    } else if (material === 'acetate') {
      add(scores, 'square', 2);
      add(scores, 'cat-eye', 1);
      add(scores, 'rectangular', 1);
    } else if (material === 'light') {
      add(scores, 'minimal-metal', 3);
      add(scores, 'rectangular', 1);
    }

    if (occasion === 'everyday') {
      add(scores, 'rectangular', 2);
      add(scores, 'minimal-metal', 1);
    } else if (occasion === 'work') {
      add(scores, 'rectangular', 2);
      add(scores, 'square', 1);
    } else if (occasion === 'fashion') {
      add(scores, 'cat-eye', 2);
      add(scores, 'round', 1);
    } else if (occasion === 'outdoor') {
      add(scores, 'aviator', 3);
      add(scores, 'square', 1);
    }

    if (color === 'black') {
      add(scores, 'square', 1);
      add(scores, 'rectangular', 1);
    } else if (color === 'silver') {
      add(scores, 'minimal-metal', 2);
      add(scores, 'aviator', 1);
    } else if (color === 'clear') {
      add(scores, 'minimal-metal', 1);
      add(scores, 'rectangular', 1);
    } else if (color === 'brown') {
      add(scores, 'round', 1);
      add(scores, 'cat-eye', 1);
    }

    if (looking === 'prescription') {
      add(scores, 'rectangular', 1);
      add(scores, 'minimal-metal', 1);
    } else if (looking === 'sunglasses') {
      add(scores, 'aviator', 2);
      add(scores, 'square', 1);
    } else if (looking === 'both') {
      add(scores, 'round', 1);
      add(scores, 'aviator', 1);
    }

    const ranked = Object.keys(scores).sort(function (left, right) {
      return scores[right] - scores[left];
    });
    let winner = ranked[0];
    const explicit = shapeKey && scores[shapeKey] !== undefined ? shapeKey : '';
    if (explicit && scores[winner] - scores[explicit] <= 1) {
      winner = explicit;
    }

    return { winner: winner, scores: scores };
  }

  function explain(winner) {
    const styleText = {
      minimal: 'minimal ve modern',
      classic: 'klasik ve zamansız',
      bold: 'cesur ve dikkat çekici',
      elegant: 'zarif ve sofistike'
    };
    const shapeText = {
      round: 'yuvarlak',
      square: 'kare',
      rectangle: 'dikdörtgen',
      'cat-eye': 'cat-eye',
      aviator: 'aviator'
    };
    const useText = {
      everyday: 'günlük kullanım',
      work: 'iş ve profesyonel ortamlar',
      fashion: 'moda ve özel günler',
      outdoor: 'açık hava aktiviteleri'
    };
    const lookText = {
      prescription: 'Numaralı gözlük aradığını belirttin.',
      sunglasses: 'Güneş gözlüğü aradığını belirttin.',
      both: 'Hem numaralı gözlük hem güneş gözlüğü için açık olduğunu belirttin.',
      exploring: 'Şimdilik tarzları keşfettiğini belirttin.'
    };

    return 'Seçimlerin ' + styleText[answers.style] + ' bir tarza, ' + shapeText[answers.shape] + ' bir forma ve ' + useText[answers.occasion] + ' kullanımına işaret ediyor. Buna göre öne çıkan stil: ' + labels[winner] + '. ' + (lookText[answers.looking] || '') + ' Puanlar yakınsa işaretlediğin çerçeve şekli daha fazla ağırlık aldı.';
  }

  function render() {
    const current = questions[step];
    progress.textContent = 'Soru ' + (step + 1) + ' / ' + questions.length;
    bar.style.width = (((step + 1) / questions.length) * 100) + '%';
    question.textContent = current.text;
    options.innerHTML = '';
    current.options.forEach(function (option) {
      const button = document.createElement('button');
      const photo = document.createElement('img');
      const label = document.createElement('span');
      button.type = 'button';
      button.className = 'quiz-card' + (answers[current.id] === option[0] ? ' is-selected' : '');
      button.setAttribute('aria-pressed', answers[current.id] === option[0] ? 'true' : 'false');
      photo.src = option[2];
      photo.alt = '';
      label.textContent = option[1];
      button.appendChild(photo);
      button.appendChild(label);
      button.addEventListener('click', function () {
        answers[current.id] = option[0];
        render();
      });
      options.appendChild(button);
    });
    prev.disabled = step === 0;
    next.textContent = step === questions.length - 1 ? 'Sonucu gör' : 'Sonraki';
    next.disabled = !answers[current.id];
    stage.classList.remove('is-changing');
    window.requestAnimationFrame(function () {
      stage.classList.add('is-changing');
    });
  }

  function showResult() {
    const outcome = scoreAnswers();
    const slugs = styleProducts[outcome.winner] || [];
    const picks = slugs.map(function (slug) {
      return catalog.find(function (product) {
        return product.slug === slug;
      });
    }).filter(Boolean);
    const lead = picks[0];
    const image = root.querySelector('[data-result-image]');
    const title = root.querySelector('[data-result-title]');
    const copy = root.querySelector('[data-result-copy]');
    const list = root.querySelector('[data-result-products]');

    title.textContent = labels[outcome.winner];
    copy.textContent = explain(outcome.winner);
    image.src = lead && lead.image ? lead.image : resultImages[outcome.winner];
    image.alt = lead ? lead.name : labels[outcome.winner];
    list.innerHTML = '';
    picks.forEach(function (product) {
      const link = document.createElement('a');
      link.href = '/products/' + product.slug;
      link.textContent = product.name + (product.category ? ' · ' + product.category : '');
      list.appendChild(link);
    });
    if (!picks.length) {
      const note = document.createElement('p');
      note.textContent = 'Tanıtım kataloğunda bu stile yakın bir örnek henüz yok.';
      list.appendChild(note);
    }
    ask.hidden = true;
    result.hidden = false;
  }

  prev.addEventListener('click', function () {
    if (step > 0) {
      step -= 1;
      render();
    }
  });

  next.addEventListener('click', function () {
    if (!answers[questions[step].id]) {
      return;
    }
    if (step < questions.length - 1) {
      step += 1;
      render();
      return;
    }
    showResult();
  });

  root.querySelector('[data-restart]').addEventListener('click', function () {
    step = 0;
    Object.keys(answers).forEach(function (key) {
      delete answers[key];
    });
    result.hidden = true;
    ask.hidden = false;
    render();
  });

  render();
}());
