import { EntityRepository, In, Repository } from 'typeorm';

import UserGameStats from '../models/userGameStats.model';

@EntityRepository(UserGameStats)
export default class UserGameStatsRepository extends Repository<UserGameStats> {
    /**
     * Marks all the users within the given list as having a additional loss on
     * there record.
     * @param losers The list of user id's which will be marked as a loss.
     */
    public async incrementUsersLosesByIds(losers: number[]): Promise<void> {
        await this.increment({ user: In(losers) }, 'loses', 1);
    }

    /**
     * Marks all the users within the given list as having a additional win on
     * there record.
     * @param winners The list of user id's which will be marked as a win.
     */
    public async incrementUsersWinsByIds(winners: number[]): Promise<void> {
        await this.increment({ user: In(winners) }, 'wins', 1);
    }
}
