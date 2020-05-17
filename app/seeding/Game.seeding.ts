import { hacker, helpers, internet, lorem, random, date } from 'faker';
import * as _ from 'lodash';

import Game, { GameMode } from '../models/Game';
import { GameStatus } from '../models/Game';
import User from '../models/User';

import { GameObjective } from '../types/common';
import logger from '../utils/logger';

export default class GameSeeding {
    /**
     * Returns a creation of the default game seeding builder.
     */
    public static default(): GameSeeding {
        return new GameSeeding();
    }

    /**
     * Creates a object of objectives that match the expected state.
     * @param num The number of objectives to be created.
     */
    private static createObjectives(num: number): { [index: string]: GameObjective } {
        const objectives: { [index: string]: GameObjective } = {};

        for (let index = 0; index < num; index++) {
            objectives[index] = {
                description: lorem.sentence(),
                isBonus: index === num,
                id: index,
            };
        }

        return objectives;
    }

    /**
     * The game that is being created.
     */
    public game: Game;

    /**
     * If players have been found or loaded to the game, this will be used for
     * when binding the editors. If no players exist, then players will be added
     * before the editors.
     */
    private playersLoaded = false;

    /**
     * If a related game schedule should be created for the given game.
     */
    private readonly shouldCreateSchedule: boolean;

    /**
     * Create a default seeded game object, that uses the builder method.
     */
    public constructor() {
        const mode = helpers.randomize(Object.values(GameMode));
        const title = hacker.noun() + hacker.noun();
        const videoUrl = helpers.randomize([undefined, internet.url()]);
        const gameStatus = helpers.randomize([GameStatus.ACTIVE, GameStatus.ENDED, GameStatus.SCHEDULED]);

        this.game = new Game(3, mode, title, videoUrl, gameStatus, date.past(2, new Date()), {
            editors: {},
            objectives: GameSeeding.createObjectives(5),
            templates: {},
            meta: {
                teamScores: {
                    '0': { id: 0, objectives: {}, bets: 0, ui: 0, ux: 0 },
                    '1': { id: 1, objectives: {}, bets: 0, ui: 0, ux: 0 },
                },
                winningTeam: null,
                tie: false,
                bets: { tie: 0 },
            },
        });
    }

    /**
     * Adds a template for the given game based on the language.
     * @param language The language of the templates being added.
     */
    public WithTemplate(language: string): GameSeeding {
        switch (language) {
            case 'js':
                this.game.storage.templates[language] = 'console.log("hit")';
                break;
            case 'css':
                this.game.storage.templates[language] = 'body { background: white; }';
                break;
            case 'html':
                this.game.storage.templates[language] = '<html><body>hi</body></html>';
                break;
        }
        return this;
    }

    /**
     * Adds all the supporting templates for the given game.
     */
    public WithTemplates(): GameSeeding {
        for (const language of ['html', 'css', 'js']) this.WithTemplate(language);
        return this;
    }

    /**
     * Marks the given mode on the given game.
     * @param mode The mode the game should be created with.
     */
    public withMode(mode: GameMode): GameSeeding {
        this.game.mode = mode;
        return this;
    }

    /**
     * Adds the given status to the game.
     * @param status The status being added to the game.
     */
    public withStatus(status: GameStatus): GameSeeding {
        this.game.status = status;
        return this;
    }

    /**
     * Adds the given season to the game.
     * @param season The season being added to the game.
     */
    public withSeason(season: number): GameSeeding {
        this.game.season = season;
        return this;
    }

    /**
     * Adds the provided players to the given game.
     * @param players Adds the given players to the given game.
     */
    public withPlayers(players: User[]): GameSeeding {
        logger.warn('withPlayer not implemented yet');
        this.playersLoaded = true;
        return this;
    }

    /**
     * Includes generated players within the game based the number (amount)
     * provided.
     * @param amount The amount of generated players to be added.
     */
    public async withGeneratedPlayers(amount = 6): Promise<GameSeeding> {
        logger.warn('withGeneratedPlayer not implemented yet');
        this.playersLoaded = true;
        return this;
    }

    /**
     * Includes editors within the game seeding process, this will generate the
     * related users if non exist or none have already been created with the
     * seeder.
     */
    public async withEditors(): Promise<GameSeeding> {
        const editors = [
            { id: 0, team: 0, language: 'html', player: 0 },
            { id: 1, team: 0, language: 'css', player: 0 },
            { id: 2, team: 0, language: 'js', player: 0 },

            { id: 3, team: 1, language: 'html', player: 0 },
            { id: 4, team: 1, language: 'css', player: 0 },
            { id: 5, team: 1, language: 'js', player: 0 },
        ];

        logger.warn('withEditors not implemented yet');
        //  this.game.storage.editors = result;

        return this;
    }

    /**
     * With generated team scores, this includes the teams votes for ui, ux and
     * tie, and the stream meta score results for both teams. This also includes
     * objective totals and tie state.
     */
    public withTeamScores(): GameSeeding {
        const objectivesForTeam = (max: number) => {
            const result: any = {};

            let count = 0;
            _.forEach(this.game.storage.objectives, (o: any) => {
                if (count !== max) {
                    result[o.id] = 'complete';
                    count += 1;
                } else {
                    result[o.id] = 'incomplete';
                }
            });

            return result;
        };

        this.game.storage.meta.teamScores[0].ui = random.number({ min: 0, max: 100 });
        this.game.storage.meta.teamScores[0].ux = random.number({ min: 0, max: 100 });

        this.game.storage.meta.teamScores[1].ui = random.number({ min: 0, max: 100 });
        this.game.storage.meta.teamScores[1].ux = random.number({ min: 0, max: 100 });

        this.game.storage.meta.winningTeam = random.number({ max: 1 });
        const numberOfObjectives = _.size(this.game.storage.objectives);

        const teamOneObjectives = random.number({ min: 0, max: numberOfObjectives });
        const teamTwoObjectives = random.number({ min: 0, max: numberOfObjectives });

        this.game.storage.meta.teamScores[0].objectives = objectivesForTeam(teamOneObjectives);
        this.game.storage.meta.teamScores[1].objectives = objectivesForTeam(teamTwoObjectives);

        return this;
    }

    /**
     * Performs the common operations that are typically done with game seeding,
     * this includes template, season, team score, editors and generated users.
     */
    public async common(): Promise<GameSeeding> {
        let game = this.WithTemplates().withSeason(3).withTeamScores();
        game = await game.withGeneratedPlayers();
        game = await game.withEditors();

        return game;
    }

    /**
     * Creates the given game in the database and returns the given game after
     * it has been created, this is where the game schedule will be created if
     * specified within the construction.
     */
    public async save(): Promise<Game> {
        return await this.game.save();
    }
}
