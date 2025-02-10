import mongoose, { Document } from 'mongoose'

import { IAdmin } from './admin.interface'
export interface ITelegram extends Document {
  botToken: string
  channelId: string
  adminId: number
  linkedAdmin: mongoose.Types.ObjectId | IAdmin
}
