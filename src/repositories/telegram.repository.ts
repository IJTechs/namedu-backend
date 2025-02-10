import mongoose from 'mongoose'

import { IAdmin } from '../interfaces/admin.interface'
import { ITelegram } from '../interfaces/telegram.interface'
import { TelegramModel } from '../models/telegram.model'

/**
 * Get Telegram bots.
 */

export const getAllTelegrams = async (): Promise<ITelegram[]> => {
  return await TelegramModel.find().populate('linkedAdmin')
}

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
  admin: string | mongoose.Types.ObjectId | IAdmin
): Promise<ITelegram | null> => {
  try {
    let adminId: string

    if (typeof admin === 'string') {
      adminId = admin
    } else if (admin instanceof mongoose.Types.ObjectId) {
      adminId = admin.toString()
    } else if (admin && admin._id) {
      adminId = admin._id.toString()
    } else {
      throw new Error(`Invalid admin identifier: ${JSON.stringify(admin)}`)
    }

    const query = { linkedAdmin: new mongoose.Types.ObjectId(adminId) }
    const telegram = await TelegramModel.findOne(query).populate('linkedAdmin')

    if (!telegram) {
      console.error(`❌ No Telegram bot found for admin: ${adminId}`)
      return null
    }

    return telegram
  } catch (error) {
    console.error('❌ Error fetching Telegram bot:', error)
    return null
  }
}

/**
 * Find Telegram bot by ID.
 */
export const findTelegramById = async (id: string): Promise<ITelegram | null> => {
  return await TelegramModel.findById(id)
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
export const deleteTelegram = async (
  id: string | mongoose.Types.ObjectId
): Promise<ITelegram | null> => {
  return await TelegramModel.findByIdAndDelete(id)
}
