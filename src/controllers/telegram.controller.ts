import { Request, Response } from 'express'

import { StatusCode } from '../enums/status-code'
import { IUser } from '../interfaces/user.interface'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import {
  createTelegramService,
  getTelegramService,
  updateTelegramService,
  deleteTelegramService,
  findTelegramByIdService,
} from '../services/telegram.service'
import { updateUserService } from '../services/user.service'
import AppError from '../utils/app-error'

/**
 * Add a new Telegram bot
 */
export const createTelegramController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const linkedAdmin = req.body.linkedAdmin || req.user._id

    const { botToken, channelId, adminId } = req.body
    const data = { botToken, channelId, adminId, linkedAdmin }

    const telegram = await createTelegramService(data)

    await updateUserService(linkedAdmin, {
      telegram: telegram._id as IUser['telegram'],
    })

    res.status(StatusCode.Created).json({ message: 'Telegram bot added successfully', telegram })
  }
)

/**
 * Get Telegram bot by adminId
 */
export const getTelegramController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const telegram = await getTelegramService(req.params.adminId)

    if (!telegram) {
      throw new AppError('Telegram bot not found', StatusCode.NotFound)
    }

    res.status(StatusCode.OK).json(telegram)
  }
)

/**
 * Get Telegram bot by ID
 */
export const getTelegramByIdController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id

    const telegram_bot = await findTelegramByIdService(id)

    res.status(StatusCode.OK).json(telegram_bot)
  }
)

/**
 * Update Telegram bot details
 */
export const updateTelegramController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const linkedAdmin = req.body.linkedAdmin || req.user._id

    const { botToken, channelId, adminId } = req.body
    const data = { botToken, channelId, adminId, linkedAdmin }

    const updatedTelegram = await updateTelegramService(req.params.id, data)

    res.status(StatusCode.OK).json({ message: 'Telegram bot updated', updatedTelegram })
  }
)

/**
 * Delete Telegram bot
 */
export const deleteTelegramController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await deleteTelegramService(req.params.id)

    res.status(StatusCode.OK).json({ message: 'Telegram bot deleted successfully' })
  }
)
