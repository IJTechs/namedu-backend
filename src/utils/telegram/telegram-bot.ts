import mongoose from 'mongoose'
import TelegramBot from 'node-telegram-bot-api'

import { findTelegramByAdmin } from '../../repositories/telegram.repository'
import { handleNewsFromTelegram } from '../../services/news.service'
import { uploadImageToCloudinary } from '../cloud/cloudinary'

export const setupTelegramBot = async (linkedAdmin: string) => {
  const telegramDetails = await findTelegramByAdmin(linkedAdmin)

  if (!telegramDetails) {
    console.warn(`🔴 Admin uchun Telegram boti topilmadi. Admin ID: ${linkedAdmin}`)
    return
  }

  const bot = new TelegramBot(telegramDetails.botToken, { polling: true })
  const userSession: Record<number, any> = {}

  // Set bot commands
  bot.setMyCommands([
    { command: '/start', description: 'Botni boshlash' },
    { command: '/postnews', description: 'Yangilik e’lon qilish' },
    { command: '/help', description: 'Bot haqida yordam' },
  ])

  // Handle /start command
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(
      chatId,
      `👋 Salom, bu yangilik e’lon qilish botidir!\n\nSiz quyidagi buyruqlardan foydalanishingiz mumkin:\n
      /postnews - Yangilik qo'shish
      /help - Yordam olish`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Yangilik qo‘shish', callback_data: 'start_postnews' }],
            [{ text: 'Yordam', callback_data: 'get_help' }],
          ],
        },
      }
    )
  })

  // Handle /help command
  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(
      chatId,
      `ℹ️ *Yordam:*\n\n- /postnews — Yangilik qo'shish uchun foydalaning.\n- Har bir qadamda ko‘rsatmalarga rioya qiling.\n- Yangilikni tasdiqlashdan oldin oldindan ko‘rishni ko‘ring.`,
      { parse_mode: 'Markdown' }
    )
  })

  // Function to generate social media keyboard dynamically
  const generateSocialMediaKeyboard = (chatId: number) => {
    const availablePlatforms = [
      { text: 'Telegram', callback_data: 'add_telegram' },
      { text: 'Instagram', callback_data: 'add_instagram' },
      { text: 'Facebook', callback_data: 'add_facebook' },
      { text: 'YouTube', callback_data: 'add_youtube' },
      { text: 'X (Twitter)', callback_data: 'add_twitter' },
    ]

    const remainingPlatforms = availablePlatforms.filter(
      (platform) => !userSession[chatId].socialLinks[platform.callback_data.replace('add_', '')]
    )

    if (remainingPlatforms.length === 0) {
      return { inline_keyboard: [[{ text: 'Tugatish', callback_data: 'finish_social' }]] }
    }

    remainingPlatforms.push({ text: 'Tugatish', callback_data: 'finish_social' })

    return { inline_keyboard: [remainingPlatforms] }
  }

  // Handle inline button actions
  bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message?.chat.id
    const messageId = callbackQuery.message?.message_id
    if (!chatId || !messageId) return

    const action = callbackQuery.data

    if (action === 'start_postnews') {
      bot.sendMessage(chatId, '📰 Iltimos, yangilik sarlavhasini yuboring.')
      userSession[chatId] = { step: 1, socialLinks: {}, uploadedImages: [] }
    } else if (action === 'get_help') {
      bot.sendMessage(chatId, 'ℹ️ Botdan foydalanish bo‘yicha yordam uchun /help ni bosing.')
    } else if (action?.startsWith('add_')) {
      const platform = action.replace('add_', '')
      userSession[chatId].currentPlatform = platform
      bot.sendMessage(chatId, `${platform} havolasini kiriting:`)
    } else if (action === 'skip_social') {
      userSession[chatId].step = 5
      sendPreview(chatId)
    } else if (action === 'finish_social') {
      sendPreview(chatId)
    } else if (action === 'confirm_post') {
      const { title, content, uploadedImages, socialLinks } = userSession[chatId]

      await handleNewsFromTelegram(
        title,
        content,
        uploadedImages,
        socialLinks,
        telegramDetails.adminId,
        new mongoose.Types.ObjectId(linkedAdmin)
      )

      bot.editMessageReplyMarkup(
        {
          inline_keyboard: [[{ text: '✅ Posted', callback_data: 'none' }]],
        },
        { chat_id: chatId, message_id: messageId }
      )

      bot.sendMessage(chatId, '✅ Yangilik muvaffaqiyatli yuklandi va e’lon qilindi!')

      delete userSession[chatId]
    } else if (action === 'cancel_post') {
      bot.editMessageReplyMarkup(
        {
          inline_keyboard: [[{ text: '❌ Canceled', callback_data: 'none' }]],
        },
        { chat_id: chatId, message_id: messageId }
      )

      bot.sendMessage(chatId, '❌ Yangilik bekor qilindi.')
      delete userSession[chatId]
    }

    bot.answerCallbackQuery(callbackQuery.id)
  })

  // Post news process
  bot.onText(/\/postnews/, (msg) => {
    const chatId = msg.chat.id
    userSession[chatId] = { step: 1, socialLinks: {}, uploadedImages: [] }
    bot.sendMessage(chatId, '📰 Iltimos, yangilik sarlavhasini yuboring.')
  })

  bot.on('message', async (msg) => {
    try {
      const chatId = msg.chat.id

      if (!userSession[chatId]) return

      switch (userSession[chatId]?.step) {
        case 1:
          userSession[chatId].title = msg.text
          userSession[chatId].step++
          bot.sendMessage(chatId, '📝 Keyingi qadamda, yangilik matnini yuboring.')
          break

        case 2:
          userSession[chatId].content = msg.text
          userSession[chatId].step++
          bot.sendMessage(chatId, '📷 Iltimos, yangilik rasmini yuboring.')
          break

        case 3:
          if (msg.photo) {
            if (!userSession[chatId].imageUploadMessageSent) {
              bot.sendMessage(chatId, '⌛️ Rasm yuklanmoqda, iltimos kuting...')
              userSession[chatId].imageUploadMessageSent = true
            }

            userSession[chatId].uploadedImages = []
            try {
              if (!userSession[chatId].uploadedImages) {
                userSession[chatId].uploadedImages = []
              }

              const highestQualityPhoto = msg.photo[msg.photo.length - 1]

              const fileId = highestQualityPhoto.file_id
              const file = await bot.getFile(fileId)
              const fileUrl = `https://api.telegram.org/file/bot${telegramDetails.botToken}/${file.file_path}`

              const uploadedImage = await uploadImageToCloudinary(fileUrl)

              if (uploadedImage) {
                userSession[chatId].uploadedImages.push(uploadedImage)
              }

              if (
                userSession[chatId].uploadedImages.length > 0 &&
                !userSession[chatId].socialLinksAdded
              ) {
                userSession[chatId].images = userSession[chatId].uploadedImages
                userSession[chatId].step++
                userSession[chatId].socialLinksAdded = true

                bot.sendMessage(chatId, '🔗 Ijtimoiy tarmoqlarni qo‘shing:', {
                  reply_markup: generateSocialMediaKeyboard(chatId),
                })
              }
            } catch (error) {
              bot.sendMessage(
                chatId,
                '❌ Rasm yuklashda xatolik yuz berdi. Iltimos, qayta urinib ko‘ring.'
              )
              console.error('Error uploading images:', error)
            }
          } else {
            bot.sendMessage(chatId, '❌ Iltimos, faqat rasm formatidagi faylni yuklang.')
          }
          break

        case 4:
          userSession[chatId].socialLinks[userSession[chatId].currentPlatform] = msg.text
          delete userSession[chatId].currentPlatform
          bot.sendMessage(chatId, 'Boshqa ijtimoiy tarmoqlarni qo‘shishni xohlaysizmi?', {
            reply_markup: generateSocialMediaKeyboard(chatId),
          })

          break

        default:
          bot.sendMessage(chatId, "⚠️ Noto'g'ri buyruq. /postnews ni qayta yuboring.")
          delete userSession[chatId]
          delete userSession[msg.chat.id]
      }
    } catch (error: any) {
      console.error('Error processing message:', error)
      delete userSession[msg.chat.id]
      bot.sendMessage(
        msg.chat.id,
        '❌ Xatolik yuz berdi. Iltimos, /postnews buyrug‘ini qayta yuboring.'
      )
    }
  })

  // Function to send the news preview
  const sendPreview = (chatId: number) => {
    if (!userSession[chatId]) {
      delete userSession[chatId]
      bot.sendMessage(
        chatId,
        '❌ Xatolik yuz berdi:  Iltimos, boshidan boshlang, yangilikni qayta kiriting.'
      )
      return
    }

    // Validate that all required fields exist
    const { title, content, uploadedImages, socialLinks } = userSession[chatId]

    if (!title || !content || !uploadedImages || uploadedImages.length === 0) {
      bot.sendMessage(chatId, '❌ Maʼlumotlar yetarli emas. Iltimos, yangilikni qayta kiriting.')
      return
    }

    const linksText = Object.entries(socialLinks)
      .map(([platform, link]) => {
        const formattedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1)
        return `[${formattedPlatform}](${link})`
      })
      .join(' | ')

    const message = `*${title}*\n\n${content}\n\nBizni kuzatib boring:\n${linksText || "Siz ijtimoiy tarmoqlarni qo'shmadingiz."}`

    bot.sendPhoto(chatId, uploadedImages[0], {
      caption: message,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Tasdiqlash', callback_data: 'confirm_post' }],
          [{ text: '❌ Bekor qilish', callback_data: 'cancel_post' }],
        ],
      },
    })
  }

  console.log(`🟢 Telegram boti ishga tushdi. Admin ID: ${linkedAdmin}`)
}
