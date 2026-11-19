const productModel = require('../models/productModel');

const INSTAGRAM_POSTS = [
  {
    id: 'DWPH2gHjPL4',
    kind: 'video',
    url: 'https://www.instagram.com/optikaysegulozcelik/reel/DWPH2gHjPL4/',
    alt: 'Mağazada oval Tiffany & Co. güneş gözlüğü takan kişi ve öndeki gözlük standı.'
  },
  {
    id: 'DaFq8mCNWAM',
    kind: 'video',
    url: 'https://www.instagram.com/optikaysegulozcelik/reel/DaFq8mCNWAM/',
    alt: 'Bir elde tutulan çerçevesiz güneş gözlüğünün yakın çekimi.'
  },
  {
    id: 'DdQ5JyHkddN',
    kind: 'photo',
    url: 'https://www.instagram.com/optikaysegulozcelik/p/DdQ5JyHkddN/',
    alt: 'Masada Miu Miu kutusu, kılıfı ve iki güneş gözlüğü.'
  }
];

function instagramPosts() {
  return INSTAGRAM_POSTS.map((post) => ({
    ...post,
    image: `/images/instagram/${post.id}.jpg`
  }));
}

async function home(req, res, next) {
  try {
    const featuredProducts = await productModel.listFeatured();

    res.status(200).render('pages/home', {
      title: 'Ana Sayfa',
      description: 'Optik Ayşegül Özçelik, Başakşehir’de bir optik mağazasıdır. Öne çıkan modeller katalogdan gelir.',
      featuredProducts,
      instagramPosts: instagramPosts()
    });
  } catch (error) {
    next(error);
  }
}

async function findYourFrame(req, res, next) {
  try {
    const products = await productModel.listProducts();

    res.status(200).render('pages/findYourFrame', {
      title: 'Gözlük Stilini Keşfet',
      description: 'Tercihlerinize göre bir stil önerisi sunan kısa test. Profesyonel optik veya tıbbi değerlendirme yerine geçmez.',
      quizProducts: products.map((product) => ({
        slug: product.slug,
        name: product.name,
        category: product.category ? product.category.name : '',
        image: product.imageUrl
      }))
    });
  } catch (error) {
    next(error);
  }
}

function about(req, res) {
  res.status(200).render('pages/about', {
    title: 'Hakkımızda',
    description: 'Optik Ayşegül Özçelik, İstanbul Başakşehir’de, Metrokent Metro İstasyonu yakınında bir optik mağazasıdır.'
  });
}

module.exports = {
  home,
  about,
  findYourFrame
};
