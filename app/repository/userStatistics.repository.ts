import { EntityRepository, Repository } from 'typeorm';
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

        userStats.coins += amount;
        await userStats.save();
    }
}
