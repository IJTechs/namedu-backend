import { Request } from 'express'
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
import { jwtDecode } from 'jwt-decode'

import { client } from '../config/redis.config'
import AppError from '../utils/app-error'
import { parseDurationToSeconds } from '../utils/duration-to-seconds'

// Define interfaces for payload and token options
interface TokenPayload extends JwtPayload {
  id: string
}

interface TokenOptions {
  expiresIn: string
  issuer?: string
  audience?: string
}

// Signing access token
const signAccessToken = (id: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const payload: TokenPayload = { id }
    const secret: Secret = process.env.ACCESS_TOKEN_SECRET || 'default_access_secret'
    const options: TokenOptions = {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '1h',
      issuer: process.env.JWT_ISSUER || 'default_issuer',
      audience: id,
    }

    jwt.sign(payload, secret, options, (err, token) => {
      if (err) {
        reject(new AppError('Failed to sign access token', 500))
      } else {
        resolve(token as string)
      }
    })
  })
}

// Signing refresh token and storing it in Redis
const signRefreshToken = async (id: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const payload: TokenPayload = { id }
    const secret: Secret = process.env.REFRESH_TOKEN_SECRET || 'default_refresh_secret'
    const expiresIn: string = process.env.REFRESH_TOKEN_EXPIRE || '30d'

    jwt.sign(
      payload,
      secret,
      { expiresIn, audience: id, issuer: process.env.JWT_ISSUER },
      async (err, token) => {
        if (err) {
          reject(new AppError('Failed to sign refresh token', 500))
        } else {
          try {
            const ttl = parseDurationToSeconds(expiresIn)
            if (!ttl || ttl <= 0) {
              reject(new AppError('Invalid expiration time', 500))
            }
            await client.setEx(id, ttl, token as string)
            resolve(token as string)
          } catch (redisErr) {
            reject(new AppError('Failed to store refresh token in Redis', 500))
          }
        }
      }
    )
  })
}

// Verifying refresh token
const verifyRefreshToken = (refreshToken: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as Secret, async (err, decoded) => {
      if (err) {
        reject(new AppError('Invalid refresh token', 401))
      } else {
        const { aud } = decoded as JwtPayload
        if (!aud) {
          reject(new AppError('Invalid refresh token payload', 401))
        }

        try {
          const storedToken = await client.get(aud as string)
          if (storedToken !== refreshToken) {
            reject(new AppError('Unauthorized', 401))
          }
          resolve(aud as string)
        } catch (error) {
          reject(new AppError('Error fetching token from Redis', 500))
        }
      }
    })
  })
}

// Extracting refresh token from Redis using access token
const extractRefreshToken = async (accessToken: string): Promise<string> => {
  try {
    const decoded = jwtDecode<TokenPayload>(accessToken)
    if (!decoded.id) {
      throw new Error('Invalid access token payload')
    }

    const refreshToken = await client.get(decoded.id)
    if (!refreshToken) {
      throw new AppError('No refresh token found', 500)
    }

    return refreshToken
  } catch (error) {
    throw new AppError('Invalid access token', 400)
  }
}

// Extracting token from request headers
const extractTokenFromHeaders = async (req: Request): Promise<string> => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  } else {
    throw new AppError('Authorization token not found', 401)
  }
}

// Verifying access token
const verifyToken = (token: string): Promise<TokenPayload> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as Secret, (err, decoded) => {
      if (err) {
        reject(new AppError('Invalid access token', 401))
      } else {
        resolve(decoded as TokenPayload)
      }
    })
  })
}

// Exporting functions with types applied
export {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  extractTokenFromHeaders,
  verifyToken,
  extractRefreshToken,
}
