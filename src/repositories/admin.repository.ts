import { IAdmin } from '../interfaces/admin.interface'
import { AdminModel } from '../models/admin.model'

/**
 * Create  new admin
 */
export async function createAdmin(data: Partial<IAdmin>): Promise<IAdmin> {
  return AdminModel.create(data)
}

/**
 * Find admin by their username
 */
export async function findByUsername(username: string): Promise<IAdmin | null> {
  return AdminModel.findOne({ username })
}

/**
 * Find  admin by their ID
 */
export async function findAdminById(adminId: string): Promise<IAdmin | null> {
  return AdminModel.findById(adminId).populate('telegram')
}

/**
 * Retrieve all admins
 */
export async function findAllAdmins(): Promise<IAdmin[]> {
  return AdminModel.find()
}

/**
 * Update  admin by their ID
 */
export async function updateAdmin(adminId: string, data: Partial<IAdmin>): Promise<IAdmin | null> {
  return AdminModel.findByIdAndUpdate(adminId, data, { new: true })
}

/**
 * Delete  admin by their ID
 */
export async function deleteAdmin(adminId: string): Promise<IAdmin | null> {
  return AdminModel.findByIdAndDelete(adminId).populate('telegram')
}

/**
 * Check if  admin exists by their username
 */
export async function adminExists(username: string): Promise<boolean> {
  const result = await AdminModel.exists({ username })
  return result !== null
}
