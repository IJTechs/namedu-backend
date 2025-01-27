import mongoose from 'mongoose'

import { ITelegram } from '../interfaces/telegram.interface'
import { TelegramModel } from '../models/telegram.model'

/**
 * Create a new Telegram bot record.
 */
export const createTelegram = async (data: Partial<ITelegram>): Promise<ITelegram> => {
  if (data.linkedAdmin && typeof data.linkedAdmin === 'string') {
    data.linkedAdmin = new mongoose.Types.ObjectId(String(data.linkedAdmin))
  }
  return await TelegramModel.create(data)
}

/**
 * Find a Telegram bot by admin ID.
 */
export const findTelegramByAdmin = async (
  linkedAdmin: string | number
): Promise<ITelegram | null> => {
  try {
    const query =
      typeof linkedAdmin === 'string' && mongoose.isValidObjectId(linkedAdmin)
        ? { linkedAdmin: new mongoose.Types.ObjectId(linkedAdmin) }
        : { adminId: Number(linkedAdmin) }

    return await TelegramModel.findOne(query).populate('linkedAdmin')
  } catch (error) {
    console.error('Invalid admin ID format:', linkedAdmin)
    throw new Error('Invalid admin ID format.')
  }
}

/**
 * Update Telegram bot details.
 */
export const updateTelegram = async (
  id: string,
  data: Partial<ITelegram>
): Promise<ITelegram | null> => {
  return await TelegramModel.findByIdAndUpdate(id, data, { new: true, runValidators: true })
}

/**
 * Delete Telegram bot.
 */
export const deleteTelegram = async (id: string): Promise<ITelegram | null> => {
  return await TelegramModel.findByIdAndDelete(id)
}
