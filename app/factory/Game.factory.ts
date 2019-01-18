import {date, hacker, helpers, internet, random} from "faker";

import {Game, GameStatus} from "../models";

export class GameFactory {
    public static default(): Game {
        const game = new Game();

        Object.assign(game, {
            active: random.boolean(),
            createdAt: date.past(),
            languageTemplates: [],
            name: helpers.randomize(["Classic", "Zen Garden", "Blitz"]),
            objectives: [],
            season: random.number({min: 1, max: 3}),
            startTime: date.past(),
            status: helpers.randomize([
                GameStatus.ACTIVE,
                GameStatus.ENDED,
                GameStatus.PREPARING,
                GameStatus.SCHEDULING,
            ]),
            teams: [],
            theme: hacker.noun(),
            updatedAt: date.past(),
            videoUrl: internet.url(),
        });

        return game;
    }

    public static upcoming() {
        const game = GameFactory.default();

        game.startTime = date.future();
        game.status = GameStatus.PREPARING;

        return game;
    }

    public static withSeason(season: number): Game {
        const game = this.default();

        game.season = season;

        return game;
    }

    public static withStatus(status: GameStatus): Game {
        const game = this.default();

        game.status = status;

        return game;
    }

    public static withTime(time: Date) {
        const game = this.default();

        game.startTime = time;

        return game;
    }
}
