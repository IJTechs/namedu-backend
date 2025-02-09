import mongoose, { Schema } from 'mongoose'

import { ITelegram } from '../interfaces/telegram.interface'

const TelegramSchema = new Schema<ITelegram>(
  {
    botToken: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    adminId: { type: Number, required: true },
    linkedAdmin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  },
  { timestamps: true }
)

export const TelegramModel = mongoose.model<ITelegram>('Telegram', TelegramSchema)
