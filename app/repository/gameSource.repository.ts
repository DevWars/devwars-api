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
     * Gets all the sources for the given game that came from the specified team.
     *
     * @param game The game which owns the sources.
     * @param team THe id of the team.
     */
    public findByGameAndTeam(game: Game, team: number | number): Promise<GameSource[]> {
        return this.find({ where: { game, team } });
    }

    /**
     * Returns true if and only if the source exists for the given team, game and file.
     *
     * @param game The game which owns the sources.
     * @param team THe id of the team.
     * @param file The selected game file of the team.
     */
    public async existsByTeamAndFile(game: Game, team: number | number, file: string): Promise<boolean> {
        const exists = await this.count({ where: { game, team, file } });
        return exists >= 1;
    }

    /**
     * Gets all the sources for the given game that came from the specified language and team.
     *
     * @param game The game which owns the sources.
     * @param team THe id of the team.
     * @param file The selected game file of the team.
     */
    public findByGameTeamAndFile(game: Game, team: number | number, file: string): Promise<GameSource> {
        return this.findOne({ where: { game, team, file } });
    }

    /**
     * Get all the related games source code.
     * @param game The game which owns the sources.
     */
    public async deleteByGame(game: Game) {
        await this.delete({ game });
    }
}
