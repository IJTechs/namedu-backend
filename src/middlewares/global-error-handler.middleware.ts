import { Request, Response, NextFunction } from 'express'

import { config } from '../config/environments.config'
import AppError from '../utils/app-error'

// Define a structured interface for the error object
interface CustomError extends Error {
  statusCode?: number
  status?: string
  isOperational?: boolean
  errors?: Record<string, { message: string }>
  code?: number
  value?: string
  path?: string
}

// Handle MongoDB CastError (invalid ID)
const handleCastErrorDB = (err: CustomError) => {
  const message = `Invalid ${err.path}: ${err.value}.`
  return new AppError(message, 400)
}

// Handle duplicate field error in MongoDB
const handleDuplicateFieldsDB = () => {
  const message = 'Duplicate field value. Please use another value!'
  return new AppError(message, 400)
}

// Handle Mongoose validation errors
const handleValidationErrorDB = (err: CustomError) => {
  const errors = Object.values(err.errors || {}).map((el) => el.message)
  const message = `Invalid input data. ${errors.join('. ')}`
  return new AppError(message, 400)
}

// Handle JWT token errors
const handleJWTError = () => new AppError('Invalid token. Please log in again!', 401)
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401)

// Send error details in development mode
const sendErrorDev = (err: CustomError, req: Request, res: Response) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode || 500).json({
      status: err.status || 'error',
      error: err,
      message: err.message,
      stack: err.stack,
    })
  }

  console.error('ERROR 💥', err)
  return res.status(err.statusCode || 500).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  })
}

// Send error response in production mode
const sendErrorProd = (err: CustomError, req: Request, res: Response) => {
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode || 500).json({
        status: err.status || 'error',
        message: err.message,
      })
    }
    console.error('ERROR 💥', err)
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    })
  }

  if (err.isOperational) {
    return res.status(err.statusCode || 500).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    })
  }

  console.error('ERROR 💥', err)
  return res.status(500).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  })
}

// Global error handling middleware
const globalErrorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (config.NODE_ENV === 'development') {
    sendErrorDev(err, req, res)
  } else if (config.NODE_ENV === 'production') {
    let error = { ...err, message: err.message }

    if (err.name === 'CastError') {
      error = handleCastErrorDB(err)
    }
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB()
    }
    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(err)
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError()
    }
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError()
    }

    sendErrorProd(error, req, res)
  }
}

export default globalErrorHandler
