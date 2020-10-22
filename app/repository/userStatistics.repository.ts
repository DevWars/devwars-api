import { EntityRepository, Repository } from 'typeorm';
import { isNil } from 'lodash';

import UserStats from '../models/userStats.model';
import User from '../models/user.model';
import { BadgeService } from '../services/badge.service';
import { BADGES } from '../constants';

@EntityRepository(UserStats)
export default class UserStatisticsRepository extends Repository<UserStats> {
    /**
     * Updates a given users coins by the provided amount (plus or negative)
     * @param user The user who's coin count is going to be updated.
     * @param amount The amount the coins are going to be updated by.
     */
    public async updateCoinsForUser(user: User, amount: number) {
        if (!isFinite(amount)) return;

        const userStats = await this.findOne({ where: { user } });
        if (isNil(userStats)) return;

        // Since the updating amount could be negative and we don't want to
        // allow having a total amount of negative coins, if the new total coins
        // is less than zero, set the coins to zero (otherwise the result).
        userStats.coins = Math.max(0, userStats.coins + amount);
        await userStats.save();

        // award badges for coins if the user has met the given coins range.
        switch (userStats.coins) {
            case 5000:
                await BadgeService.awardBadgeToUserById(user, BADGES.DEVWARS_COINS_5000);
                break;
            case 25000:
                await BadgeService.awardBadgeToUserById(user, BADGES.DEVWARS_COINS_25000);
                break;
        }
    }

    /**
     * Increase the given amount of users total experience by the specified amount.
     * @param amount The amount of experience increasing by.
     * @param users The users gaining the experience.
     */
    public async increaseExperienceForUsers(amount: number, users: User[]) {
        if (!isFinite(amount) || users.length <= 0) return;

        await this.createQueryBuilder()
            .leftJoinAndSelect('user', 'user')
            .update(UserStats)
            .set({ xp: () => `xp + ${amount}` })
            .where('user IN (:...users)', { users: users.map((e) => e.id) })
            .execute();
    }

    /**
     * Decrease the given amount of users total experience by the specified
     * amount.
     *
     * Note: This will ensure that the total amount of experience does not go
     * lower than zero.
     *
     * @param amount The amount of experience increasing by.
     * @param users The users gaining the experience.
     */
    public async decreaseExperienceForUsers(amount: number, users: User[]) {
        if (!isFinite(amount) || users.length <= 0) return;

        await this.createQueryBuilder()
            .leftJoinAndSelect('user', 'user')
            .update(UserStats)
            .set({ xp: () => `GREATEST(0, xp + ${amount})` })
            .where('user IN (:...users)', { users: users.map((e) => e.id) })
            .execute();
    }
}
