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
        ['minimal', 'Minimal ve modern'],
        ['classic', 'Klasik ve zamansız'],
        ['bold', 'Cesur ve dikkat çekici'],
        ['elegant', 'Zarif ve sofistike']
      ]
    },
    {
      id: 'shape',
      text: 'Hangi çerçeve şekli hoşuna gidiyor?',
      options: [
        ['round', 'Yuvarlak'],
        ['square', 'Kare'],
        ['rectangle', 'Dikdörtgen'],
        ['cat-eye', 'Cat-eye'],
        ['aviator', 'Aviator']
      ]
    },
    {
      id: 'material',
      text: 'Hangi çerçeve materyalini tercih edersin?',
      options: [
        ['metal', 'İnce metal'],
        ['acetate', 'Asetat'],
        ['light', 'Hafif ve minimal çerçeveler'],
        ['any', 'Fark etmez']
      ]
    },
    {
      id: 'occasion',
      text: 'Gözlüğü en çok nerede kullanacaksın?',
      options: [
        ['everyday', 'Günlük kullanım'],
        ['work', 'İş ve profesyonel ortamlar'],
        ['fashion', 'Moda ve özel günler'],
        ['outdoor', 'Açık hava aktiviteleri']
      ]
    },
    {
      id: 'color',
      text: 'Hangi renkleri tercih edersin?',
      options: [
        ['black', 'Siyah'],
        ['silver', 'Gümüş veya metalik'],
        ['clear', 'Şeffaf'],
        ['brown', 'Kahverengi veya desenli'],
        ['any', 'Fark etmez']
      ]
    },
    {
      id: 'looking',
      text: 'Ne tür gözlük arıyorsun?',
      options: [
        ['prescription', 'Numaralı gözlük'],
        ['sunglasses', 'Güneş gözlüğü'],
        ['both', 'Her ikisi'],
        ['exploring', 'Sadece tarzları keşfediyorum']
      ]
    }
  ];

  const labels = {
    classic: 'Klasik ve Zamansız Çerçeveler',
    modern: 'Modern ve Minimal Çerçeveler',
    bold: 'Cesur ve Dikkat Çekici Çerçeveler',
    round: 'Yuvarlak ve Vintage Çerçeveler',
    cateye: 'Zarif Cat-Eye Çerçeveler',
    sporty: 'Sportif ve Günlük Çerçeveler'
  };

  const resultImages = {
    classic: {
      src: '/images/demo-archive-browline.jpg',
      alt: 'Kaplumbağa desenli klasik kaş üstü numaralı gözlük.'
    },
    modern: {
      src: '/images/Crystal%20Frames%20on%20Travertine%20Stone-1.png',
      alt: 'Traverten üzerinde şeffaf, ince ve modern bir numaralı gözlük.'
    },
    bold: {
      src: '/images/Tortoiseshell%20Sunglasses%20in%20Warm%20Sunlight-2.png',
      alt: 'Kalın kaplumbağa desenli, köşeli bir güneş gözlüğü.'
    },
    round: {
      src: '/images/demo-studio-round.jpg',
      alt: 'İnce metal yuvarlak numaralı gözlük.'
    },
    cateye: {
      src: '/images/demo-gallery-portrait.jpg',
      alt: 'Siyah, kalkık köşeli cat-eye gözlük.'
    },
    sporty: {
      src: '/images/demo-quiet-square.jpg',
      alt: 'Kare formlu, günlük kullanıma uygun bir güneş gözlüğü.'
    }
  };

  const styleProducts = {
    classic: ['archive-browline'],
    modern: ['studio-round'],
    bold: ['quiet-square'],
    round: ['studio-round', 'harbor-round', 'neon-round', 'mirror-round'],
    cateye: ['atelier-cat-eye', 'gallery-portrait'],
    sporty: ['open-aviator', 'quiet-square']
  };

  const shapeCategory = {
    round: 'round',
    square: 'bold',
    rectangle: 'classic',
    'cat-eye': 'cateye',
    aviator: 'sporty'
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
      classic: 0,
      modern: 0,
      bold: 0,
      round: 0,
      cateye: 0,
      sporty: 0
    };
    const style = answers.style;
    const shape = answers.shape;
    const material = answers.material;
    const occasion = answers.occasion;
    const color = answers.color;
    const looking = answers.looking;

    if (style === 'minimal') {
      add(scores, 'modern', 3);
      add(scores, 'round', 1);
    } else if (style === 'classic') {
      add(scores, 'classic', 3);
      add(scores, 'round', 1);
    } else if (style === 'bold') {
      add(scores, 'bold', 3);
      add(scores, 'cateye', 1);
    } else if (style === 'elegant') {
      add(scores, 'cateye', 3);
      add(scores, 'classic', 1);
    }

    if (shape === 'round') {
      add(scores, 'round', 4);
      add(scores, 'modern', 1);
    } else if (shape === 'square') {
      add(scores, 'bold', 3);
      add(scores, 'sporty', 2);
    } else if (shape === 'rectangle') {
      add(scores, 'classic', 4);
    } else if (shape === 'cat-eye') {
      add(scores, 'cateye', 4);
      add(scores, 'bold', 1);
    } else if (shape === 'aviator') {
      add(scores, 'sporty', 4);
      add(scores, 'modern', 1);
    }

    if (material === 'metal') {
      add(scores, 'modern', 3);
      add(scores, 'sporty', 1);
      add(scores, 'round', 1);
    } else if (material === 'acetate') {
      add(scores, 'bold', 2);
      add(scores, 'cateye', 2);
      add(scores, 'classic', 1);
    } else if (material === 'light') {
      add(scores, 'modern', 3);
      add(scores, 'classic', 1);
    }

    if (occasion === 'everyday') {
      add(scores, 'modern', 2);
      add(scores, 'classic', 1);
    } else if (occasion === 'work') {
      add(scores, 'classic', 3);
      add(scores, 'modern', 1);
    } else if (occasion === 'fashion') {
      add(scores, 'cateye', 2);
      add(scores, 'bold', 2);
    } else if (occasion === 'outdoor') {
      add(scores, 'sporty', 4);
    }

    if (color === 'black') {
      add(scores, 'classic', 1);
      add(scores, 'bold', 1);
      add(scores, 'cateye', 1);
    } else if (color === 'silver') {
      add(scores, 'modern', 2);
      add(scores, 'sporty', 1);
    } else if (color === 'clear') {
      add(scores, 'modern', 3);
    } else if (color === 'brown') {
      add(scores, 'classic', 2);
      add(scores, 'round', 1);
      add(scores, 'bold', 1);
    }

    if (looking === 'prescription') {
      add(scores, 'classic', 1);
      add(scores, 'modern', 1);
    } else if (looking === 'sunglasses') {
      add(scores, 'sporty', 2);
      add(scores, 'bold', 1);
    } else if (looking === 'both') {
      add(scores, 'round', 1);
      add(scores, 'sporty', 1);
    }

    const ranked = Object.keys(scores).sort(function (left, right) {
      return scores[right] - scores[left];
    });
    let winner = ranked[0];
    const explicit = shapeCategory[shape] || '';
    if (explicit && scores[winner] - scores[explicit] <= 1) {
      winner = explicit;
    }

    return winner;
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
      outdoor: 'açık hava'
    };
    const reason = {
      classic: 'Dengeli çizgiler ve zamansız bir duruş öne çıkıyor.',
      modern: 'Sade çizgiler ve hafif bir görünüm öne çıkıyor.',
      bold: 'Daha güçlü bir form ve dikkat çeken bir duruş öne çıkıyor.',
      round: 'Yumuşak, yuvarlak hatlar öne çıkıyor.',
      cateye: 'Kalkık ve zarif bir çerçeve çizgisi öne çıkıyor.',
      sporty: 'Rahat ve hareketli kullanıma uygun bir form öne çıkıyor.'
    };

    return 'Seçimlerin ' + styleText[answers.style] + ' bir tarza, ' + shapeText[answers.shape] + ' bir forma ve ' + useText[answers.occasion] + ' ihtiyacına işaret ediyor. ' + reason[winner];
  }

  function render() {
    const current = questions[step];
    progress.textContent = 'Soru ' + (step + 1) + ' / ' + questions.length;
    bar.style.width = (((step + 1) / questions.length) * 100) + '%';
    question.textContent = current.text;
    options.innerHTML = '';
    current.options.forEach(function (option) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'quiz-card' + (answers[current.id] === option[0] ? ' is-selected' : '');
      button.setAttribute('aria-pressed', answers[current.id] === option[0] ? 'true' : 'false');
      button.textContent = option[1];
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
    const winner = scoreAnswers();
    const image = resultImages[winner];
    const slugs = styleProducts[winner] || [];
    const picks = slugs.map(function (slug) {
      return catalog.find(function (product) {
        return product.slug === slug;
      });
    }).filter(Boolean);
    const photo = root.querySelector('[data-result-image]');
    const title = root.querySelector('[data-result-title]');
    const copy = root.querySelector('[data-result-copy]');
    const list = root.querySelector('[data-result-products]');

    title.textContent = labels[winner];
    copy.textContent = explain(winner);
    photo.src = image.src;
    photo.alt = image.alt;
    list.innerHTML = '';
    picks.forEach(function (product) {
      const link = document.createElement('a');
      link.href = '/products/' + product.slug;
      link.textContent = product.name + (product.category ? ' · ' + product.category : '');
      list.appendChild(link);
    });
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
