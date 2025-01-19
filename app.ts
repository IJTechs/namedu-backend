import path from 'path'

import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import mongoSanitize from 'express-mongo-sanitize'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from './src/config/environments.config'
// import indexRoutes from './src/routes/index.routes';
import globalErrorHandler from './src/middlewares/global-error-handler.middleware'
import { logger } from './src/utils/logger'

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

// Apply security middleware
app.use(cors())
app.use(helmet())
app.use(mongoSanitize())
app.use(cookieParser())

// Custom request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`)
  next()
})

// Define routes
// app.use('/api/v1', indexRoutes);

app.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'))
})

// Error handling middleware
app.use(globalErrorHandler)

app.all('*', (req, res, next) => {
  next(new Error(`Can't find ${req.originalUrl} on this server!`))
})
