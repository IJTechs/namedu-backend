import bcrypt from 'bcrypt'
import mongoose, { Schema } from 'mongoose'

import { IAdmin } from '../interfaces/admin.interface'

const AdminSchema = new Schema<IAdmin>(
  {
    full_name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['SUPER_ADMIN', 'ADMIN'],
      default: 'ADMIN',
    },
    isActive: { type: Boolean, default: true },
    passwordChangedAt: { type: Date },
    telegram: { type: mongoose.Schema.Types.ObjectId, ref: 'Telegram' },
  },
  { timestamps: true }
)

// Hash password
AdminSchema.pre<IAdmin>('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Pre-save hook to update the passwordChangedAt field when password is modified
AdminSchema.pre<IAdmin>('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next()

  this.passwordChangedAt = new Date(Date.now() - 1000)
  next()
})

// Compare password
AdminSchema.methods.comparePassword = function (password: string) {
  return bcrypt.compare(password, this.password)
}

// Method to check if the password has been changed after issuing the token
AdminSchema.methods.isPasswordChanged = function (JWTTimeStamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000)
    return JWTTimeStamp < changedTimestamp
  }
  return false
}

export const AdminModel = mongoose.model<IAdmin>('Admin', AdminSchema)
