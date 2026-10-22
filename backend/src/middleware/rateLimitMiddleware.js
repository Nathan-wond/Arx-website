export function createRateLimiter(options)

{
  const store = new Map();
  const { windowMs, max, message = 'Too many requests from this address. Please wait a moment and try again.' } = options;

  
  const cleanupInterval = Math.max(windowMs, 60000);
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      if (record.resetAt <= now) {
        store.delete(key);
      }
    }
  }, cleanupInterval).unref();

  return (req, res, next) => {
    let ip = 'unknown-client';
    try {
      if (options.keyGenerator) {
        ip = options.keyGenerator(req) || 'unknown-client';
      } else {
        const xff = req.headers['x-forwarded-for'];
        // Validate IP format to prevent header spoofing bypass
        const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
        const ipv6Regex = /^[0-9a-fA-F:]+$/;
        if (typeof xff === 'string' && xff.length > 0) {
          const candidate = xff.split(',')[0].trim();
          if (ipv4Regex.test(candidate) || ipv6Regex.test(candidate)) {
            ip = candidate;
          } else {
            ip = req.ip || req.socket?.remoteAddress || 'unknown-client';
          }
        } else if (Array.isArray(xff) && xff.length > 0 && typeof xff[0] === 'string') {
          const candidate = xff[0].split(',')[0].trim();
          if (ipv4Regex.test(candidate) || ipv6Regex.test(candidate)) {
            ip = candidate;
          } else {
            ip = req.ip || req.socket?.remoteAddress || 'unknown-client';
          }
        } else if (req.ip) {
          ip = req.ip;
        } else if (req.socket?.remoteAddress) {
          ip = req.socket.remoteAddress;
        }
      }
    } catch {
      ip = 'unknown-client';
    }

    const now = Date.now();
    const existing = store.get(ip);

    if (!existing || existing.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (existing.count >= max) {
      const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      res.status(429).json({
        error: message,
        retryAfter: retryAfterSeconds
      });
      return;
    }

    existing.count += 1;
    next();
  };
}
