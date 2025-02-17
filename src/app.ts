import path from 'path'

import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from './config/environments.config'
import globalErrorHandler from './middlewares/global-error-handler.middleware'
import router from './routes/index.routes'
import { disableConsole } from './utils/disable-consoles'
import requestLimiter from './utils/request-limitter'
import initializeTelegramBots from './utils/telegram/telegram-bot-initializer'

// Initialize express app
export const app = express()

// Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.raw({ type: 'application/x-www-form-urlencoded' }))

// Serve static files
app.use(express.static(path.join(__dirname, '../public')))

if (config.NODE_ENV === 'development') {
  // Logging in development mode
  app.use(morgan('dev'))
  // Disable console logs in production mode
  disableConsole()
}

// Initialize Telegram bots
initializeTelegramBots()

// Apply security middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://namedu.uz',
      'https://www.namedu.uz',
      'https://admin.namedu.uz',
      'https://api.namedu.uz',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  })
)
app.use(helmet())
app.use(mongoSanitize())
app.use(cookieParser())
app.use(requestLimiter)

// Define routes
app.use('/api/v1', router)

app.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'))
})

// Error handling middleware
app.use(globalErrorHandler)

app.all('*', (req, res, next) => {
  next(new Error(`Can't find ${req.originalUrl} on this server!`))
})
