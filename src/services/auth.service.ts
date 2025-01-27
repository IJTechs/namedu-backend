import { StatusCode } from '../enums/status-code'
import { IUser } from '../interfaces/user.interface'
import { findByUsername, createUser } from '../repositories/user.repository'
import AppError from '../utils/app-error'

/**
 * Handle user login.
 */
export const loginUser = async (username: string, password: string): Promise<{ user: IUser }> => {
  // Find user in the database
  const user = await findByUsername(username)

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid username or password', StatusCode.Unauthorized)
  }

  return { user }
}

/**
 * Handles user signup.
 */
export const registerUser = async (
  full_name: string,
  username: string,
  password: string
): Promise<{ user: IUser }> => {
  // Check if the user already exists
  const existingUser = await findByUsername(username)

  if (existingUser) {
    throw new AppError('User already exists', StatusCode.Conflict)
  }

  // Create a new user
  const newUser = await createUser({ username, password, full_name })

  return { user: newUser }
}
