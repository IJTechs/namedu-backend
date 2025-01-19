import dotenv from 'dotenv'

dotenv.config()

export const config = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGODB_URI || '',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN,
  ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_EXPIRE || '2m',
  REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE || '5m',
  JWT_ISSUER: process.env.JWT_ISSUER || 'namedu.uz',
}
