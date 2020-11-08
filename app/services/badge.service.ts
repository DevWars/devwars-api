import { getCustomRepository, In } from 'typeorm';
import * as _ from 'lodash';

import Badge from '../models/badge.model';
import User from '../models/user.model';
import UserBadges from '../models/userBadges.model';
import BadgeRepository from '../repository/badge.repository';
import UserBadgesRepository from '../repository/userBadges.repository';
import UserGameStatsRepository from '../repository/userGameStats.repository';
import { BADGES } from '../constants';

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

    /**
     * Goes through the process of assigning badges for users who are at different stages of winning
     * games. Badges for first win, 5, 10, 25.
     *
     * @param users The users who have one the recent game.
     */
    public static async assignGameWinningBadgesForUsers(users: User[]) {
        const userGameStatsRepository = getCustomRepository(UserGameStatsRepository);

        const userStats = await userGameStatsRepository.find({
            relations: ['user'],
            where: {
                user: In(users.map((e) => e.id)),
            },
        });

        const winBadges: { [index: string]: (user: User) => Promise<void> } = {
            HOT_STREAK: (user: User) => this.awardBadgeToUserById(user, BADGES.WIN_3_IN_ROW),
            1: (user: User) => this.awardBadgeToUserById(user, BADGES.WIN_FIRST_GAME),
            5: (user: User) => this.awardBadgeToUserById(user, BADGES.WIN_5_GAMES),
            10: (user: User) => this.awardBadgeToUserById(user, BADGES.WIN_10_GAMES),
            25: (user: User) => this.awardBadgeToUserById(user, BADGES.WIN_25_GAMES),
        };

        const badgesBeingAwarded: Array<Promise<void>> = [];

        for (const stats of userStats) {
            if (stats.wins === 1 && stats.loses !== 0)  continue;

            const badge = winBadges[stats.wins];

            // If the user has met any of the win related badge requirements, go and
            // distribute that badge to the user.
            if (!_.isNil(badge)) badgesBeingAwarded.push(badge(stats.user));

            // If the user is on a win streak, then go and award them the hot streak badge
            if (stats.winStreak === 3) badgesBeingAwarded.push(winBadges['HOT_STREAK'](stats.user));
        }

        return Promise.all(badgesBeingAwarded);
    }
}
