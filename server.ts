import process from 'process'

import { app } from './app'
import { connectDatabase } from './src/config/db.config'
import { config } from './src/config/environments.config'
import { connectRedis } from './src/config/redis.config'

// Import necessary Node.js modules

const PORT = config.PORT || 5000

// Function to start the server
const startServer = async () => {
  try {
    await connectDatabase() // Connect to the database
    await connectRedis() // Connect to Redis

    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`)
    })

    // Graceful shutdown handlers
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

    // Handle graceful shutdown on system signals
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

// Start the server
startServer()
