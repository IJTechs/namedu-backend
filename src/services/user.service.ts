import bcrypt from 'bcrypt'

import { IUser } from '../interfaces/user.interface'
import {
  createUser,
  findByUsername,
  findUserById,
  findAllUsers,
  updateUser,
  deleteUser,
  userExists,
} from '../repositories/user.repository'

/**
 * Create a new user with role-based checks:
 *  - If a non-super-ADMIN attempts to create a super ADMIN, throw error
 *  - If username already exists, throw error
 */
export async function createUserService(
  data: Partial<IUser>,
  creatorRole: 'SUPER_ADMIN' | 'ADMIN'
): Promise<IUser> {
  const { username, role } = data

  // Ensure unique username
  if (username && (await userExists(username))) {
    throw new Error('Username already exists')
  }

  // Assign default role of 'ADMIN' if not provided or restricted
  if (!data.role || (data.role === 'SUPER_ADMIN' && creatorRole !== 'SUPER_ADMIN')) {
    data.role = 'ADMIN'
  }

  // Create user in the database
  const user = await createUser(data)
  return user
}

/**
 * Get a user by username.
 */
export async function getUserByUsernameService(username: string): Promise<IUser | null> {
  return findByUsername(username)
}

/**
 * Get a user by ID.
 */
export async function getUserByIdService(userId: string): Promise<IUser | null> {
  return findUserById(userId)
}

/**
 * Get all users (for super admins or advanced queries).
 */
export async function getAllUsersService(): Promise<IUser[]> {
  return findAllUsers()
}

/**
 * Update a user by ID.
 * - Typical for user profile updates.
 */
export async function updateUserService(
  userId: string,
  data: Partial<IUser>
): Promise<IUser | null> {
  return updateUser(userId, data)
}

/**
 * Delete a user by ID.
 * - Typical for super ADMIN powers or user self-delete.
 */
export async function deleteUserService(userId: string): Promise<IUser | null> {
  return deleteUser(userId)
}

/**
 * Change user password (authenticated user flow).
 */
export async function changePasswordService(
  userId: string,
  old_password: string,
  new_password: string
): Promise<IUser> {
  if (!old_password || !new_password) {
    throw new Error('Both old and new passwords are required')
  }

  const user = await findUserById(userId)
  if (!user) {
    throw new Error('User not found')
  }

  // Ensure stored password exists
  if (!user.password) {
    throw new Error('Stored password not found for user')
  }

  // Compare old password
  const isMatch = await bcrypt.compare(old_password, user.password)
  if (!isMatch) {
    throw new Error('Old password is incorrect')
  }

  user.password = new_password
  await user.save()

  return user
}

/**
 * Lock a user account (e.g., if suspicious activity or ADMIN decides).
 */
export async function controlleUserAccountService(userId: string): Promise<IUser> {
  const user = await findUserById(userId)
  if (!user) {
    throw new Error('User not found')
  }
  user.isActive = !user.isActive
  await user.save()
  return user
}

/**
 * Update user role (e.g., ADMIN <-> SUPER_ADMIN).
 * Only a SUPER_ADMIN can promote/demote roles.
 */
export async function updateUserRoleService(
  targetUserId: string,
  newRole: 'SUPER_ADMIN' | 'ADMIN',
  requesterRole: 'SUPER_ADMIN' | 'ADMIN'
): Promise<IUser> {
  if (requesterRole !== 'SUPER_ADMIN') {
    throw new Error('Only SUPER_ADMIN can update user roles')
  }

  const user = await findUserById(targetUserId)
  if (!user) {
    throw new Error('User not found')
  }

  user.role = newRole
  await user.save()
  return user
}
