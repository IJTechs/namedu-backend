import { Request, Response } from 'express'

import { StatusCode } from '../enums/status-code'
import { IAdmin } from '../interfaces/admin.interface'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import {
  changePasswordService,
  createAdminService,
  getAdminByIdService,
  updateAdminService,
  deleteAdminService,
  getAllAdminsService,
  controlleAdminAccountService,
  updateAdminRoleService,
} from '../services/admin.service'
import hashePassword from '../utils/auth/hash-password'
import { filterObjectData } from '../utils/filter-object-data'

/**
 * Controller to register a new admin.
 */
export const createAdminController = asyncHandler(async (req: Request, res: Response) => {
  const { full_name, username, password, confirm_password, role } = req.body
  const useData = { full_name, username, password, confirm_password, role }
  const creatorRole = req.admin?.role ?? 'ADMIN'

  const admin = await createAdminService({ ...useData }, creatorRole)
  res
    .status(StatusCode.Created)
    .json({ status: 'success', message: 'Admin created successfully', admin })
})

/**
 * Get all admins (for super admins).
 */
export const getAllAdminsController = asyncHandler(async (req: Request, res: Response) => {
  const userRole = req.admin!.role as 'SUPER_ADMIN' | 'ADMIN'
  const userId = req.admin?._id as IAdmin['_id']

  const admins = await getAllAdminsService(userRole, userId)

  res.status(200).json({
    status: 'success',
    count: admins.length,
    admins,
  })
})

/**
 * Get admin by ID.
 */
export const getAdminByIdController = asyncHandler(async (req: Request, res: Response) => {
  const { adminId } = req.params
  const admin = await getAdminByIdService(adminId)

  if (!admin) {
    res.status(StatusCode.NotFound).json({ message: 'There is no admin with this ID' })
    return
  }

  res.status(StatusCode.OK).json({
    status: 'success',
    admin,
  })
})

/**
 * Update a admin.
 */
export const updateAdminController = asyncHandler(async (req: Request, res: Response) => {
  const { adminId } = req.params

  const requesterAdminId = req.admin?.id

  if (requesterAdminId === adminId) {
    res.status(StatusCode.Forbidden).json({ message: 'You cannot edit your own account' })
    return
  }

  const dataToUpdate = filterObjectData(
    req.body,
    'full_name',
    'username',
    'role',
    'isActive',
    'password'
  )
  if (req.body.password) {
    dataToUpdate.password = await hashePassword(req.body.password)
  }

  const admin = await updateAdminService(adminId, dataToUpdate)

  if (!admin) {
    res.status(StatusCode.NotFound).json({ message: 'Admin not found' })
    return
  }

  res
    .status(StatusCode.OK)
    .json({ status: 'success', message: 'Admin updated successfully', admin })
})

/**
 * Delete a admin by ID.
 */
export const deleteAdminController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { adminId } = req.params
    const admin = await getAdminByIdService(adminId)
    const requesterAdminId = req.admin?.id

    if (requesterAdminId === adminId) {
      res.status(StatusCode.Forbidden).json({ message: 'You cannot delete your own account' })
      return
    }

    const requesterRole = req.admin?.role ?? 'ADMIN'
    if (requesterRole !== 'SUPER_ADMIN') {
      res
        .status(StatusCode.Forbidden)
        .json({ message: 'You do not have permission to delete an admin' })
      return
    }

    if (!admin) {
      res.status(StatusCode.NotFound).json({ message: 'Admin not found' })
      return
    }

    const deleted = await deleteAdminService(adminId)

    if (!deleted) {
      res.status(StatusCode.NotFound).json({ message: 'Admin not found' })
      return
    }

    res.status(StatusCode.OK).json({
      status: 'success',
      message: 'Admin and associated Telegram bot deleted successfully',
    })
  }
)

/**
 * Change admin password.
 */
export const changePasswordController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { old_password, new_password } = req.body
    const adminId = req.admin?.id

    if (!adminId) {
      res.status(StatusCode.BadRequest).json({ error: 'Admin ID is missing' })
      return
    }

    if (!old_password || !new_password) {
      res.status(StatusCode.BadRequest).json({ error: 'Old and new passwords are required' })
      return
    }

    await changePasswordService(adminId, old_password, new_password)

    res.status(StatusCode.OK).json({ status: 'success', message: 'Password changed successfully' })
  }
)

/**
 * Lock/unlock admin account.
 */
export const controlAdminAccountController = asyncHandler(async (req: Request, res: Response) => {
  const { adminId } = req.params

  const admin = await controlleAdminAccountService(adminId)

  res
    .status(StatusCode.OK)
    .json({ status: 'success', message: 'Admin account status updated successfully', admin })
})

/**
 * Update admin role.
 */
export const updateAdminRoleController = asyncHandler(async (req: Request, res: Response) => {
  const { adminId } = req.params

  const { role } = req.body

  const requesterRole = req.admin?.role ?? 'ADMIN'

  const admin = await updateAdminRoleService(adminId, role, requesterRole)

  res.status(StatusCode.OK).json({ status: 'success', message: 'Admin role updated', admin })
})
