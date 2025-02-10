import { Request, Response } from 'express'

import { StatusCode } from '../enums/status-code'
import { IAdmin } from '../interfaces/admin.interface'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import { updateAdminService } from '../services/admin.service'
import {
  createTelegramService,
  getTelegramByAdminIdService,
  updateTelegramService,
  deleteTelegramService,
  findTelegramByIdService,
  getAllTelegramsService,
} from '../services/telegram.service'
import AppError from '../utils/app-error'

/**
 * Get all Telegram bots
 */
export const getAllTelegramsController = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.admin!.role as 'SUPER_ADMIN' | 'ADMIN'
  const userId = req.admin?._id as IAdmin['_id']

  const telegrams = await getAllTelegramsService(userRole, userId)

  if (!telegrams || (Array.isArray(telegrams) && telegrams.length === 0)) {
    res.status(StatusCode.NotFound).json({
      message: 'Sizga bog‘langan Telegram bot topilmadi.',
      telegram_bots: [],
    })
    return
  }

  res.status(StatusCode.OK).json({
    count: Array.isArray(telegrams) ? telegrams.length : 1,
    telegram_bots: Array.isArray(telegrams) ? telegrams : [telegrams],
  })
})

/**
 * Add a new Telegram bot
 */
export const createTelegramController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const linkedAdmin = req.body.linkedAdmin || req.admin?._id

    const { botToken, channelId, adminId } = req.body
    const data = { botToken, channelId, adminId, linkedAdmin }

    const telegram = await createTelegramService(data)

    await updateAdminService(linkedAdmin, {
      telegram: telegram._id as IAdmin['telegram'],
    })

    res
      .status(StatusCode.Created)
      .json({ status: 'success', message: 'Telegram bot added successfully', telegram })
  }
)

/**
 * Get Telegram bot by adminId
 */
export const getTelegramByLinkedAdminController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const telegram = await getTelegramByAdminIdService(req.params.adminId)

    if (!telegram) {
      throw new AppError('Telegram bot not found', StatusCode.NotFound)
    }

    res.status(StatusCode.OK).json({
      status: 'success',
      telegram,
    })
  }
)

/**
 * Get Telegram bot by ID
 */
export const getTelegramByIdController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const id = req.params.id

    const telegram_bot = await findTelegramByIdService(id)

    res.status(StatusCode.OK).json({
      status: 'success',
      telegram_bot,
    })
  }
)

/**
 * Update Telegram bot details
 */
export const updateTelegramController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const linkedAdmin = req.body.linkedAdmin || req.admin?._id

    const { botToken, channelId, adminId } = req.body
    const data = { botToken, channelId, adminId, linkedAdmin }

    const updatedTelegram = await updateTelegramService(req.params.id, data)

    res
      .status(StatusCode.OK)
      .json({ status: 'success', message: 'Telegram bot updated successfully', updatedTelegram })
  }
)

/**
 * Delete Telegram bot
 */
export const deleteTelegramController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await deleteTelegramService(req.params.id)

    res
      .status(StatusCode.OK)
      .json({ status: 'success', message: 'Telegram bot deleted successfully' })
  }
)
