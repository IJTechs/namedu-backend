import { Request, Response, NextFunction } from 'express'

import { StatusCode } from '../enums/status-code'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import { UserModel } from '../models/user.model'
import AppError from '../utils/app-error'
import {
  verifyToken,
  extractTokenFromHeaders,
  signAccessToken,
  verifyRefreshToken,
  extractRefreshToken,
} from '../utils/auth/token-handlers'
import { logger } from '../utils/logger'

/**
 * Logger instance for authentication middleware.
 */
const authLogger = logger.get('auth')

/**
 * Middleware to protect routes by verifying access token.
 */
export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const accessToken = await extractTokenFromHeaders(req)

    if (!accessToken) {
      authLogger.warn(`Unauthorized access attempt: Missing access token - ${req.ip}`)
      return next(new AppError('Access token is missing.', StatusCode.Unauthorized))
    }

    try {
      const decoded = await verifyToken(accessToken)

      const user = await UserModel.findById(decoded.id)
      if (!user) {
        authLogger.error(`Unauthorized access: User not found - ID: ${decoded.id}`)
        return next(new AppError('User not found.', StatusCode.Unauthorized))
      }

      if (decoded.iat && user.isPasswordChanged(decoded.iat)) {
        authLogger.warn(`User changed password recently - ID: ${decoded.id}`)
        throw new AppError(
          'User recently changed password. Please log in again.',
          StatusCode.Unauthorized
        )
      }

      req.user = user
      authLogger.info(`User authenticated successfully - ID: ${decoded.id}`)
      return next()
    } catch (error: any) {
      console.log("Error in 'protect", error)

      if (error instanceof AppError && error.statusCode === StatusCode.Unauthorized) {
        authLogger.warn(`Token expired for user IP: ${req.ip}`)

        try {
          const refreshToken = await extractRefreshToken(accessToken)
          const decodedUserId = await verifyRefreshToken(refreshToken)
          const newAccessToken = await signAccessToken(decodedUserId)

          res.setHeader('Authorization', `Bearer ${newAccessToken}`)
          authLogger.info(`New access token issued for user ID: ${decodedUserId}`)

          const user = await UserModel.findById(decodedUserId)
          if (!user) {
            authLogger.error(`Failed to find user after refresh token usage - ID: ${decodedUserId}`)
            return next(new AppError('User not found.', StatusCode.Unauthorized))
          }

          req.user = user
          return next()
        } catch (error) {
          authLogger.error(`Refresh token validation failed for IP: ${req.ip}`)
          res.status(StatusCode.Unauthorized).json({
            status: 'fail',
            message: 'Session expired. Please log in again.',
          })
        }
      } else {
        authLogger.error(`Authentication error for IP: ${req.ip}, Reason: ${error.message}`)
        return next(
          new AppError('Authentication error. Please try again later.', StatusCode.Unauthorized)
        )
      }
    }
  }
)

/**
 * Middleware to restrict access based on user roles.
 */
export const access = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      authLogger.warn(`Unauthorized access attempt without authentication - IP: ${req.ip}`)
      return next(new AppError('Unauthorized access.', StatusCode.Unauthorized))
    }

    if (!roles.includes(req.user.role)) {
      authLogger.warn(
        `Unauthorized access attempt by user ID: ${req.user._id}, Role: ${req.user.role}, Required: ${roles}`
      )
      return next(new AppError('You are not allowed to perform this action', StatusCode.Forbidden))
    }

    authLogger.info(`Access granted for user ID: ${req.user._id}, Role: ${req.user.role}`)
    next()
  }
}
