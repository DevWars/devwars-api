import { EntityRepository, In, Repository } from 'typeorm';
import { isNil } from 'lodash';

import UserStats from '../models/userStats.model';
import User from '../models/user.model';

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
    }

    /**
     * Increase the given amount of users total experience by the specified amount.
     * @param amount The amount of experience increasing by.
     * @param users The users gaining the experience.
     */
    public async increaseExperienceForUsers(amount: number, users: User[]) {
        if (!isFinite(amount) || users.length <= 0) return;

        await this.increment({ user: In(users.map((e) => e.id)) }, 'xp', amount);
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

        await this.manager.transaction(async (entityManger) => {
            const statistics = await entityManger.find(UserStats, { where: { user: In(users.map((e) => e.id)) } });

            for (const statistic of statistics) {
                // Since the updating amount could be negative and we don't want
                // to allow having a total amount of negative xp, if the new
                // total is less than zero, set the to zero.
                statistic.xp = Math.max(0, statistic.xp + amount);
                await statistic.save();
            }
        });
    }
}
