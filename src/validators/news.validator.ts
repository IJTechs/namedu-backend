import Joi from 'joi'

// Schema for creating and updating news
export const newsSchema = Joi.object({
  title: Joi.string().min(5).max(300).trim().required().messages({
    'string.base': 'Title must be a string.',
    'string.empty': 'Title cannot be empty.',
    'string.min': 'Title should have at least 5 characters.',
    'string.max': 'Title should not exceed 300 characters.',
    'any.required': 'Title is required.',
  }),

  content: Joi.string().min(5).trim().required().messages({
    'string.base': 'Content must be a string.',
    'string.empty': 'Content cannot be empty.',
    'string.min': 'Content should have at least 5 characters.',
    'any.required': 'Content is required.',
  }),

  readTime: Joi.number().positive().integer().messages({
    'number.base': 'Read time must be a number.',
    'number.positive': 'Read time must be a positive number.',
    'number.integer': 'Read time must be an integer.',
  }),

  author: Joi.string().messages({
    'string.base': 'Author ID must be a ObjectId.',
  }),

  images: Joi.string().uri().messages({
    'string.uri': 'Image must be a valid URL.',
  }),
})
