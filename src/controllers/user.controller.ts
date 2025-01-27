import { Request, Response } from 'express'

import { StatusCode } from '../enums/status-code'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import {
  createUserService,
  getUserByUsernameService,
  getAllUsersService,
  updateUserService,
  deleteUserService,
  changePasswordService,
  controlleUserAccountService,
  updateUserRoleService,
} from '../services/user.service'
import { filterObjectData } from '../utils/filter-object-data'

/**
 * Controller to register a new user.
 */
export const createUserController = asyncHandler(async (req: Request, res: Response) => {
  const { full_name, username, password, confirm_password, role } = req.body
  const useData = { full_name, username, password, confirm_password, role }
  const creatorRole = req.user?.role ?? 'ADMIN'

  const user = await createUserService({ ...useData }, creatorRole)
  res.status(StatusCode.Created).json({ message: 'User created successfully', user })
})

/**
 * Get all users (for super admins).
 */
export const getAllUsersController = asyncHandler(async (req: Request, res: Response) => {
  const users = await getAllUsersService()
  res.status(200).json({
    count: users.length,
    users,
  })
})

/**
 * Get user by username.
 */
export const getUserByUsernameController = asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.params
  const user = await getUserByUsernameService(username)

  if (!user) {
    res.status(StatusCode.NotFound).json({ message: 'User not found' })
    return
  }

  res.status(StatusCode.OK).json(user)
})

/**
 * Update a user.
 */
export const updateUserController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params

  const dataToUpdate = filterObjectData(req.body, 'full_name', 'username')

  const updatedUser = await updateUserService(userId, dataToUpdate)

  if (!updatedUser) {
    res.status(StatusCode.NotFound).json({ message: 'User not found' })
    return
  }

  res.status(StatusCode.OK).json({ message: 'User updated successfully', updatedUser })
})

/**
 * Delete a user by ID.
 */
export const deleteUserController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params
  const deleted = await deleteUserService(userId)

  if (!deleted) {
    res.status(StatusCode.NotFound).json({ message: 'User not found' })
    return
  }

  res.status(StatusCode.OK).json({ message: 'User deleted successfully' })
})

/**
 * Change user password.
 */
export const changePasswordController = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { old_password, new_password } = req.body
    const userId = req.user?.id

    if (!userId) {
      res.status(StatusCode.BadRequest).json({ error: 'User ID is missing' })
      return
    }

    if (!old_password || !new_password) {
      res.status(StatusCode.BadRequest).json({ error: 'Old and new passwords are required' })
      return
    }

    await changePasswordService(userId, old_password, new_password)
    res.status(StatusCode.OK).json({ message: 'Password changed successfully' })
  }
)

/**
 * Lock/unlock user account.
 */
export const controlUserAccountController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params
  const user = await controlleUserAccountService(userId)
  res.status(StatusCode.OK).json({ message: 'User account status updated', user })
})

/**
 * Update user role.
 */
export const updateUserRoleController = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params
  const { role } = req.body
  const requesterRole = req.user?.role ?? 'ADMIN'

  const updatedUser = await updateUserRoleService(userId, role, requesterRole)
  res.status(StatusCode.OK).json({ message: 'User role updated', updatedUser })
})
