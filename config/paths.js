const fs = require('fs');
const path = require('path');

/**
 * Finds a project directory both in a normal Node process and inside the
 * Netlify function bundle. esbuild rewrites __dirname to the bundle folder,
 * while included files such as views/ keep their project-relative path.
 */
function existingDirectory(...parts) {
  const tail = path.join(...parts);
  const candidates = [
    path.join(__dirname, tail),
    path.join(process.cwd(), tail),
    path.join(__dirname, '..', tail),
    path.join(__dirname, '..', '..', tail)
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

module.exports = {
  existingDirectory
};
