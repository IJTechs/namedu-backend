import 'module-alias/register'
import process from 'process'

import { app } from './app'
import { connectDatabase } from './src/config/db.config'
import { config } from './src/config/environments.config'
import { connectRedis } from './src/config/redis.config'

const PORT = config.PORT || 5000

// Function to start the server
const startServer = async () => {
  try {
    await connectDatabase()
    await connectRedis()

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
    })

    process.on('unhandledRejection', (err: any) => {
      console.error('Unhandled Rejection! Shutting down...')
      console.error(err)
      server.close(() => process.exit(1))
    })

    process.on('uncaughtException', (err: any) => {
      console.error('Uncaught Exception! Shutting down...')
      console.error(err)
      process.exit(1)
    })

    const shutdownHandler = () => {
      console.log('Gracefully shutting down...')
      server.close(() => {
        console.log('Server closed')
        process.exit(0)
      })
    }

    process.on('SIGTERM', shutdownHandler)
    process.on('SIGINT', shutdownHandler)
  } catch (error) {
    console.error('Error while starting the server:', (error as Error).message)
    process.exit(1)
  }
}

startServer()
