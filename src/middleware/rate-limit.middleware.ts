import rateLimit from 'express-rate-limit';

export const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,                // 200 requests per minute
  message: { 
    success: false, 
    error: 'Too many requests, please slow down' 
  },
  standardHeaders: true,
  legacyHeaders: false,
});
