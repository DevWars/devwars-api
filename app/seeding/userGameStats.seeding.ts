import { random } from 'faker';
import UserGameStats from '../models/userGameStats.model';
import User from '../models/user.model';

export default class UserGameStatsSeeding {
    public static default(): UserGameStats {
        const stats = new UserGameStats();

        stats.wins = random.number({ min: 1, max: 20 });
        stats.loses = random.number({ min: 1, max: 20 });

        return stats;
    }

    /**
     * User game stats with a user.
     * @param user The user who owns the game statistics.
     */
    public static withUser(user: User): UserGameStats {
        const stats = this.default();
        stats.user = user;

        return stats;
    }
}
