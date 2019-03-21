import { hacker, helpers, internet, random, lorem } from 'faker';

import Game from '../models/Game';
import { Index } from 'typeorm';

interface IObjective {
    id: number;
    description: string;
    isBonus: boolean;
}

interface IVote {
    name: string;
    votes: number;
}

export default class GameFactory {
    public static default(): Game {
        const game = new Game();

        game.season = random.number({ min: 1, max: 3 });
        game.mode = helpers.randomize(['Classic', 'Zen Garden', 'Blitz']);
        game.videoUrl = internet.url();
        game.storage = {
            mode: game.mode,
            title: hacker.noun(),
            objectives: GameFactory.createObjectives(5),
            players: {
                0: {
                    id: 0,
                    username: helpers.userCard().username,
                    team: 0,
                },
                1: {
                    id: 1,
                    description: helpers.userCard().username,
                    team: 1,
                },
            },
            teams: {
                0: {
                    id: 0,
                    name: 'blue',
                    objectives: GameFactory.completedObjectives(5),
                    votes: GameFactory.createVotes(),
                },
                1: {
                    id: 1,
                    name: 'red',
                    objectives: GameFactory.completedObjectives(5),
                    votes: GameFactory.createVotes(),
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

    public static createObjectives(objectivesAmt: number) {
        const objectives: any = {};

        for (let i = 0; i <= objectivesAmt; i++) {
            const objective: IObjective = {
                id: i,
                description: lorem.sentence(),
                isBonus: false,
            };

            if (i === objectivesAmt) {
                objective.isBonus = true;
            }

            objectives[i] = objective;
        }

        return objectives;
    }

    public static completedObjectives(objectivesAmt: number) {
        const objectives: any = {};

        for (let i = 0; i <= objectivesAmt; i++) {
            objectives[i] = helpers.randomize(['incomplete', 'complete']);
        }

        return objectives;
    }

    public static createVotes() {
        const votes: any = {};
        const phases = ['ui', 'ux'];

        for (const phase of phases) {
            const vote: IVote = {
                name: phase,
                votes: random.number({ min: 0, max: 100 }),
            };

            votes[phases.indexOf(phase)] = vote;
        }

        return votes;
    }
}
