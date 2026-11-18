const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const config = require('./config');
require('./config/supabase');
const pageRoutes = require('./routes/pageRoutes');
const productRoutes = require('./routes/productRoutes');
const adminRoutes = require('./routes/adminRoutes');
const healthRoutes = require('./routes/healthRoutes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

if (!config.sessionSecret) {
  throw new Error('Missing SESSION_SECRET. Add it to the local .env file.');
}

const app = express();

const storeAddress = 'Başak Mah., Yeşil Vadi Cad., Referans Vadi Sitesi Dükkanları C Blok No: 14, 34480 Başakşehir / Istanbul';

app.locals.storeName = 'Optik Ayşegül Özçelik';
app.locals.description = 'Optik Ayşegül Özçelik, Başakşehir’de numaralı gözlük, güneş gözlüğü ve kontakt lens sunan bir optik mağazasıdır.';
app.locals.store = {
  name: 'Optik Ayşegül Özçelik',
  location: 'Başakşehir, İstanbul',
  address: storeAddress,
  phoneDisplay: '+90 533 255 5942',
  phoneTel: '+905332555942',
  landmark: 'Metrokent Metro İstasyonu',
  hours: '09:00–19:30',
  hoursNote: 'Bildirilen çalışma saatleridir. Ziyaret etmeden önce resmi tatilleri ve güncel saatleri teyit edin.',
  instagram: 'https://www.instagram.com/optikaysegulozcelik/',
  facebook: 'https://www.facebook.com/optikaysegulozcelik/',
  mapsUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(storeAddress)}`,
  mapsEmbed: `https://maps.google.com/maps?q=${encodeURIComponent(storeAddress)}&z=16&output=embed`,
  services: ['Numaralı gözlük', 'Güneş gözlüğü', 'Kontakt lens']
};
app.locals.statusLabel = function statusLabel(status) {
  const labels = {
    new: 'Yeni',
    read: 'Okundu',
    answered: 'Yanıtlandı',
    closed: 'Kapatıldı'
  };

  return labels[status] || status;
};
app.locals.formatPrice = function formatPrice(price) {
  if (price === null || price === undefined || price === '') {
    return '';
  }

  const amount = Number(price);
  if (!Number.isFinite(amount)) {
    return '';
  }

  return amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
app.locals.formatDate = function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'https:'],
      frameSrc: ["'self'", 'https://maps.google.com', 'https://www.google.com']
    }
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/vendor/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));
app.use('/vendor/tabler', express.static(path.join(__dirname, 'node_modules/@tabler/core/dist')));
app.use(express.static(path.join(__dirname, 'public')));

// MemoryStore keeps sessions in this process only. That is a deployment blocker
// for production: use a shared session store before running more than one server.
app.use(session({
  name: 'optical.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: 1000 * 60 * 60 * 8
  }
}));

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  next();
});

app.use(healthRoutes);
app.use(pageRoutes);
app.use('/products', productRoutes);
app.use('/admin', adminRoutes);

if (!config.isProduction) {
  const devRoutes = require('./routes/devRoutes');
  app.use(devRoutes);
}

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port} (${config.nodeEnv})`);
});
