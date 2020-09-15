import { EntityRepository, Repository } from 'typeorm';
import Game from '../models/game.model';
import GameSource from '../models/gameSource.model';

@EntityRepository(GameSource)
export default class GameSourceRepository extends Repository<GameSource> {
    /**
     * Get all the related games source code.
     * @param game The game which owns the sources.
     */
    public findByGame(game: Game): Promise<GameSource[]> {
        return this.find({ where: { game } });
    }

    /**
     * Get all the related games source code.
     * @param game The game which owns the sources.
     */
    public async deleteByGame(game: Game) {
        await this.delete({ game });
    }
}
