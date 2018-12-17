import {date, random} from "faker";

import {Game, GameTeam} from "../models";

export class GameTeamFactory {
    public static default(): GameTeam {
        const team = new GameTeam();

        Object.assign(team, {
            completedObjectives: [],
            createdAt: date.past(),
            name: random.arrayElement(["red", "blue"]),
            status: random.arrayElement(["Waiting", "Ready to play", "Setting up game"]),
            updatedAt: date.past(),
            votes: {ui: random.number(100), ux: random.number(100)},
            winner: random.boolean(),
        });

        return team;
    }

    public static withGame(game: Game): GameTeam {
        const team = this.default();

        team.game = game;

        return team;
    }

    public static defaultTeamsForGame(game: Game): GameTeam[] {
        const blue = this.withGame(game);
        const red = this.withGame(game);

        blue.name = "blue";
        red.name = "red";

        return [blue, red];
    }
}
