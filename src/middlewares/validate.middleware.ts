import { Request, Response, NextFunction } from 'express'
import Joi, { ObjectSchema } from 'joi'

/**
 * Middleware to validate incoming requests using Joi.
 * @param schema - Joi schema to validate against.
 */
export const validateRequest = (schema: ObjectSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.validateAsync(req.body, {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true,
      })
      next()
    } catch (error: any) {
      res.status(400).json({
        message: 'Validation error',
        errors: error.details.map((e: Joi.ValidationErrorItem) => e.message),
      })
    }
  }
}
