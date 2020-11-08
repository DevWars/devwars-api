import { EntityRepository, Repository } from 'typeorm';
import User from '../models/user.model';

import UserGameStats from '../models/userGameStats.model';

@EntityRepository(UserGameStats)
export default class UserGameStatsRepository extends Repository<UserGameStats> {
    /**
     * Marks all the users within the given list as having a additional loss on
     * there record.
     * @param losers The list of user id's which will be marked as a loss.
     */
    public async incrementUsersLosesByIds(losers: User[]): Promise<void> {
        await this.createQueryBuilder()
            .leftJoinAndSelect('user', 'user')
            .update(UserGameStats)
            .set({
                loses: () => 'loses + 1',
                winStreak: 0,
            })
            .where('user IN (:...users)', { users: losers.map((e) => e.id) })
            .execute();
    }

    /**
     * Marks all the users within the given list as having a additional win on
     * there record.
     * @param winners The list of user id's which will be marked as a win.
     */
    public async incrementUsersWinsByIds(winners: User[]): Promise<void> {
        await this.createQueryBuilder()
            .leftJoinAndSelect('user', 'user')
            .update(UserGameStats)
            .set({
                wins: () => 'wins + 1',
                winStreak: () => 'win_streak + 1',
            })
            .where('user IN (:...users)', { users: winners.map((e) => e.id) })
            .execute();
    }
}
