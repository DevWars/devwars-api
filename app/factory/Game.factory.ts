import { hacker, helpers, internet, random, lorem } from 'faker';

import Game from '../models/Game';

export default class GameFactory {
    public static default(): Game {
        const game = new Game();

        game.season = random.number({ min: 1, max: 3 });
        game.mode = helpers.randomize(['Classic', 'Zen Garden', 'Blitz']);
        game.videoUrl = internet.url();
        game.storage = {
            mode: game.mode,
            title: hacker.noun(),
            objectives: {
                0: {
                    description: lorem.sentence(),
                    isBonus: random.boolean(),
                },
                1: {
                    description: lorem.sentence(),
                    isBonus: random.boolean(),
                },
            },
            players: {
                0: {
                    username: helpers.userCard().username,
                    team: 0,
                },
                1: {
                    description: helpers.userCard().username,
                    team: 1,
                },
            },
        };

        return game;
    }

    public static withSeason(season: number): Game {
        const game = this.default();

        game.season = season;

        return game;
    }
}
