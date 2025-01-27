import cloudinary from 'cloudinary'

import { config } from '../../config/environments.config'

cloudinary.v2.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
})

export const uploadImageToCloudinary = async (filePath: string): Promise<string> => {
  try {
    const result = await cloudinary.v2.uploader.upload(filePath, {
      folder: 'news_images',
    })
    return result.secure_url
  } catch (error) {
    console.error('Cloudinary upload failed:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}
