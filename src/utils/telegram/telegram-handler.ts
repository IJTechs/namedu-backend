import TelegramBot, { InputMediaPhoto } from 'node-telegram-bot-api'

import { ISentMessages } from '../../interfaces/news.interface'
import { findTelegramByAdmin } from '../../repositories/telegram.repository'

export const sendNewsToTelegram = async (
  adminId: string,
  message: string,
  images?: string[] | string
): Promise<ISentMessages[]> => {
  try {
    console.log(`Fetching Telegram details for admin ID: ${adminId}`)
    const telegramDetails = await findTelegramByAdmin(adminId)

    if (!telegramDetails) {
      throw new Error('No Telegram bot found for the admin.')
    }

    const bot = new TelegramBot(telegramDetails.botToken, { polling: false })

    // Ensure images is an array
    const imageArray = Array.isArray(images) ? images : images ? [images] : []

    const mediaGroup = imageArray.map(
      (image, index) =>
        ({
          type: 'photo',
          media: image,
          caption: index === 0 ? message : '',
          parse_mode: 'Markdown',
        }) as InputMediaPhoto
    )

    const response = await bot.sendMediaGroup(telegramDetails.channelId, mediaGroup)
    console.log('Telegram API Response🔥🔥🔥🔥🔥🔥🔥🔥🔥:', response)
    if (!response || response.length === 0) {
      throw new Error('Telegram API response did not contain message_id')
    }

    return response.map((msg) => ({ message_id: msg.message_id, chat: msg.chat }))
  } catch (error) {
    console.error('Failed to send news to Telegram:', error)
    throw error
  }
}
