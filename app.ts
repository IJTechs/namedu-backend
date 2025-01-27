import path from 'path'

import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from './src/config/environments.config'
import globalErrorHandler from './src/middlewares/global-error-handler.middleware'
import router from './src/routes/index.routes'
import { disableConsole } from './src/utils/disable-consoles'
import requestLimiter from './src/utils/request-limitter'
import initializeTelegramBots from './src/utils/telegram/telegram-bot-initializer'
// Initialize express app
export const app = express()

// Body parsers
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(bodyParser.raw({ type: 'application/x-www-form-urlencoded' }))

// Serve static files
app.use(express.static(path.join(__dirname, '../public')))

// Logging in development mode
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Initialize Telegram bots
initializeTelegramBots()

// Disable console logs in production mode
disableConsole()

// Apply security middleware
app.use(cors())
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
