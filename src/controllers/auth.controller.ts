import { Request, Response, NextFunction } from 'express'

import { config } from '../config/environments.config'
import { StatusCode } from '../enums/status-code'
import { IAdmin } from '../interfaces/admin.interface'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import { loginAdmin, registerAdmin } from '../services/auth.service'
import AppError from '../utils/app-error'
import authResponseSender from '../utils/auth/auth-response-sender'
import { revokeRefreshToken, verifyRefreshToken } from '../utils/auth/token-handlers'
import { logger } from '../utils/logger'

const log = logger.get('auth')

/**
 * Admin login controller.
 */
export const loginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body

    if (!username || !password) {
      return next(new AppError('Username and password are required', StatusCode.BadRequest))
    }

    try {
      const admin = await loginAdmin(username, password)

      if (!admin.isActive) {
        return next(
          new AppError('Your account is locked please contact support', StatusCode.Locked)
        )
      }

      await authResponseSender(admin, StatusCode.OK, req, res)
    } catch (error) {
      res.status(StatusCode.BadRequest).json({ message: 'Invalid username or password' })
      return
    }
  }
)

/**
 * Admin signup controller.
 */
export const signupController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password, confirm_password, full_name } = req.body

    if (password !== confirm_password) {
      return next(new AppError('Passwords do not match', StatusCode.BadRequest))
    }

    if (!username || !password || !confirm_password || !full_name) {
      return next(new AppError('All fields are required', StatusCode.BadRequest))
    }

    const admin = await registerAdmin(full_name, username, password)

    await authResponseSender(admin, StatusCode.Created, req, res)
  }
)

/**
 * Admin logout controller.
 */
export const logoutController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.ne_rt

      if (!refreshToken) {
        log.warn('No refresh token found. Already logged out.')
        res.status(StatusCode.OK).json({
          status: 'success',
          message: 'Already logged out.',
        })
        return
      }

      const adminId = await verifyRefreshToken(refreshToken).catch(() => null)

      res.clearCookie('ne_at', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'none',
      })
      res.clearCookie('ne_rt', {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'none',
      })

      if (adminId) {
        await revokeRefreshToken(adminId)
        log.info(`Admin logged out successfully: ${adminId}`)
        res.status(StatusCode.OK).json({ status: 'success', message: 'Logged out successfully' })
        return
      }

      res.status(StatusCode.OK).json({ status: 'success', message: 'Logged out successfully' })
      return
    } catch (error) {
      log.error(`Error during logout: ${(error as Error)?.message}`)
      return next(
        new AppError('Logout failed. Please try again later.', StatusCode.InternalServerError)
      )
    }
  }
)

/**
 * Admin profile controller.
 */
export const getMeController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const admin = req.admin as IAdmin

  if (!admin) {
    res.status(StatusCode.NotFound).json({ message: 'Admin not found' })
    return
  }

  const sanitizedUser = admin.toObject ? admin.toObject() : admin
  delete sanitizedUser.password

  res.status(StatusCode.OK).json({
    status: 'success',
    admin: sanitizedUser,
  })
})
