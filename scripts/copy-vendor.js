/**
 * Copies Bootstrap and Tabler into public/vendor so Netlify's CDN can serve
 * them. Express still falls back to node_modules when this copy is absent.
 */
const fs = require('fs');
const path = require('path');

const copies = [
  ['node_modules/bootstrap/dist', 'public/vendor/bootstrap'],
  ['node_modules/@tabler/core/dist', 'public/vendor/tabler']
];

function copyTree(source, target) {
  fs.mkdirSync(target, { recursive: true });

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);

    if (entry.isDirectory()) {
      copyTree(from, to);
    } else if (entry.isFile()) {
      fs.copyFileSync(from, to);
    }
  }
}

copies.forEach(([from, to]) => {
  const source = path.resolve(from);
  const target = path.resolve(to);

  if (!fs.existsSync(source)) {
    throw new Error(`Missing ${from}. Run npm install first.`);
  }

  fs.rmSync(target, { recursive: true, force: true });
  copyTree(source, target);
});
