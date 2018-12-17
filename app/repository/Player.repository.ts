import {GameTeam, Player} from "../models";

export class PlayerRepository {

    public static forTeam(team: GameTeam): Promise<Player[]> {
        return Player.find({where: {team}});
    }
}
