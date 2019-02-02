import {Game, GameStatus, GameTeam} from "../models";
import {GameTeamRepository, PlayerRepository} from "../repository";
import {pathValueAtPath} from "../utils/firebase";

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

        for (const team of await GameTeamRepository.forGame(game)) {
            // Mark whether or not the current team won
            team.winner = team.id === winner.id;

            for (const player of await PlayerRepository.forTeam(team)) {
                // Winners get 600 coins, losers get 200 coins
                const coins = team.winner ? 600 : 200;

                // Winners get 300 xp, losers get 50 xp
                const xp = team.winner ? 300 : 50;

                player.user.statistics.xp += xp;
                player.user.statistics.coins += coins;

                // Increment their wins / losses
                if (team.winner) {
                    player.user.statistics.wins += 1;
                } else {
                    player.user.statistics.losses += 1;
                }

                await player.user.save();
            }
        }
    }

    public static async sendGameToFirebase(game: Game) {
        const transformed = {
            id: game.id,
            name: game.name,
            objectives: game.objectives.map((objective) => ({
                description: objective.description,
                number: objective.number,
            })),
            teams: game.teams.reduce((map: any, team) => {
                map[team.name] = {
                    players: team.players.map((player) => ({
                        language: player.language,
                        user: {
                            id: player.user.id,
                            username: player.user.username,
                        },
                    })),
                    status: team.status,
                };

                return map;
            }, {}),
            templates: game.languageTemplates,
            theme: game.theme,
        };

        if (process.env.NODE_ENV !== "test") {
            await pathValueAtPath("game", transformed);
        }
    }
}
