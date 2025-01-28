import { Request, Response } from 'express'

import { config } from '../../config/environments.config'
import { IUser } from '../../interfaces/user.interface'
import { signAccessToken, signRefreshToken } from '../auth/token-handlers'
interface AuthResponseSender {
  (data: IUser, statusCode: number, req: Request, res: Response): Promise<Response>
}

const authResponseSender: AuthResponseSender = async (data, statusCode, req, res) => {
  try {
    if (!data?._id || !data?.username) {
      return res.status(400).json({ error: 'Invalid user data provided' })
    }

    const accessToken: string = await signAccessToken(data._id.toString())
    const refreshToken: string = await signRefreshToken(data._id.toString())

    const sanitizedData = data.toObject ? data.toObject() : data
    delete sanitizedData.password

    res.cookie('ne_at', accessToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 20 * 60 * 1000,
    })

    res.cookie('ne_rt', refreshToken, {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
    })

    return res.status(statusCode).json({
      status: 'success',
      user: sanitizedData,
    })
  } catch (error) {
    console.error('Error in authResponseSender:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default authResponseSender
