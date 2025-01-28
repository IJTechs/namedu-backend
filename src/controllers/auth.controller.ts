import { Request, Response, NextFunction } from 'express'

import { config } from '../config/environments.config'
import { StatusCode } from '../enums/status-code'
import { IUser } from '../interfaces/user.interface'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import { loginUser, registerUser } from '../services/auth.service'
import AppError from '../utils/app-error'
import authResponseSender from '../utils/auth/auth-response-sender'
import { revokeRefreshToken, verifyRefreshToken } from '../utils/auth/token-handlers'
import { logger } from '../utils/logger'

const log = logger.get('auth')

/**
 * User login controller.
 */
export const loginController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body

    if (!username || !password) {
      return next(new AppError('Username and password are required', StatusCode.BadRequest))
    }
    const { user } = await loginUser(username, password)

    await authResponseSender(user, StatusCode.OK, req, res)
  }
)

/**
 * User signup controller.
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

    const { user } = await registerUser(full_name, username, password)

    await authResponseSender(user, StatusCode.Created, req, res)
  }
)

/**
 * User logout controller.
 */
export const logoutController = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.ne_rt

      if (!refreshToken) {
        log.warn('No refresh token found in cookies during logout')
        res.status(StatusCode.Unauthorized).json({
          status: 'fail',
          message: 'No refresh token found. User not logged in.',
        })
        return
      }

      const userId = await verifyRefreshToken(refreshToken)

      await revokeRefreshToken(userId)

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

      log.info(`User logged out successfully: ${userId}`)
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
 * User profile controller.
 */
export const getMeController = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = req.user as IUser

  if (!user) {
    res.status(StatusCode.NotFound).json({ message: 'User not found' })
    return
  }

  const sanitizedUser = user.toObject ? user.toObject() : user
  delete sanitizedUser.password

  res.status(StatusCode.OK).json({
    status: 'success',
    user: sanitizedUser,
  })
})
