import { Router } from 'express'

import authRoutes from './auth.routes'
import newsRoutes from './news.routes'
import telegramRoutes from './telegram.routes'
import userRoutes from './user.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/news', newsRoutes)
router.use('/telegram', telegramRoutes)
router.use('/users', userRoutes)

export default router
