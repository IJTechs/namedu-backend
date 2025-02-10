import { Router } from 'express'

import {
  createNewsController,
  getAllNewsController,
  getNewsByIdController,
  updateNewsController,
  deleteNewsController,
  uploadImage,
} from '../controllers/news.controller'
import { protect, access } from '../middlewares/auth.middleware'
import { validateRequest } from '../middlewares/validate.middleware'
import { newsSchema } from '../validators/news.validator'

const router = Router()

router.post(
  '/post',
  protect,
  access('ADMIN', 'SUPER_ADMIN'),
  uploadImage,
  validateRequest(newsSchema),
  createNewsController
)
router.get('/', getAllNewsController)

router.get('/:id', getNewsByIdController)

router.put('/:id', protect, access('ADMIN', 'SUPER_ADMIN'), uploadImage, updateNewsController)

router.delete('/:id', protect, access('ADMIN', 'SUPER_ADMIN'), deleteNewsController)

export default router
