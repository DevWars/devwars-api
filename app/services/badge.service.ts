import { getCustomRepository } from 'typeorm';
import * as _ from 'lodash';

import Badge from '../models/badge.model';
import User from '../models/user.model';
import UserBadges from '../models/userBadges.model';
import BadgeRepository from '../repository/badge.repository';
import UserBadgesRepository from '../repository/userBadges.repository';

export class BadgeService {
    /**
     * Returns true if and only if the badge has already been assigned.
     *
     * @param user The user who could own the badge.
     * @param badge The badge that might be owned.
     */
    public static async checkUserOwnsBadge(user: User, badge: Badge): Promise<boolean> {
        const userBadgesRepository = getCustomRepository(UserBadgesRepository);
        const exists = await userBadgesRepository.count({ where: { user, badge } });
        return exists >= 1;
    }

    /**
     * Award a badge to a given user.
     *
     * @param user The user getting the badge
     * @param badge The badge being awarded.
     */
    public static async awardBadgeToUser(user: User, badge: Badge) {
        if (await this.checkUserOwnsBadge(user, badge)) return;

        const userBadgesRepository = getCustomRepository(UserBadgesRepository);
        await userBadgesRepository.insert(new UserBadges(user, badge));
    }

    /**
     * Award a badge to a given user by the badge id..
     *
     * @param user The user getting the badge
     * @param badgeId The id of the badge being awarded.
     */
    public static async awardBadgeToUserById(user: User, badgeId: number) {
        const badge = await getCustomRepository(BadgeRepository).findOne(badgeId);

        if (_.isNil(badge)) return;

        return this.awardBadgeToUser(user, badge);
    }
}
