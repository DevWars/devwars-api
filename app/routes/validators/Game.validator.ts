const { check } = require('express-validator/check');
const Joi = require('@hapi/joi');

export const createValidator = [
    check('season')
        .exists()
        .isInt()
]