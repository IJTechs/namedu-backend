import Joi from 'joi'

/**
 * Validation schema for admin registration.
 */
export const adminRegisterSchema = Joi.object({
  full_name: Joi.string().min(3).max(50).trim().required(),
  username: Joi.string().min(3).max(30).trim().required(),
  password: Joi.string().min(6).trim().required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required(),
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN').default('ADMIN'),
})

/**
 * Validation schema for updating admin details.
 */
export const updateAdminSchema = Joi.object({
  full_name: Joi.string().min(3).max(50).trim(),
  username: Joi.string().min(3).max(30).trim(),
})

/**
 * Validation schema for changing password.
 */
export const changePasswordSchema = Joi.object({
  old_password: Joi.string().trim().required(),
  new_password: Joi.string().min(6).trim().required(),
})

/**
 * Validation schema for admin role update.
 */
export const updateRoleSchema = Joi.object({
  role: Joi.string().valid('SUPER_ADMIN', 'ADMIN').required().messages({
    'any.only': 'Invalid role provided.',
    'any.required': 'Role is required.',
    'string.empty': 'Role cannot be empty.',
  }),
})
