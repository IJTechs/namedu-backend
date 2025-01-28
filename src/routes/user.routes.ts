import { Router } from 'express'

import {
  createUserController,
  getAllUsersController,
  updateUserController,
  deleteUserController,
  changePasswordController,
  controlUserAccountController,
  updateUserRoleController,
  getUserByIdController,
} from '../controllers/user.controller'
import { protect, access } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validate.middleware'
import {
  userRegisterSchema,
  updateUserSchema,
  changePasswordSchema,
  updateRoleSchema,
} from '../validators/user.validator'

const router = Router()

router.post('/create', protect, validateRequest(userRegisterSchema), createUserController)

router.get('/', protect, access('SUPER_ADMIN'), getAllUsersController)

router.get('/:userId', protect, access('SUPER_ADMIN', 'ADMIN'), getUserByIdController)

router.put('/:userId', protect, validateRequest(updateUserSchema), updateUserController)

router.delete('/:userId', protect, access('SUPER_ADMIN'), deleteUserController)

router.post(
  '/change-password',
  protect,
  validateRequest(changePasswordSchema),
  changePasswordController
)

router.patch('/:userId/control', protect, access('SUPER_ADMIN'), controlUserAccountController)

router.patch(
  '/:userId/role',
  protect,
  access('SUPER_ADMIN'),
  validateRequest(updateRoleSchema),
  updateUserRoleController
)

export default router
