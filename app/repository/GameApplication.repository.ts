import { EntityRepository, Repository } from 'typeorm';

import GameApplication from '../models/GameApplication';
import GameSchedule from '../models/GameSchedule';
import User from '../models/User';

@EntityRepository(GameApplication)
export default class GameApplicationRepository extends Repository<GameApplication> {
    public findByUser(user: User): Promise<GameApplication[]> {
        return GameApplication.find({ where: { user }, relations: ['schedule'] });
    }

    public findByUserAndSchedule(user: User, schedule: GameSchedule): Promise<GameApplication> {
        return GameApplication.findOne({ where: { user, schedule }, relations: ['schedule', 'user'] });
    }
}
