import { EntityRepository, Repository } from 'typeorm';
import Game from '../models/Game';

@EntityRepository(Game)
export default class GameRepository extends Repository<Game> {
    public findAllBySeason(season: number): Promise<Game[]> {
        return Game.find({ where: { season } });
    }
}
