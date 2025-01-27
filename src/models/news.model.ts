import mongoose, { Schema } from 'mongoose'

import { INews } from '../interfaces/news.interface'

const NewsSchema: Schema<INews> = new Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    images: [{ type: String, required: true }],
    readTime: { type: Number, required: false },
    views: { type: Number, default: 0 },
    socialLinks: { type: Map, of: String, required: false },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    telegramMessageId: [{ type: Number, default: null }],
    telegramChatId: { type: Number, default: null },
  },
  { timestamps: true }
)

export const NewsModel = mongoose.model<INews>('News', NewsSchema)
