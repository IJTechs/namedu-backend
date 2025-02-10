import { Request, Response, NextFunction } from 'express'

import { config } from '../config/environments.config'
import { StatusCode } from '../enums/status-code'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import { AdminModel } from '../models/admin.model'
import AppError from '../utils/app-error'
import {
  verifyToken,
  extractTokenFromCookies,
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
    const accessToken = await extractTokenFromCookies(req)

    if (!accessToken) {
      authLogger.warn(`Unauthorized access attempt: Missing access token - ${req.ip}`)
      return next(new AppError('Access token is missing.', StatusCode.Unauthorized))
    }

    try {
      const decoded = await verifyToken(accessToken)

      const admin = await AdminModel.findById(decoded.id)
      if (!admin) {
        authLogger.error(`Unauthorized access: Admin not found - ID: ${decoded.id}`)
        return next(new AppError('Admin not found.', StatusCode.Unauthorized))
      }

      if (decoded.iat && admin.isPasswordChanged(decoded.iat)) {
        authLogger.warn(`Admin changed password recently - ID: ${decoded.id}`)
        throw new AppError(
          'Admin recently changed password. Please log in again.',
          StatusCode.Unauthorized
        )
      }

      req.admin = admin
      authLogger.info(`Admin authenticated successfully - ID: ${decoded.id}`)
      return next()
    } catch (error: any) {
      if (error instanceof AppError && error.statusCode === StatusCode.Unauthorized) {
        authLogger.warn(`Token expired for admin IP: ${req.ip}`)

        try {
          const refreshToken = await extractRefreshToken(accessToken)
          const decodedAdminId = await verifyRefreshToken(refreshToken)
          const newAccessToken = await signAccessToken(decodedAdminId)

          res.cookie('ne_at', newAccessToken, {
            httpOnly: true,
            secure: config.NODE_ENV === 'production',
            sameSite: 'none',
            maxAge: 20 * 60 * 1000,
          })

          authLogger.info(`New access token issued for admin ID: ${decodedAdminId}`)

          const admin = await AdminModel.findById(decodedAdminId)
          if (!admin) {
            authLogger.error(
              `Failed to find admin after refresh token usage - ID: ${decodedAdminId}`
            )
            return next(new AppError('Admin not found.', StatusCode.Unauthorized))
          }

          req.admin = admin
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
 * Middleware to restrict access based on admin roles.
 */
export const access = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      authLogger.warn(`Unauthorized access attempt without authentication - IP: ${req.ip}`)
      return next(new AppError('Unauthorized access.', StatusCode.Forbidden))
    }

    if (!roles.includes(req.admin.role)) {
      authLogger.warn(
        `Unauthorized access attempt by admin ID: ${req.admin._id}, Role: ${req.admin.role}, Required: ${roles}`
      )
      return next(new AppError('You are not allowed to perform this action', StatusCode.Forbidden))
    }

    authLogger.info(`Access granted for admin ID: ${req.admin._id}, Role: ${req.admin.role}`)
    next()
  }
}
