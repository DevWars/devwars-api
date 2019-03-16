import {Game, Objective} from '../models';

export class ObjectiveRepository {

    public static forGame(game: Game): Promise<Objective[]> {
        return Objective.find({where: {game}});
    }

}
