import bcrypt from 'bcrypt'
import mongoose from 'mongoose'

import { IAdmin } from '../interfaces/admin.interface'
import {
  createAdmin,
  findAdminById,
  findAllAdmins,
  updateAdmin,
  adminExists,
  deleteAdmin,
} from '../repositories/admin.repository'
import { deleteTelegram } from '../repositories/telegram.repository'

/**
 * Create a new admin with role-based checks:
 *  - If a non-super-ADMIN attempts to create a super ADMIN, throw error
 *  - If username already exists, throw error
 */
export async function createAdminService(
  data: Partial<IAdmin>,
  creatorRole: 'SUPER_ADMIN' | 'ADMIN'
): Promise<IAdmin> {
  const { username, role } = data

  // Ensure unique username
  if (username && (await adminExists(username))) {
    throw new Error('Username already exists')
  }

  // Assign default role of 'ADMIN' if not provided or restricted
  if (!data.role || (data.role === 'SUPER_ADMIN' && creatorRole !== 'SUPER_ADMIN')) {
    data.role = 'ADMIN'
  }

  // Create admin in the database
  const admin = await createAdmin(data)
  return admin
}

/**
 * Get a admin by ID.
 */
export async function getAdminByIdService(adminId: string): Promise<IAdmin | null> {
  return findAdminById(adminId)
}

/**
 * Get all users (for super admins or advanced queries).
 */
export async function getAllAdminsService(
  userRole: 'SUPER_ADMIN' | 'ADMIN',
  userId: mongoose.Types.ObjectId
): Promise<IAdmin[]> {
  if (userRole === 'SUPER_ADMIN') {
    return await findAllAdmins()
  }
  const admin = await findAdminById(userId.toString())
  return admin ? [admin] : []
}

/**
 * Update a admin by ID.
 * - Typical for admin profile updates.
 */
export async function updateAdminService(
  adminId: string,
  data: Partial<IAdmin>
): Promise<IAdmin | null> {
  return updateAdmin(adminId, data)
}

/**
 * Delete a admin by ID.
 * - Typical for super ADMIN powers or admin self-delete.
 */
export async function deleteAdminService(adminId: string): Promise<IAdmin | null> {
  const admin = await findAdminById(adminId)

  if (!admin) {
    return null
  }

  if (admin.telegram) {
    await deleteTelegram(admin.telegram)
    console.log(`🟢 Deleted Telegram bot for admin ${adminId}`)
  }

  const deletedAdmin = await deleteAdmin(adminId)
  return deletedAdmin
}

/**
 * Change admin password (authenticated admin flow).
 */
export async function changePasswordService(
  adminId: string,
  old_password: string,
  new_password: string
): Promise<IAdmin> {
  if (!old_password || !new_password) {
    throw new Error('Both old and new passwords are required')
  }

  const admin = await findAdminById(adminId)
  if (!admin) {
    throw new Error('Admin not found')
  }

  // Ensure stored password exists
  if (!admin.password) {
    throw new Error('Stored password not found for admin')
  }

  // Compare old password
  const isMatch = await bcrypt.compare(old_password, admin.password)
  if (!isMatch) {
    throw new Error('Old password is incorrect')
  }

  admin.password = new_password

  await admin.save()

  return admin
}

/**
 * Lock a admin account (e.g., if suspicious activity or ADMIN decides).
 */
export async function controlleAdminAccountService(adminId: string): Promise<IAdmin> {
  const admin = await findAdminById(adminId)

  if (!admin) {
    throw new Error('Admin not found')
  }

  admin.isActive = !admin.isActive

  await admin.save()

  return admin
}

/**
 * Update admin role (e.g., ADMIN <-> SUPER_ADMIN).
 * Only a SUPER_ADMIN can promote/demote roles.
 */
export async function updateAdminRoleService(
  targetAdminId: string,
  newRole: 'SUPER_ADMIN' | 'ADMIN',
  requesterRole: 'SUPER_ADMIN' | 'ADMIN'
): Promise<IAdmin> {
  if (requesterRole !== 'SUPER_ADMIN') {
    throw new Error('Only SUPER_ADMIN can update admin roles')
  }

  const admin = await findAdminById(targetAdminId)

  if (!admin) {
    throw new Error('Admin not found')
  }

  admin.role = newRole

  await admin.save()

  return admin
}
