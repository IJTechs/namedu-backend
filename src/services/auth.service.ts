import { StatusCode } from '../enums/status-code'
import { IAdmin } from '../interfaces/admin.interface'
import { findByUsername, createAdmin } from '../repositories/admin.repository'
import AppError from '../utils/app-error'

/**
 * Handle admin login.
 */
export const loginAdmin = async (username: string, password: string): Promise<IAdmin> => {
  const admin = await findByUsername(username)

  if (!admin || !(await admin.comparePassword(password))) {
    throw new AppError('Invalid username or password', StatusCode.Unauthorized)
  }

  return admin
}

/**
 * Handles admin signup.
 */
export const registerAdmin = async (
  full_name: string,
  username: string,
  password: string
): Promise<IAdmin> => {
  const existingUser = await findByUsername(username)

  if (existingUser) {
    throw new AppError('Admin already exists', StatusCode.Conflict)
  }

  const admin = await createAdmin({ username, password, full_name })

  return admin
}
