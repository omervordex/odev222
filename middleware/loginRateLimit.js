const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map();

function loginRateLimit(req, res, next) {
  const now = Date.now();
  const address = req.ip || 'unknown';
  const recent = (attempts.get(address) || []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_ATTEMPTS) {
    const error = new Error('Çok fazla giriş denemesi yapıldı. Birkaç dakika bekleyip yeniden deneyin.');
    error.status = 429;
    next(error);
    return;
  }

  recent.push(now);
  attempts.set(address, recent);
  next();
}

module.exports = loginRateLimit;
