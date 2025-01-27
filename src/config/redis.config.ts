import { createClient, RedisClientType } from 'redis'

import { config } from './environments.config'

// Define interface for environment variables
interface RedisConfig {
  host: string
  port: number
}

// Create Redis client with proper type annotations
const redisConfig: RedisConfig = {
  host: config.REDIS_HOST || 'localhost',
  port: parseInt(config.REDIS_PORT || '6379', 10),
}

// Initialize Redis client
const client: RedisClientType = createClient({
  socket: {
    host: redisConfig.host,
    port: redisConfig.port,
  },
})

// Event listeners for Redis client
client.on('connect', () => {
  console.log('Connected to Redis')
})

client.on('error', (err: Error) => {
  console.error('Redis Error:', err.message)
})

client.on('ready', () => {
  console.log('Redis is ready')
})

client.on('end', () => {
  console.log('Redis connection ended')
})

// Handle process termination
process.on('SIGINT', async () => {
  await client.quit()
  console.log('Redis client disconnected on app termination')
  process.exit(0)
})

// Connect to Redis
const connectRedis = async () => {
  try {
    await client.connect()
    console.log('Successfully connected to Redis')
  } catch (error) {
    console.error('Failed to connect to Redis:', (error as Error).message)
  }
}

export { client, connectRedis }
