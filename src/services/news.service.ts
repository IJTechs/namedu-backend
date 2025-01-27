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
export const createAndPostNewsService = async (newsData: Partial<INews>): Promise<INews> => {
  const news = await createNews(newsData)

  const slugTitle = news.title.toLowerCase().replace(/\s+/g, '-')
  const newsLink = `[Batafsil](${config.WEBSITE_URL}/yangilik/${slugTitle}?id=${news._id})`

  // Function to format URLs to markdown links
  const formatContentWithLinks = (content: string): string => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return content.replace(urlRegex, (url) => `[${url}](${url})`)
  }

  // Filter and format content to replace URLs with clickable links
  const filteredContent = formatContentWithLinks(news.content)

  const maxCaptionLength = 1000 - newsLink.length - 10
  const truncatedContent =
    filteredContent.length > maxCaptionLength
      ? filteredContent.slice(0, maxCaptionLength) + '... '
      : filteredContent

  const message = `*${news.title}*\n\n${truncatedContent}${' '}${newsLink}\n\n*Bizni kuzatib boring*`

  try {
    const sentMessages = (await sendNewsToTelegram(
      news.author.toString(),
      message,
      news.images
    )) as ISentMessages[]

    news.telegramMessageId = sentMessages.map((msg) => msg.message_id)
    news.telegramChatId = sentMessages?.[0]?.chat?.id || null
    await news.save()

    console.log('🟢 News posted to the channel successfully!')
  } catch (error) {
    console.error('🔴 Failed to post news to Telegram:', error)
    throw new AppError('Failed to post news to Telegram', StatusCode.InternalServerError)
  }

  return news
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
    // Function to format URLs in content to markdown links
    const formatContentWithLinks = (content: string): string => {
      const urlRegex = /(https?:\/\/[^\s]+)/g
      return content.replace(urlRegex, (url) => `[${url}](${url})`)
    }

    const filteredContent = formatContentWithLinks(content)

    // Save news before posting to Telegram
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

    // Construct the Telegram message with clickable links
    const message = `*${title}*\n\n${truncatedContent}${' '}${newsLink}\n\n*Bizni kuzatib boring*\n${linksText}`

    // Send the news to Telegram channel
    const sentMessages = await sendNewsToTelegram(adminId.toString(), message, images)

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
 * @param id string
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

  if (!news) throw new Error('News not found')

  const telegramDetails = await findTelegramByAdmin(news.author.toString())

  if (!telegramDetails) {
    throw new Error('No Telegram bot found for the admin.')
  }

  const bot = new TelegramBot(telegramDetails.botToken, { polling: false })

  // Delete previous messages from Telegram if images are updated
  if (updatedData.images && news.telegramMessageId && news.telegramChatId) {
    try {
      for (const messageId of news.telegramMessageId) {
        await bot.deleteMessage(news.telegramChatId, messageId)
      }
      console.log('🟢 Previous Telegram message deleted successfully!')
    } catch (error) {
      console.error('🔴 Failed to delete previous Telegram message:', error)
    }

    // Post updated news with new images
    const slugTitle = news.title.toLowerCase().replace(/\s+/g, '-')
    const newsLink = `[Batafsil](${config.WEBSITE_URL}/yangilik/${slugTitle}?id=${news._id})`

    const updatedMessage = `*${updatedData.title || news.title}*\n\n${updatedData.content || news.content}${''}${newsLink}\n\n*Bizni kuzatib boring*\n`

    const newMessages = await sendNewsToTelegram(
      news.author.toString(),
      updatedMessage,
      updatedData.images
    )

    updatedData.telegramMessageId = newMessages.map((msg) => msg.message_id)
    updatedData.telegramChatId = newMessages[0].chat.id
  }

  // Update the news in the database
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
    const telegramDetails = await findTelegramByAdmin(news.author.toString())
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
