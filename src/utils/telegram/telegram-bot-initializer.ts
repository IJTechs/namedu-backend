import { UserModel } from '../../models/user.model'
import { setupTelegramBot } from '../telegram/telegram-bot'

// Initialize all Telegram bots for admins when server starts
const initializeTelegramBots = async () => {
  const admins = await UserModel.find({ role: { $in: ['SUPER_ADMIN', 'ADMIN'] } })
  admins.forEach((admin) => {
    setupTelegramBot(admin._id.toString()).catch((err) =>
      console.error('Failed to setup Telegram bot:', err)
    )
  })
}

export default initializeTelegramBots
