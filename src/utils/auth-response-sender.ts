import { Request, Response } from 'express'

import { signAccessToken, signRefreshToken } from '../utils/token-handlers'

interface UserData {
  _id: string
  username: string
  password?: string
  [key: string]: any // Allows other properties to be included
}

interface AuthResponseSender {
  (data: UserData, statusCode: number, req: Request, res: Response): Promise<Response>
}

const authResponseSender: AuthResponseSender = async (data, statusCode, req, res) => {
  try {
    // Check if data object contains required fields
    if (!data?._id || !data?.username) {
      return res.status(400).json({ error: 'Invalid user data provided' })
    }

    // Sign access token
    const accessToken: string = await signAccessToken(data._id)

    // Sign refresh token
    const refreshToken: string = await signRefreshToken(data._id)

    // Remove sensitive fields from the response object
    const sanitizedData = { ...data, password: undefined }

    // Send response with tokens
    return res.status(statusCode).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: sanitizedData,
    })
  } catch (error) {
    console.error('Error in authResponseSender:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default authResponseSender
