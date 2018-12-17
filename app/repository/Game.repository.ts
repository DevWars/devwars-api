import {Game, GameStatus} from "../models";

export class GameRepository {

    public static all(): Promise<Game[]> {
        return Game.find();
    }

    public static latest(): Promise<Game> {
        return Game.findOne({order: {startTime: "DESC"}, relations: ["teams", "objectives"]});
    }

    public static byId(id: number): Promise<Game> {
        return Game.findOne(id, {relations: ["teams", "objectives"]});
    }

    public static bySeason(season: number): Promise<Game[]> {
        return Game.find({where: {season}});
    }

    public static byStatus(status: GameStatus): Promise<Game[]> {
        return Game.find({where: {status}});
    }
}
