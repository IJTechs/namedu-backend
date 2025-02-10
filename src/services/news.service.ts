import mongoose from 'mongoose'
import TelegramBot from 'node-telegram-bot-api'

import { config } from '../config/environments.config'
import { StatusCode } from '../enums/status-code'
import { INews, ISentMessages } from '../interfaces/news.interface'
import {
  createNews,
  getAllNews,
  getNewsById,
  updateNews,
  deleteNews,
} from '../repositories/news.repository'
import { findTelegramByAdmin } from '../repositories/telegram.repository'
import AppError from '../utils/app-error'
import { sendNewsToTelegram } from '../utils/telegram/telegram-handler'

/**
 * Service to create and post news to the website and Telegram.
 */
export const createAndPostNewsService = async (
  newsData: Partial<INews>
): Promise<{
  news: INews
  telegram: {
    message: string
    telegramStatus: 'SUCCESS' | 'FAILED'
  }
}> => {
  const news = await createNews(newsData)

  const slugTitle = news.title.toLowerCase().replace(/\s+/g, '-')
  const newsLink = `[Batafsil](${config.WEBSITE_URL}/yangilik/${slugTitle}?id=${news._id})`

  const formatContentWithLinks = (content: string): string => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return content.replace(urlRegex, (url) => `[${url}](${url})`)
  }

  const filteredContent = formatContentWithLinks(news.content)

  const maxCaptionLength = 1000 - newsLink.length - 10
  const truncatedContent =
    filteredContent.length > maxCaptionLength
      ? filteredContent.slice(0, maxCaptionLength) + '... '
      : filteredContent

  const message = `*${news.title}*\n\n${truncatedContent}${' '}${newsLink}\n\n*Bizni kuzatib boring*`

  const telegramDetails = await findTelegramByAdmin(news.author.toString())

  if (!telegramDetails) {
    return {
      news,
      telegram: {
        message:
          'News was posted on the website but not sent to Telegram. Please connect your Telegram bot.',
        telegramStatus: 'FAILED',
      },
    }
  }

  try {
    const sentMessages = (await sendNewsToTelegram(
      news.author.toString(),
      message,
      news.images
    )) as ISentMessages[]

    news.telegramMessageId = sentMessages.map((msg) => msg.message_id)
    news.telegramChatId = sentMessages?.[0]?.chat?.id || null
    await news.save()

    return {
      news,
      telegram: {
        message: 'News was posted successfully on the website and sent to Telegram.',
        telegramStatus: 'SUCCESS',
      },
    }
  } catch (error) {
    return {
      news,
      telegram: {
        message: 'News was posted on the website but failed to send to Telegram.',
        telegramStatus: 'FAILED',
      },
    }
  }
}

/**
 * Service to handle news posting from Telegram Bot to the website and channel.
 */
export const handleNewsFromTelegram = async (
  title: string,
  content: string,
  images: string[],
  socialLinks: Record<string, string>,
  adminId: number,
  linkedAdmin: mongoose.Types.ObjectId
): Promise<void> => {
  try {
    const formatContentWithLinks = (content: string): string => {
      const urlRegex = /(https?:\/\/[^\s]+)/g
      return content.replace(urlRegex, (url) => `[${url}](${url})`)
    }

    const filteredContent = formatContentWithLinks(content)

    const news = await createNews({
      title,
      content: filteredContent,
      images,
      socialLinks,
      views: 0,
      author: linkedAdmin,
      readTime: 5,
    })

    const slugTitle = title.toLowerCase().replace(/\s+/g, '-')
    const newsLink = `[Batafsil](${config.WEBSITE_URL}/yangilik/${slugTitle}?id=${news._id})`

    // Truncate content to fit within Telegram caption limits
    const maxCaptionLength = 1000 - newsLink.length - 10
    const truncatedContent =
      filteredContent.length > maxCaptionLength
        ? filteredContent.slice(0, maxCaptionLength) + '... '
        : filteredContent

    // Format social links into markdown links
    const linksText = Object.entries(socialLinks)
      .map(([platform, link]) => {
        const formattedPlatform = platform.charAt(0).toUpperCase() + platform.slice(1)
        return `[${formattedPlatform}](${link})`
      })
      .join(' | ')

    const message = `*${title}*\n\n${truncatedContent}${' '}${newsLink}\n\n*Bizni kuzatib boring*\n${linksText}`

    // Send the news to Telegram channel
    const sentMessages = await sendNewsToTelegram(linkedAdmin.toString(), message, images)

    news.telegramMessageId = sentMessages.map((msg) => msg.message_id)
    news.telegramChatId = sentMessages?.[0]?.chat?.id || null
    await news.save()

    console.log('🟢 News posted to the channel successfully!')
  } catch (error) {
    console.error('🔴 Failed to post news to the channel:', error)
    throw new AppError('Failed to post news to Telegram', StatusCode.InternalServerError)
  }
}

