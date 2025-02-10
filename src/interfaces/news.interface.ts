import mongoose, { Document } from 'mongoose'

import { IAdmin } from './admin.interface'
export interface INews extends Document {
  title: string
  content: string
  images: string[]
  readTime: number
  views: number
  socialLinks?: Record<string, string>
  author: mongoose.Types.ObjectId | IAdmin
  telegramMessageId: number[]
  telegramChatId: number | null
  previousContent?: string
  telegram: {
    message: string
    telegramStatus: 'SUCCESS' | 'FAILED'
  }
}

export interface ISentMessages {
  message_id: number
  chat: { id: number }
}
