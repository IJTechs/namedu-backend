import { Router } from 'express'

import adminRoutes from './admin.routes'
import authRoutes from './auth.routes'
import newsRoutes from './news.routes'
import telegramRoutes from './telegram.routes'

const router = Router()

router.use('/auth', authRoutes)
router.use('/news', newsRoutes)
router.use('/telegrams', telegramRoutes)
router.use('/admins', adminRoutes)

export default router
