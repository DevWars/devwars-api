import { random } from 'faker';
import UserStats from '../models/userStats.model';
import User from '../models/user.model';

export default class UserStatsSeeding {
    public static default(): UserStats {
        const stats = new UserStats();

        stats.coins = random.number(20000);
        stats.xp = random.number(100000);
        stats.level = random.number({ min: 1, max: 20 });

        return stats;
    }

    /**
     * User stats with a user.
     * @param user The user who owns the statistics.
     */
    public static withUser(user: User): UserStats {
        const stats = this.default();
        stats.user = user;

        return stats;
    }
}
