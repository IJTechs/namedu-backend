import { Router } from 'express'

import {
  createTelegramController,
  getTelegramController,
  updateTelegramController,
  deleteTelegramController,
} from '../controllers/telegram.controller'
import { protect, access } from '../middlewares/auth.middleware'

const router = Router()

router.post('/add', protect, access('ADMIN', 'SUPER_ADMIN'), createTelegramController)

router.get('/:adminId', protect, getTelegramController)

router.put('/:id', protect, access('ADMIN', 'SUPER_ADMIN'), updateTelegramController)

router.delete('/:id', protect, access('ADMIN', 'SUPER_ADMIN'), deleteTelegramController)

export default router
