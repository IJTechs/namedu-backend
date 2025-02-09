import mongoose from 'mongoose'

import { StatusCode } from '../enums/status-code'
import { ITelegram } from '../interfaces/telegram.interface'
import {
  createTelegram,
  findTelegramByAdmin,
  updateTelegram,
  deleteTelegram,
  findTelegramById,
  getAllTelegrams,
} from '../repositories/telegram.repository'
import AppError from '../utils/app-error'

/**
 * Get all Telegram bots.
 */
export async function getAllTelegramsService(
  userRole: 'SUPER_ADMIN' | 'ADMIN',
  userId: mongoose.Types.ObjectId
): Promise<ITelegram[] | ITelegram | null> {
  if (userRole === 'SUPER_ADMIN') {
    return await getAllTelegrams()
  }

  const adminTelegram = await findTelegramByAdmin(userId.toString())

  console.log(`🔹 Found Telegram bot(s) for Admin ID: ${userId}:`, adminTelegram)

  return adminTelegram || null
}

/**
 * Service to create a new Telegram bot entry for an admin.
 */
export const createTelegramService = async (data: Partial<ITelegram>): Promise<ITelegram> => {
  return await createTelegram(data)
}

/**
 * Get Telegram bot details for an admin.
 */
export const getTelegramByAdminIdService = async (adminId: string): Promise<ITelegram> => {
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
