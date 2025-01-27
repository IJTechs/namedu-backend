import { IUser } from '../interfaces/user.interface'
import { UserModel } from '../models/user.model'

/**
 * Create a new user
 */
export async function createUser(data: Partial<IUser>): Promise<IUser> {
  return UserModel.create(data)
}

/**
 * Find a user by their username
 */
export async function findByUsername(username: string): Promise<IUser | null> {
  return UserModel.findOne({ username })
}

/**
 * Find a user by their ID
 */
export async function findUserById(userId: string): Promise<IUser | null> {
  return UserModel.findById(userId)
}

/**
 * Retrieve all users
 */
export async function findAllUsers(): Promise<IUser[]> {
  return UserModel.find()
}

/**
 * Update a user by their ID
 */
export async function updateUser(userId: string, data: Partial<IUser>): Promise<IUser | null> {
  return UserModel.findByIdAndUpdate(userId, data, { new: true })
}

/**
 * Delete a user by their ID
 */
export async function deleteUser(userId: string): Promise<IUser | null> {
  return UserModel.findByIdAndDelete(userId)
}

/**
 * Check if a user exists by their username
 */
export async function userExists(username: string): Promise<boolean> {
  const result = await UserModel.exists({ username })
  return result !== null
}
