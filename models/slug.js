const LETTERS = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u'
};

function slugify(value) {
  const folded = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[çğıöşüâîû]/g, (letter) => LETTERS[letter] || letter);

  return folded
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

module.exports = slugify;
