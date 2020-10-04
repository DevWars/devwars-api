import { EntityRepository, In, Repository } from 'typeorm';
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
        await this.increment({ user: In(losers.map((e) => e.id)) }, 'loses', 1);
    }

    /**
     * Marks all the users within the given list as having a additional win on
     * there record.
     * @param winners The list of user id's which will be marked as a win.
     */
    public async incrementUsersWinsByIds(winners: User[]): Promise<void> {
        await this.increment({ user: In(winners.map((e) => e.id)) }, 'wins', 1);
    }
}
