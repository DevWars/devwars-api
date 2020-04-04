import { EntityRepository, Repository } from 'typeorm';
import { isNil } from 'lodash';

import GameApplication from '../models/GameApplication';
import GameSchedule from '../models/GameSchedule';
import User from '../models/User';

@EntityRepository(GameApplication)
export default class GameApplicationRepository extends Repository<GameApplication> {
    public findByUser(user: User): Promise<GameApplication[]> {
        return this.find({ where: { user }, relations: ['schedule'] });
    }

    public async existsByUserAndSchedule(user: User, schedule: GameSchedule): Promise<boolean> {
        const found = await this.findOne({
            where: { user, schedule },
            relations: ['schedule', 'user'],
            select: ['id'],
        });

        return !isNil(found);
    }

    public findByUserAndSchedule(user: User, schedule: GameSchedule): Promise<GameApplication> {
        return this.findOne({ where: { user, schedule }, relations: ['schedule', 'user'] });
    }

    /**
     * Returns a range of the game applications for a given game based on the game schedule.
     * @param schedule The gameSchedule that will be used to find the applications.
     * @param relations The additional relations on the game application object to expand.
     */
    public async findBySchedule(schedule: GameSchedule, relations: string[] = []): Promise<GameApplication[]> {
        return this.find({
            where: {
                schedule,
            },
            relations,
        });
    }
}
