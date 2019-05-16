import { EntityRepository, Repository } from 'typeorm';
import GameApplication from '../models/GameApplication';
import User from '../models/User';

@EntityRepository(GameApplication)
export default class GameApplicationRepository extends Repository<GameApplication> {
    public findByUser(user: User): Promise<GameApplication[]> {
        return GameApplication.find({ where: { user }, relations: ['schedule'] });
    }
}
