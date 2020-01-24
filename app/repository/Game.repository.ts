import { EntityRepository, Repository } from 'typeorm';
import Game from '../models/Game';
import { GameStatus } from '../models/GameSchedule';

@EntityRepository(Game)
export default class GameRepository extends Repository<Game> {
    public latest(): Promise<Game> {
        return this.findOne({ order: { createdAt: 'DESC' } });
    }

    public active(): Promise<Game> {
        return this.findOne({ where: { status: GameStatus.ACTIVE } });
    }

    public findAllBySeason(season: number): Promise<Game[]> {
        return this.find({ where: { season }, order: { createdAt: 'DESC' } });
    }
}
