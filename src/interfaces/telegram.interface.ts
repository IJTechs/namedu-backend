import mongoose, { Document } from 'mongoose'

export interface ITelegram extends Document {
  botToken: string
  channelId: string
  adminId: number
  linkedAdmin: mongoose.Types.ObjectId
}
