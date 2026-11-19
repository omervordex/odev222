const express = require('express');
const helmet = require('helmet');

const config = require('./config');
const { existingDirectory } = require('./config/paths');
const adminSession = require('./middleware/adminSession');
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

if (process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY === 'true') {
  app.set('trust proxy', 1);
}

function stripFunctionPrefix(req, res, next) {
  const prefix = '/.netlify/functions/server';
  const queryIndex = req.url.indexOf('?');
  const pathname = queryIndex === -1 ? req.url : req.url.slice(0, queryIndex);
  const query = queryIndex === -1 ? '' : req.url.slice(queryIndex);

  if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
    req.url = `${pathname.slice(prefix.length) || '/'}${query}`;
  }

  next();
}

app.use(stripFunctionPrefix);

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

const viewsDir = existingDirectory('views');

if (!viewsDir) {
  throw new Error('EJS views directory was not found.');
}

app.set('view engine', 'ejs');
app.set('views', viewsDir);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'", 'https://www.instagram.com'],
      frameSrc: ["'self'", 'https://maps.google.com', 'https://www.google.com', 'https://www.instagram.com', 'https://instagram.com']
    }
  }
}));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
function mountStatic(urlPath, candidates) {
  const directory = candidates.find((candidate) => candidate);
  if (directory) {
    app.use(urlPath, express.static(directory));
  }
}

mountStatic('/vendor/bootstrap', [
  existingDirectory('node_modules', 'bootstrap', 'dist'),
  existingDirectory('public', 'vendor', 'bootstrap')
]);
mountStatic('/vendor/tabler', [
  existingDirectory('node_modules', '@tabler', 'core', 'dist'),
  existingDirectory('public', 'vendor', 'tabler')
]);

const publicDir = existingDirectory('public');
if (publicDir) {
  app.use(express.static(publicDir));
}

// The admin session lives in a signed cookie so it survives separate
// Netlify function instances. Do not put secrets other than the admin id,
// CSRF token, and flash message in this cookie.
app.use(adminSession);

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

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port} (${config.nodeEnv})`);
  });
}

module.exports = app;
