import { getCustomRepository } from 'typeorm';
import { Response } from 'express';
import * as _ from 'lodash';

import { sendGameApplicationApplyingEmail } from '../../services/Mail.service';

import GameApplicationRepository from '../../repository/GameApplication.repository';
import LinkedAccountRepository from '../../repository/LinkedAccount.repository';

import GameApplication from '../../models/GameApplication';
import { Provider } from '../../models/LinkedAccount';

import { ScheduleRequest } from '../../request/IRequest';
import { parseStringWithDefault } from '../../../test/helpers';
import { DATABASE_MAX_ID } from '../../constants';
import ApiError from '../../utils/apiError';

/**
 * @api {post} /applications/schedule/:scheduleId/twitch?twitch_id= Applies the twitch user to the scheduled game.
 * @apiDescription Applies the twitch user to the given schedule by creating a game application. The
 * game application is return to the applying user. Containing the schedule and user. The
 * specified twitch id must link to a DevWars user for this to work.
 * @apiVersion 1.0.0
 * @apiName GameApplicationApplyByScheduleAndTwitchId
 * @apiGroup Applications
 *
 * @apiParam {number} ScheduleId The id of the schedule being applied too.
 * @apiParam {string} twitch_id The id of the twitch user applying.
 *
 * @apiSuccess {GameApplication} schedule The application of the game applied too.
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * {
 *   "schedule": {"id": 1, "updatedAt": "2019-10-04T16:10:24.334Z", "createdAt":
 *     "2019-10-04T16:10:24.334Z", "startTime": "2020-03-20T03:37:46.716Z", "status": 2, "setup":
 *     {"mode": "Classic", "title": "capacitor", "objectives": {"1": {"id": 1, "isBonus": false,
 *     "description": "Id modi itaque quisquam non ea nam animi soluta maiores."
 *         },
 *         "2": {
 *           "id": 2,
 *           "isBonus": false,
 *           "description": "Veritatis porro ducimus nam asperiores id."
 *         },
 *         "3": {
 *           "id": 3,
 *           "isBonus": false,
 *           "description": "Nihil deleniti voluptatum ea."
 *         },
 *         "4": {
 *           "id": 4,
 *           "isBonus": true,
 *           "description": "Atque fugiat cupiditate consequuntur repellendus ut."
 *         }
 *       }
 *     }
 *   },
 *   "user": {"id": 3, "updatedAt": "2019-10-04T16:10:49.974Z", "createdAt":
 *     "2019-10-04T16:10:21.748Z", "lastSignIn": "2019-10-04T16:10:49.969Z", "email":
 *     "Thora32@yahoo.com", "username": "test-user", "role": "USER", "avatarUrl":
 *     "http://lorempixel.com/640/480/city"
 *   },
 *   "id": 39, "updatedAt": "2019-10-04T16:40:01.906Z", "createdAt": "2019-10-04T16:40:01.906Z"
 * }
 *
 * @apiError ScheduleIdNotDefined Invalid schedule id provided.
 * @apiError GameApplicationAlreadyExists A game application already exists for user for schedule.
 * @apiError TwitchLinkDoesNotExist No user exists with the a linked account to twitch with the specified id.
 */
export async function applyToScheduleFromTwitch(request: ScheduleRequest, response: Response) {
    const TwitchId = parseStringWithDefault(request.query.twitch_id, null, 0, DATABASE_MAX_ID);

    const linkedAccountRepository = getCustomRepository(LinkedAccountRepository);
    const linkedAccount = await linkedAccountRepository.findByProviderAndProviderId(Provider.TWITCH, TwitchId);

    if (_.isNil(linkedAccount) || _.isNil(linkedAccount.user)) {
        throw new ApiError({
            message: 'No user exists with the a linked account to twitch with the specified id.',
            code: 400,
        });
    }

    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const exists = await gameApplicationRepository.findByUserAndGame(linkedAccount.user, request.schedule);

    if (!_.isNil(exists)) {
        throw new ApiError({
            message: 'A game application already exists for user for schedule.',
            code: 409,
        });
    }

    const application = new GameApplication(request.schedule, linkedAccount.user);
    await application.save();

    await sendGameApplicationApplyingEmail(application);
    return response.json(application);
}
