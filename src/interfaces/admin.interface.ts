import mongoose, { Document } from 'mongoose'

export interface IAdmin extends Document {
  _id: mongoose.Types.ObjectId
  full_name: string
  username: string
  password: string
  role: 'SUPER_ADMIN' | 'ADMIN'
  telegram?: mongoose.Types.ObjectId | null
  isActive?: boolean
  passwordChangedAt?: Date

  isPasswordChanged(JWTTimeStamp: number): boolean
  comparePassword(password: string): Promise<boolean>
}
