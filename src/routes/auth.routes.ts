import { Router } from 'express'

import {
  loginController,
  signupController,
  logoutController,
  getMeController,
} from '../controllers/auth.controller'
import { protect } from '../middlewares/auth.middleware'

const router = Router()

router.post('/login', loginController)
router.post('/signup', signupController)
router.post('/logout', logoutController)
router.get('/me', protect, getMeController)

export default router
