import mongoose, { Document } from 'mongoose'

export interface INews extends Document {
  title: string
  content: string
  images: string[]
  readTime: number
  views: number
  socialLinks?: Record<string, string>
  author: mongoose.Types.ObjectId
  telegramMessageId: number[]
  telegramChatId: number | null
  previousContent?: string
}

export interface ISentMessages {
  message_id: number
  chat: { id: number }
}
