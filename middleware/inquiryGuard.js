/**
 * Limits repeated contact posts from one address and ignores cross-site form posts.
 * The memory store is enough for one server process and resets when the process restarts.
 * On Netlify it is per function instance, so it is a best-effort limit rather than a shared counter.
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_POSTS = 10;
const hits = new Map();

function clientAddress(req) {
  return req.ip || 'unknown';
}

function inquiryGuard(req, res, next) {
  const site = req.get('Sec-Fetch-Site');
  if (site && site !== 'same-origin' && site !== 'none') {
    const error = new Error('Mesaj gönderilemedi. Lütfen yeniden deneyin.');
    error.status = 403;
    next(error);
    return;
  }

  const now = Date.now();
  const address = clientAddress(req);
  const recent = (hits.get(address) || []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_POSTS) {
    const error = new Error('Bu bağlantıdan çok fazla mesaj gönderildi. Birkaç dakika bekleyip yeniden deneyin.');
    error.status = 429;
    next(error);
    return;
  }

  recent.push(now);
  hits.set(address, recent);
  next();
}

module.exports = inquiryGuard;
