import mongoose from 'mongoose'

import { config } from './environments.config'

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!config.MONGO_URI) {
      throw new Error('❌ MONGO_URI is not defined in the environment variables')
    }

    await mongoose.connect(config.MONGO_URI)

    console.log('🟢 MongoDB connected successfully')
  } catch (error) {
    console.error('🔴 MongoDB connection error:', error)
    process.exit(1)
  }
}
