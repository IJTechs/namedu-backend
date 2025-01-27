import { INews } from '../interfaces/news.interface'
import { NewsModel } from '../models/news.model'

/**
 * Create a new news article in the database.
 */
export const createNews = async (data: Partial<INews>): Promise<INews> => {
  return await NewsModel.create(data)
}

/**
 * Retrieve all news articles from the database.
 */
export const getAllNews = async (): Promise<INews[]> => {
  return await NewsModel.find().lean()
}

/**
 * Find a news article by its ID.
 */
export const getNewsById = async (id: string): Promise<INews | null> => {
  return await NewsModel.findById(id).lean()
}

/**
 * Update a news article by its ID.
 */
export const updateNews = async (id: string, data: Partial<INews>): Promise<INews | null> => {
  return await NewsModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean()
}

/**
 * Delete a news article by its ID.
 */
export const deleteNews = async (id: string): Promise<INews | null> => {
  return await NewsModel.findByIdAndDelete(id)
}

/**
 * Check if a news article exists by title.
 */
export const newsExists = async (title: string): Promise<boolean> => {
  const result = await NewsModel.exists({ title })
  return result !== null
}
