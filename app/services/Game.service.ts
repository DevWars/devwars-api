import {Game, GameStatus, GameTeam} from "../models";

export default class GameService {

    public static async all() {
        return [
            {
                name: "Zen Garden",
            },
            {
                name: "Classic",
            },
            {
                name: "Blitz",
            },
        ];
    }

    public static async endGame(game: Game, winner: GameTeam) {
        // Mark the game as inactive
        game.active = false;

        // Set the display status to "Ended"
        game.status = GameStatus.ENDED;

        await game.save();

        for (const team of game.teams) {
            team.winner = team.id === winner.id;

            for (const player of team.players) {
                player.user.statistics.wins++;

                await player.save();
            }
        }
    }
}
