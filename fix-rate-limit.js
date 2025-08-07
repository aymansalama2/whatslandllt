// Correctifs pour les problèmes de rate limit IPv6
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Rate limiting pour les APIs
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: {
    error: 'Trop de requêtes, veuillez réessayer plus tard.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: true,
  keyGenerator: ipKeyGenerator
});

// Rate limiting spécial pour Firebase APIs
const firebaseLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50,
  message: {
    error: 'Limite de sessions WhatsApp atteinte.',
    retryAfter: '5 minutes'
  },
  trustProxy: true,
  keyGenerator: ipKeyGenerator
});

// Rate limiting spécial pour le monitoring
const statusLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
  message: {
    error: 'Trop de requêtes de monitoring.',
    retryAfter: '1 minute'
  },
  trustProxy: true,
  keyGenerator: ipKeyGenerator
});

module.exports = {
  apiLimiter,
  firebaseLimiter,
  statusLimiter
};