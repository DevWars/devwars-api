import { getCustomRepository, In } from 'typeorm';
import { Request, Response } from 'express';

import UserBadgesRepository from '../repository/userBadges.repository';
import BadgeRepository from '../repository/badge.repository';
import { UserRequest } from '../request/requests';

/**
 * @api {get} users/:user/badges Get the users assigned badges.
 * @apiName GetUserAssignedBadges
 * @apiGroup Badges
 * @apiPermission moderator, owner
 *
 * @apiSuccess {string} name The name of the badge.
 * @apiSuccess {string} description The description of the badge.
 * @apiSuccess {number} awardingExperience The awarded experience from the badge.
 * @apiSuccess {number} awardingCoins The amount of coins awarded.
 * @apiSuccess {number} variant The id of the variant of the badge.
 * @apiSuccess {number} id The id of the badge.
 * @apiSuccess {Date} createdAt Time created
 * @apiSuccess {Date} updatedAt Time updated
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * [
 *     {
 *         "name": "Authentic",
 *         "description": "Verify your e-mail address",
 *         "awardingExperience": 0,
 *         "awardingCoins": 500,
 *         "variant": 0,
 *         "id": 1,
 *         "updatedAt": "2020-10-18T10:34:40.046Z",
 *         "createdAt": "2020-10-18T10:34:40.046Z"
 *     }
 * ]
 */
export async function gatherUserBadgeById(request: UserRequest, response: Response) {
    const userBadgesRepository = getCustomRepository(UserBadgesRepository);

    const badges = await userBadgesRepository.find({ where: { user: request.boundUser }, relations: ['badge'] });
    const usersBadges = badges.map((e) => e.badge);

    return response.json(usersBadges);
}

/**
 * @api {get} /badges Get the current list of possible badges.
 * @apiName GetUserPossibleBadges
 * @apiGroup Badges
 * @apiPermission
 *
 * @apiSuccess {string} name The name of the badge.
 * @apiSuccess {string} description The description of the badge.
 * @apiSuccess {number} awardingExperience The awarded experience from the badge.
 * @apiSuccess {number} awardingCoins The amount of coins awarded.
 * @apiSuccess {number} variant The id of the variant of the badge.
 * @apiSuccess {number} id The id of the badge.
 * @apiSuccess {Date} createdAt Time created
 * @apiSuccess {Date} updatedAt Time updated
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 * [
 *     {
 *         "name": "Authentic",
 *         "description": "Verify your e-mail address",
 *         "awardingExperience": 0,
 *         "awardingCoins": 500,
 *         "variant": 0,
 *         "id": 1,
 *         "updatedAt": "2020-10-18T10:34:40.046Z",
 *         "createdAt": "2020-10-18T10:34:40.046Z"
 *     }
 * ]
 */
export async function getAllCurrentBadges(request: Request, response: Response) {
    const badgeRepository = getCustomRepository(BadgeRepository);

    // Since only some of the badges have been implemented, only gather the once
    // that have been and ignore the rest, this list will grow over time.
    const badges = await badgeRepository.find({ where: { id: In([1, 2, 4, 5, 17, 18, 19, 20]) } });
    return response.json(badges);
}
