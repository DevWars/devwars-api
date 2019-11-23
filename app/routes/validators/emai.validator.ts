import * as Joi from '@hapi/joi';
export const emailPermissionSchema = Joi.object().keys({
    news: Joi.boolean()
        .strict()
        .optional(),

    gameApplications: Joi.boolean()
        .strict()
        .optional(),

    schedules: Joi.boolean()
        .strict()
        .optional(),

    linkedAccounts: Joi.boolean()
        .strict()
        .optional(),
});
