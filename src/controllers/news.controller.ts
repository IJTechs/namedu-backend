import { NextFunction, Request, Response } from 'express'

import { StatusCode } from '../enums/status-code'
import { asyncHandler } from '../middlewares/async-handler.middleware'
import {
  createAndPostNewsService,
  getAllNewsService,
  getNewsByIdService,
  updateAndEditTelegramNews,
  deleteNewsAndRemoveTelegram,
} from '../services/news.service'
import AppError from '../utils/app-error'
import { uploadImageToCloudinary } from '../utils/cloud/cloudinary'
import upload from '../utils/cloud/image-upload'

/**
 * Upload image middleware.
 */
export const uploadImage = upload.array('images', 5)

/**
 * Create news controller - Post to website and Telegram channel.
 */
export const createNewsController = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
    return next(new AppError('Please upload at least one image', 400))
  }

  try {
    const uploadedImages = await Promise.all(
      (req.files as Express.Multer.File[]).map(async (file) => {
        return await uploadImageToCloudinary(file.path)
      })
    )

    const newsData = {
      title: req.body.title,
      content: req.body.content,
      readTime: req.body.readTime,
      author: req.user?._id,
      images: uploadedImages,
    }
    const news = await createAndPostNewsService(newsData)
    res.status(StatusCode.Created).json({ message: 'News posted successfully', news })
  } catch (error) {
    console.log('Error creating news:', error)
    next(new AppError(`Error while creating news`, 500))
  }
}

/**
 * Get all news controller.
 */
export const getAllNewsController = asyncHandler(async (_req: Request, res: Response) => {
  const news = await getAllNewsService()
  res.status(StatusCode.OK).json({
    count: news.length,
    news,
  })
})

/**
 * Get single news by ID controller.
 */
export const getNewsByIdController = asyncHandler(async (req: Request, res: Response) => {
  const news = await getNewsByIdService(req.params.id)
  res.status(StatusCode.OK).json(news)
})

/**
 * Update news controller.
 */
export const updateNewsController = asyncHandler(async (req: Request, res: Response) => {
  try {
    let uploadedImages: string[] = []

    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      uploadedImages = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          return await uploadImageToCloudinary(file.path)
        })
      )
    }

    const updatedData = {
      title: req.body.title,
      content: req.body.content,
      readTime: req.body.readTime,
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
    }

    const updatedNews = await updateAndEditTelegramNews(req.params.id, updatedData)

    res.status(StatusCode.OK).json({
      message: 'News updated successfully, and Telegram message edited!',
      updatedNews,
    })
  } catch (error) {
    console.error('Error updating news:', error)
    res.status(StatusCode.InternalServerError).json({ message: 'Error updating news' })
  }
})

/**
 * Delete news controller.
 */
export const deleteNewsController = asyncHandler(async (req: Request, res: Response) => {
  await deleteNewsAndRemoveTelegram(req.params.id)
  res
    .status(StatusCode.OK)
    .json({ message: 'News deleted successfully from the site and Telegram' })
})
