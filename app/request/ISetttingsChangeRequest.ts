import * as Joi from 'joi';

export interface ISettingsChangeRequest {
    username: string;
    location: string;
    about: string;
    websiteUrl: string;

    forHire: boolean;
}

export const SettingsChangeRequestValidator = Joi.object().keys({
    about: Joi.string().allow('', null),
    forHire: Joi.bool().required(),
    location: Joi.string().allow('', null),
    username: Joi.string().allow('', null),
    websiteUrl: Joi.string().uri().allow('', null),
});
