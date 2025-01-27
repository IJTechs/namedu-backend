import { Request } from 'express'
import jwt, { JwtPayload, Secret } from 'jsonwebtoken'
import { jwtDecode } from 'jwt-decode'

import { config } from '../../config/environments.config'
import { client } from '../../config/redis.config'
import AppError from '../../utils/app-error'
import { parseDurationToSeconds } from '../../utils/duration-to-seconds'
import { logger } from '../../utils/logger'

const log = logger.get('auth')

interface TokenPayload extends JwtPayload {
  id: string
}

interface TokenOptions {
  expiresIn: string | undefined
  issuer?: string
  audience?: string
}

/**
 * Signing access token
 */
export const signAccessToken = async (id: string): Promise<string> => {
  try {
    const payload: TokenPayload = { id }
    const secret: Secret = config.ACCESS_TOKEN_SECRET!
    const options: TokenOptions = {
      expiresIn: config.ACCESS_TOKEN_EXPIRE,
      issuer: config.JWT_ISSUER,
      audience: id,
    }

    return jwt.sign(payload, secret, options)
  } catch (error) {
    log.error(`Failed to sign access token for user ${id}: ${(error as Error)?.message}`)
    throw new AppError('Failed to sign access token', 500)
  }
}

/**
 * Signing refresh token and storing it in Redis
 */
export const signRefreshToken = async (id: string): Promise<string> => {
  try {
    const payload: TokenPayload = { id }
    const secret: Secret = config.REFRESH_TOKEN_SECRET!
    const options: TokenOptions = {
      expiresIn: config.REFRESH_TOKEN_EXPIRE,
      issuer: config.JWT_ISSUER,
      audience: id,
    }

    const token = jwt.sign(payload, secret, options)
    const ttl = parseDurationToSeconds(options.expiresIn as string)

    if (!ttl || ttl <= 0) {
      log.error(`Invalid expiration time for refresh token for user ${id}`)
      throw new AppError('Invalid expiration time', 500)
    }

    await client.setEx(id, ttl, token)
    log.info(`Refresh token stored in Redis for user ${id} with TTL: ${ttl}`)
    return token
  } catch (error) {
    log.error(`Failed to store refresh token for user ${id}: ${(error as Error)?.message}`)
    throw new AppError('Failed to store refresh token in Redis', 500)
  }
}

/**
 * Verifying refresh token
 */
export const verifyRefreshToken = async (refreshToken: string): Promise<string> => {
  try {
    const decoded = jwt.verify(refreshToken, config.REFRESH_TOKEN_SECRET as Secret) as JwtPayload

    if (!decoded.aud) {
      log.warn('Invalid refresh token payload received.')
      throw new AppError('Invalid refresh token payload', 401)
    }

    const storedToken = await client.get(decoded.aud as string)
    if (!storedToken) {
      log.warn(`Refresh token not found in Redis for user: ${decoded.aud}`)
      throw new AppError('Refresh token not found', 401)
    }

    if (storedToken !== refreshToken) {
      log.warn(`Unauthorized access attempt for user: ${decoded.aud}`)
      throw new AppError('Unauthorized - Token mismatch', 401)
    }

    log.info(`Refresh token verified successfully for user: ${decoded.aud}`)
    return decoded.aud as string
  } catch (error) {
    log.error(`Error verifying refresh token: ${(error as Error)?.message}`)
    throw new AppError('Invalid refresh token', 401)
  }
}

/**
 * Extracting refresh token from Redis using access token
 */
export const extractRefreshToken = async (accessToken: string): Promise<string> => {
  try {
    const decoded = jwtDecode<TokenPayload>(accessToken)
    if (!decoded.id) {
      throw new AppError('Invalid access token payload', 400)
    }

    const refreshToken = await client.get(decoded.id)
    if (!refreshToken) {
      throw new AppError('No refresh token found', 401)
    }

    log.info(`Refresh token retrieved from Redis for user: ${decoded.id}`)
    return refreshToken
  } catch (error) {
    log.error(`Error extracting refresh token: ${(error as Error)?.message}`)
    throw new AppError('Invalid access token', 400)
  }
}

/**
 * Extracting token from request headers
 */
export const extractTokenFromHeaders = (req: Request): string => {
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1]
  }

  throw new AppError('Authorization token not found', 401)
}

/**
 * Verifying access token
 */
export const verifyToken = async (token: string): Promise<TokenPayload> => {
  try {
    const decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET as Secret) as TokenPayload
    return decoded
  } catch (error) {
    log.warn(`Token verification failed: ${(error as Error)?.message}`)
    throw new AppError('Invalid access token, token expired or invalid', 401)
  }
}

/**
 * Revoke user's refresh token (logout)
 */
export const revokeRefreshToken = async (id: string): Promise<void> => {
  try {
    await client.del(id)
    log.info(`Refresh token revoked for user: ${id}`)
  } catch (error) {
    log.error(`Failed to revoke refresh token for user ${id}: ${(error as Error)?.message}`)
    throw new AppError('Failed to revoke refresh token', 500)
  }
}

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  try {
    const userId = await verifyRefreshToken(refreshToken)
    const newAccessToken = await signAccessToken(userId)

    log.info(`New access token generated for user: ${userId}`)
    return newAccessToken
  } catch (error) {
    log.error(`Error refreshing access token: ${(error as Error)?.message}`)
    throw new AppError('Failed to refresh access token', 401)
  }
}
