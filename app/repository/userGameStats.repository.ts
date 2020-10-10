import { EntityRepository, Repository } from 'typeorm';

import UserGameStats from '../models/userGameStats.model';

@EntityRepository(UserGameStats)
export default class UserGameStatsRepository extends Repository<UserGameStats> {
    /**
     * Marks all the users within the given list as having a additional loss on
     * there record.
     * @param losers The list of user id's which will be marked as a loss.
     */
    public async incrementUsersLosesByIds(losers: number[]): Promise<void> {
        await this.createQueryBuilder()
            .leftJoinAndSelect('user', 'user')
            .update(UserGameStats)
            .set({ loses: () => 'loses + 1' })
            .where('user IN (:...users)', { users: losers })
            .execute();
    }

    /**
     * Marks all the users within the given list as having a additional win on
     * there record.
     * @param winners The list of user id's which will be marked as a win.
     */
    public async incrementUsersWinsByIds(winners: number[]): Promise<void> {
        await this.createQueryBuilder()
            .leftJoinAndSelect('user', 'user')
            .update(UserGameStats)
            .set({ wins: () => 'wins + 1' })
            .where('user IN (:...users)', { users: winners })
            .execute();
    }
}
