import { check } from 'express-validator/check';
const Joi = require('@hapi/joi');

const objectiveSchema = Joi.object().keys({
    id: Joi.number().required(),
    description: Joi.string().required(),
    isBonus: Joi.boolean().required(),
});

export const createValidator = [
    check('title')
        .isString()
        .optional(),
    check('startTime')
        .exists()
        .custom((value: any) => {
            let check = new Date(value);
            if (typeof check.getMonth !== 'function') {
                throw new Error('the startTime must be date format');
            }
            return true;
        }),
    check('mode')
        .exists()
        .isIn(['Classic', 'Zen Garden', 'Blitz']),
    check('objectives')
        .optional()
        .custom((objectives: any) => {
            if (typeof objectives !== 'object') throw new Error('objectives must be an object');

            // if any errors find
            for (let obj in objectives) {
                if (Joi.validate(objectives[obj], objectiveSchema).error) {
                    throw new Error('objectives dont have the good template');
                }
            }

            return true;
        }),
];

export const updateValidator = [
    check('title')
        .optional()
        .isString(),
    check('startTime')
        .optional()
        .custom((value: any) => {
            let check = new Date(value);
            if (typeof check.getMonth !== 'function') {
                throw new Error('the startTime must be date format');
            }
            return true;
        }),
    check('objectives')
        .optional()
        .custom((objectives: any) => {
            if (typeof objectives !== 'object') throw new Error('objectives must be an object');

            // if any errors find
            for (let obj in objectives) {
                if (Joi.validate(objectives[obj], objectiveSchema).error) {
                    throw new Error('objectives dont have the good template');
                }
            }

            return true;
        }),
];