/**
 * Get all news articles.
 */
export async function getAllNewsService(): Promise<INews[]> {
  return await getAllNews()
}

/**
 * Get a single news article by ID.
 */
export async function getNewsByIdService(id: string): Promise<INews | null> {
  return await getNewsById(id)
}

/**
 * Update a news article by its ID.
 */
export const updateAndEditTelegramNews = async (
  id: string,
  updatedData: Partial<INews>
): Promise<INews | null> => {
  const news = await getNewsById(id)

  if (!news) throw new Error('❌ News not found')

  // ✅ Ensure author ID is in the correct format
  const adminId =
    typeof news.author === 'string'
      ? news.author
      : news.author instanceof mongoose.Types.ObjectId
        ? news.author.toString()
        : news.author._id.toString()

  const telegramDetails = await findTelegramByAdmin(adminId)

  if (!telegramDetails || !telegramDetails.botToken || !telegramDetails.channelId) {
    console.error(`❌ No Telegram bot found for admin: ${news.author}`)
    throw new Error('No Telegram bot found for the admin.')
  }

  console.log('🟢 Telegram bot found:', telegramDetails)

  const bot = new TelegramBot(telegramDetails.botToken, { polling: false })

  // ✅ Step 1: Delete Previous Telegram Messages
  if (news.telegramMessageId?.length && news.telegramChatId) {
    try {
      console.log(`🟠 Deleting previous Telegram messages from Chat ID: ${news.telegramChatId}`)
      for (const messageId of news.telegramMessageId) {
        await bot.deleteMessage(news.telegramChatId, messageId)
      }
      console.log('🟢 Previous Telegram message deleted successfully!')
    } catch (error) {
      console.error('🔴 Failed to delete previous Telegram message:', error)
    }
  } else {
    console.warn('⚠️ No previous Telegram messages found to delete.')
  }

  const slugTitle = (updatedData.title || news.title).toLowerCase().replace(/\s+/g, '-')
  const newsLink = `[Batafsil](${config.WEBSITE_URL}/yangilik/${slugTitle}?id=${news._id})`

  const updatedMessage = `*${updatedData.title || news.title}*\n\n${updatedData.content || news.content}\n\n${newsLink}\n\n*Bizni kuzatib boring*\n`

  let imageArray: string[] = []

  if (updatedData.images) {
    imageArray = Array.isArray(updatedData.images) ? updatedData.images : [updatedData.images]
  } else {
    imageArray = Array.isArray(news.images) ? news.images : [news.images]
  }

  // ✅ Step 4: Send Updated News to Telegram
  let newMessages: ISentMessages[] = []

  try {
    if (imageArray.length > 0) {
      newMessages = await sendNewsToTelegram(adminId, updatedMessage, imageArray)
    } else {
      const sentMessage = await bot.sendMessage(telegramDetails.channelId, updatedMessage, {
        parse_mode: 'Markdown',
      })
      newMessages = [{ message_id: sentMessage.message_id, chat: sentMessage.chat }]
    }
  } catch (error) {
    console.error('🔴 Failed to send updated news to Telegram:', error)
    throw new Error('Failed to send updated news to Telegram.')
  }

  // ✅ Step 5: Save New Telegram Message IDs
  if (newMessages.length > 0) {
    updatedData.telegramMessageId = newMessages.map((msg) => msg.message_id)
    updatedData.telegramChatId = newMessages[0]?.chat?.id || news.telegramChatId
  } else {
    console.warn('⚠️ No messages were sent to Telegram.')
  }

  // ✅ Step 6: Update News in the Database
  const updatedNews = await updateNews(id, updatedData)

  return updatedNews
}

/**
 * Delete a news article by its ID.
 */
export const deleteNewsAndRemoveTelegram = async (id: string): Promise<INews | null> => {
  const news = await getNewsById(id)
  if (!news) throw new Error('News not found')

  if (news.telegramMessageId && news.telegramChatId) {
    const telegramDetails = await findTelegramByAdmin(news.author)
    if (telegramDetails) {
      const bot = new TelegramBot(telegramDetails.botToken, { polling: false })
      try {
        for (const messageId of news.telegramMessageId) {
          await bot.deleteMessage(news.telegramChatId, messageId)
        }
        console.log('🟢 Telegram message deleted successfully!')
      } catch (error) {
        console.error('🔴 Failed to delete Telegram message:', error)
      }
    }
  }

  return await deleteNews(id)
}
