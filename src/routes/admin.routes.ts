import { Router } from 'express'

import {
  createAdminController,
  getAllAdminsController,
  updateAdminController,
  deleteAdminController,
  changePasswordController,
  controlAdminAccountController,
  updateAdminRoleController,
  getAdminByIdController,
} from '../controllers/admin.controller'
import { protect, access } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validate.middleware'
import {
  adminRegisterSchema,
  updateAdminSchema,
  changePasswordSchema,
  updateRoleSchema,
} from '../validators/admin.validator'

const router = Router()

router.post(
  '/create',
  protect,
  access('SUPER_ADMIN'),
  validateRequest(adminRegisterSchema),
  createAdminController
)

router.get('/', protect, access('SUPER_ADMIN', 'ADMIN'), getAllAdminsController)

router.get('/:adminId', protect, access('SUPER_ADMIN', 'ADMIN'), getAdminByIdController)

router.put(
  '/:adminId',
  protect,
  access('SUPER_ADMIN'),
  validateRequest(updateAdminSchema),
  updateAdminController
)

router.delete('/:adminId', protect, access('SUPER_ADMIN'), deleteAdminController)

router.post(
  '/change-password',
  protect,
  validateRequest(changePasswordSchema),
  changePasswordController
)

router.patch('/:adminId/control', protect, access('SUPER_ADMIN'), controlAdminAccountController)

router.patch(
  '/:adminId/role',
  protect,
  access('SUPER_ADMIN'),
  validateRequest(updateRoleSchema),
  updateAdminRoleController
)

export default router
