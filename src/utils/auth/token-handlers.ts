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
    log.error(`Failed to sign access token for admin ${id}: ${(error as Error)?.message}`)
    throw new AppError(
      'An error occurred while generating your session. Please try again later.',
      500
    )
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
      log.error(`Invalid expiration time for refresh token for admin ${id}`)
      throw new AppError(
        'Session could not be established due to invalid configuration. Please contact support.',
        500
      )
    }

    await client.setEx(id, ttl, token)
    log.info(`Refresh token stored in Redis for admin ${id} with TTL: ${ttl}`)
    return token
  } catch (error) {
    log.error(`Failed to store refresh token for admin ${id}: ${(error as Error)?.message}`)
    throw new AppError('An error occurred while storing your session. Please try again later.', 500)
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
      throw new AppError('The session is invalid. Please log in again.', 401)
    }

    const storedToken = await client.get(decoded.aud as string)
    if (!storedToken) {
      log.warn(`Refresh token not found in Redis for admin: ${decoded.aud}`)
      throw new AppError('The session has expired. Please log in again.', 401)
    }

    if (storedToken !== refreshToken) {
      log.warn(`Unauthorized access attempt for admin: ${decoded.aud}`)
      throw new AppError('Invalid session token. Please log in again.', 401)
    }

    log.info(`Refresh token verified successfully for admin: ${decoded.aud}`)
    return decoded.aud as string
  } catch (error) {
    log.error(`Error verifying refresh token: ${(error as Error)?.message}`)
    throw new AppError('Invalid session token. Please log in again.', 401)
  }
}

/**
 * Extracting refresh token from Redis using access token
 */
export const extractRefreshToken = async (accessToken: string): Promise<string> => {
  try {
    const decoded = jwtDecode<TokenPayload>(accessToken)
    if (!decoded.id) {
      throw new AppError('The session has expired. Please log in again.', 401)
    }

    const refreshToken = await client.get(decoded.id)
    if (!refreshToken) {
      throw new AppError('The session has expired. Please log in again.', 401)
    }

    log.info(`Refresh token retrieved from Redis for admin: ${decoded.id}`)
    return refreshToken
  } catch (error) {
    log.error(`Error extracting refresh token: ${(error as Error)?.message}`)
    throw new AppError('An error occurred while validating your session. Please log in again.', 400)
  }
}

/**
 * Extracting token from request headers
 */
export const extractTokenFromCookies = (req: Request): string => {
  const access = req.cookies?.ne_at
  if (!access) {
    throw new AppError('Session token not found. Please log in again.', 401)
  }
  return access
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
    throw new AppError('Your session has expired or is invalid. Please log in again.', 401)
  }
}

/**
 * Revoke admin's refresh token (logout)
 */
export const revokeRefreshToken = async (id: string): Promise<void> => {
  try {
    await client.del(id)
    log.info(`Refresh token revoked for admin: ${id}`)
  } catch (error) {
    log.error(`Failed to revoke refresh token for admin ${id}: ${(error as Error)?.message}`)
    throw new AppError(
      'An error occurred while logging out. Please try again or contact support.',
      500
    )
  }
}

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  try {
    const adminId = await verifyRefreshToken(refreshToken)
    const newAccessToken = await signAccessToken(adminId)

    log.info(`New access token generated for admin: ${adminId}`)
    return newAccessToken
  } catch (error) {
    log.error(`Error refreshing access token: ${(error as Error)?.message}`)
    throw new AppError('Failed to refresh your session. Please log in again.', 401)
  }
}
