import { NextFunction, Request, Response } from 'express';
import { getCustomRepository } from 'typeorm';
import { isNil } from 'lodash';

import { IUserRequest } from '../request/IRequest';
import EmailRepository from '../repository/EmailOptIn.repository';
import { IUpdateEmailPermissionRequest } from '../request/IUpdateEmailPermissionRequest';
import EmailOptIn from '../models/EmailOptIn';
import ApiError from '../utils/apiError';

/**
 * @api {get} /users/:user/emails/permissions Gather user related email permissions
 * @apiVersion 1.0.0
 * @apiName GatherUserRelatedEmailPermissions
 * @apiGroup Emails
 *
 * @apiParam {number} user The id of the user.
 *
 * @apiSuccess {EmailOptIn} Permissions The current email permissions for the given user.
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * {
 *   "news": true,
 *   "gameApplications": true,
 *   "schedules": true,
 *   "linkedAccounts": true,
 *   "id": 1,
 *   "updatedAt": "2019-11-23T17:30:25.884Z",
 *   "createdAt": "2019-11-23T17:02:58.886Z"
 *  }
 *
 * @apiError EmailPermissionsDontExist No user email permissions exist for the given user.
 */
export async function gatherEmailPermissions(request: IUserRequest, response: Response, next: NextFunction) {
    const emailOptInRepository = getCustomRepository(EmailRepository);
    const permissions = await emailOptInRepository.getEmailOptInPermissionForUser(request.boundUser);

    if (isNil(permissions)) {
        throw new ApiError({
            error: `No email permission exist for the given user, ${request.boundUser.username}`,
            code: 404,
        });
    }

    return response.json(permissions);
}

/**
 * @api {patch} /users/:user/emails/permissions Update user related email permissions
 * @apiVersion 1.0.0
 * @apiName UpdateUserRelatedEmailPermissions
 * @apiGroup Emails
 *
 * @apiParam {Number} user Users unique ID.
 * @apiParam {string} [news] If the user is allowing news emails.
 * @apiParam {string} [gameApplications] If the user is allowing game application emails.
 * @apiParam {string} [schedules] If the user is allowing schedule emails.
 * @apiParam {string} [linkedAccounts] If the user is allowing linked account emails.
 *
 * @apiParamExample {json} Request-Example:
 *     {
 *      "news": true,
 *      "gameApplications": false
 *     }
 *
 * @apiSuccess {EmailOptIn} Permissions The current email permissions for the given user after being updated.
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * {
 *   "news": true,
 *   "gameApplications": true,
 *   "schedules": true,
 *   "linkedAccounts": true,
 *   "id": 1,
 *   "updatedAt": "2019-11-23T17:30:25.884Z",
 *   "createdAt": "2019-11-23T17:02:58.886Z"
 *  }
 *
 * @apiError EmailPermissionsDontExist No user email permissions exist for the given user.
 */
export async function updateEmailPermissions(request: IUserRequest, response: Response, next: NextFunction) {
    const emailOptInRepository = getCustomRepository(EmailRepository);
    const permissions: any = await emailOptInRepository.getEmailOptInPermissionForUser(request.boundUser);

    const emailUpdate: IUpdateEmailPermissionRequest = request.body;

    if (isNil(permissions)) {
        throw new ApiError({
            error: `No email permission exist for the given user, ${request.boundUser.username}`,
            code: 404,
        });
    }

    for (const key of Object.keys(permissions)) {
        if (!isNil(emailUpdate[key])) {
            permissions[key] = emailUpdate[key];
        }
    }

    await (permissions as EmailOptIn).save();
    return response.json(permissions);
}
