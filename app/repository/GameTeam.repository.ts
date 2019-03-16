import {Game, GameTeam} from '../models';

export class GameTeamRepository {

    public static byId(id: number): Promise<GameTeam> {
        return GameTeam.findOne(id);
    }

    public static forGame(game: Game): Promise<GameTeam[]> {
        return GameTeam.find({where: {game}});
    }

    public static forGameAndTeamName(game: Game, name: string): Promise<GameTeam> {
        return GameTeam.findOne({where: {game, name}});
    }
}
