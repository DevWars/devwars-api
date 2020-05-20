import { random } from 'faker';
import UserStats from '../models/userStats.model';

export default class UserStatsSeeding {
    public static default(): UserStats {
        const stats = new UserStats();

        stats.coins = random.number(20000);
        stats.xp = random.number(20000);
        stats.level = random.number({ min: 1, max: 20 });
        stats.twitchId = random.alphaNumeric(20);

        return stats;
    }
}
