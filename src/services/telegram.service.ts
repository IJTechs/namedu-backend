import { StatusCode } from '../enums/status-code'
import { ITelegram } from '../interfaces/telegram.interface'
import {
  createTelegram,
  findTelegramByAdmin,
  updateTelegram,
  deleteTelegram,
  findTelegramById,
} from '../repositories/telegram.repository'
import AppError from '../utils/app-error'

/**
 * Service to create a new Telegram bot entry for an admin.
 */
export const createTelegramService = async (data: Partial<ITelegram>): Promise<ITelegram> => {
  return await createTelegram(data)
}

/**
 * Get Telegram bot details for an admin.
 */
export const getTelegramService = async (adminId: string): Promise<ITelegram> => {
  const telegram = await findTelegramByAdmin(adminId)
  if (!telegram) {
    throw new AppError('Telegram bot not found', StatusCode.NotFound)
  }
  return telegram
}

/**
 * Find Telegram bot by ID.
 */
export const findTelegramByIdService = async (id: string): Promise<ITelegram> => {
  const telegram_bot = await findTelegramById(id)

  if (!telegram_bot) {
    throw new AppError('Telegram bot not found', StatusCode.NotFound)
  }
  return telegram_bot
}

/**
 * Update Telegram bot information.
 */
export const updateTelegramService = async (
  id: string,
  data: Partial<ITelegram>
): Promise<ITelegram> => {
  const updatedTelegram = await updateTelegram(id, data)
  if (!updatedTelegram) {
    throw new AppError('Telegram bot not found', StatusCode.NotFound)
  }
  return updatedTelegram
}

/**
 * Delete Telegram bot by ID.
 */
export const deleteTelegramService = async (id: string): Promise<ITelegram> => {
  const deletedTelegram = await deleteTelegram(id)

  if (!deletedTelegram) {
    throw new AppError('Telegram bot not found', StatusCode.NotFound)
  }

  return deletedTelegram
}
