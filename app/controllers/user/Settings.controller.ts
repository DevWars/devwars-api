import {Request, Response} from 'express';

import {UserRepository} from '../../repository';
import {ISettingsChangeRequest} from '../../request/ISetttingsChangeRequest';

export class SettingsController {
    /**
     * @api {post} /user/:user/settings Update a user's settings
     * @apiVersion 1.0.0
     * @apiName all
     * @apiGroup User
     *
     * @apiParam {Number} User ID
     *
     * @apiSuccess {User} .root Updated user
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "id": 1,
     *       "createdAt": "2018-10-21T21:45:45.000Z",
     *       "updatedAt": "2018-10-21T21:45:45.000Z",
     *       "email": "test@test.com"
     *       "username": "testuser",
     *       "password": "$2b$04$4OyBt68kkT5FyN/AFhye0OSH/fgR5MG8QlcJvT.4iSHCbsiVigXO.",
     *       "role": "PENDING",
     *       "token": "wmzqzhz8zzhrngipmmqqbb0229m9egiz",
     *       "avatarUrl": null,
     *       "analytics": null,
     *       "profile": { about: null, forHire: null, location: null, websiteUrl: null },
     *       "statistics": { coins: 0, xp: 0 }
     *     }
     */

    public static async update(request: Request, response: Response) {
        const settings = request.body as ISettingsChangeRequest;

        const user = await UserRepository.byId(request.params.user);

        const conflictingUser = await UserRepository.byUsername(settings.username);

        if (conflictingUser && conflictingUser.id !== user.id) {
            return response.status(409).json({
                message: 'Username already taken',
            });
        }

        user.username = settings.username;
        user.profile.about = settings.about;
        user.profile.forHire = settings.forHire;
        user.profile.location = settings.location;
        user.profile.websiteUrl = settings.websiteUrl;

        await user.save();

        response.json(user);
    }
}
