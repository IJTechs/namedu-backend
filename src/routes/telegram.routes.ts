import { Router } from 'express'

import {
  createTelegramController,
  getTelegramByLinkedAdminController,
  updateTelegramController,
  deleteTelegramController,
  getTelegramByIdController,
  getAllTelegramsController,
} from '../controllers/telegram.controller'
import { protect, access } from '../middlewares/auth.middleware'

const router = Router()

router.get('/', protect, access('ADMIN', 'SUPER_ADMIN'), getAllTelegramsController)

router.post('/add', protect, access('ADMIN', 'SUPER_ADMIN'), createTelegramController)

router.get(
  '/linkedadmin/:adminId',
  protect,
  access('ADMIN', 'SUPER_ADMIN'),
  getTelegramByLinkedAdminController
)

router.get('/:id', protect, access('ADMIN', 'SUPER_ADMIN'), getTelegramByIdController)

router.put('/:id', protect, access('ADMIN', 'SUPER_ADMIN'), updateTelegramController)

router.delete('/:id', protect, access('ADMIN', 'SUPER_ADMIN'), deleteTelegramController)

export default router
