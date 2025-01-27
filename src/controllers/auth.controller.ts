import { Request, Response, NextFunction } from 'express'

import { StatusCode } from '../enums/status-code'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import { loginUser, registerUser } from '../services/auth.service'
import AppError from '../utils/app-error'
import authResponseSender from '../utils/auth/auth-response-sender'

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
