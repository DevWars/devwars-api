import { EntityRepository, Repository } from 'typeorm';

import Leaderboard from '../models/LeaderboardView';

@EntityRepository(Leaderboard)
export default class LeaderboardRepository extends Repository<Leaderboard> {
    public async findUsers(first: number, after: number, orderBy = 'wins'): Promise<Leaderboard[]> {
        return this.find({
            skip: after,
            take: first,
            order: {
                [orderBy]: 'DESC',
            },
        });
    }
}
