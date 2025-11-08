const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8)
        .max(128)
        .pattern(/[a-z]/, 'lowercase letter')
        .pattern(/[A-Z]/, 'uppercase letter')
        .pattern(/\d/, 'digit')
        .pattern(/[^\w\s]/, 'symbol')
        .pattern(/^\S+$/, 'no spaces')
        .messages({
            'string.base': 'Password must be a string',
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least {#limit} characters',
            'string.max': 'Password must be at most {#limit} characters',
            'string.pattern.name': 'Password must include at least one {#name}',
            'string.pattern.base': 'Password is invalid',
        }).required(),
  captcha: Joi.string().required(),
});

const sendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  captcha: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(4).pattern(/^[0-9]+$/).required(),
  captcha: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  userId: Joi.number().required(),
  newPassword: Joi.string().min(8)
        .max(128)
        .pattern(/[a-z]/, 'lowercase letter')
        .pattern(/[A-Z]/, 'uppercase letter')
        .pattern(/\d/, 'digit')
        .pattern(/[^\w\s]/, 'symbol')
        .pattern(/^\S+$/, 'no spaces')
        .messages({
            'string.base': 'Password must be a string',
            'string.empty': 'Password is required',
            'string.min': 'Password must be at least {#limit} characters',
            'string.max': 'Password must be at most {#limit} characters',
            'string.pattern.name': 'Password must include at least one {#name}',
            'string.pattern.base': 'Password is invalid',
        }).required(),
   captcha: Joi.string().required(),
});

module.exports = {
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  resetPasswordSchema,
};
