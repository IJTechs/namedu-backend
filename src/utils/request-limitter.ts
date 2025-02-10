import rateLimit from 'express-rate-limit'

const requestLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    error: 'Too many requests, please try again later.',
  },
})

export default requestLimiter
