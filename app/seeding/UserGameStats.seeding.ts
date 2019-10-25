import { random } from 'faker';
import UserGameStats from '../models/UserGameStats';

export default class UserGameStatsSeeding {
    public static default(): UserGameStats {
        const stats = new UserGameStats();

        stats.wins = random.number({ min: 1, max: 20 });
        stats.loses = random.number({ min: 1, max: 20 });

        return stats;
    }
}
