import { EntityRepository, Repository } from 'typeorm';
import Game from '../models/Game';

@EntityRepository(Game)
export default class GameRepository extends Repository<Game> {
    public latest(): Promise<Game> {
        return Game.findOne({ order: { createdAt: 'DESC' } });
    }

    public findAllBySeason(season: number): Promise<Game[]> {
        return Game.find({ where: { season } });
    }

    public findByPlayer(player: object): Promise<Game> {
        return Game.findOne({ where: { players: player } });
    }
}
