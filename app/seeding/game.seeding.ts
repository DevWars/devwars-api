import { hacker, helpers, internet, lorem, random, date } from 'faker';
import * as _ from 'lodash';

import Game, { GameMode, GameStatus } from '../models/game.model';
import GameApplication from '../models/gameApplication.model';
import User from '../models/user.model';

import { GameObjective } from '../types/common';
import UserSeeding from './user.seeding';

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
     * The list of game applications, these can not be saved until the given game is saved first.
     */
    public gameApplications: GameApplication[] = [];

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
    public async withPlayers(players: User[]): Promise<GameSeeding> {
        const languages = ['js', 'css', 'html', 'js', 'css', 'html'];

        for (let index = 0; index < players.length; index++) {
            const player = players[index];

            const gameApplication = new GameApplication(this.game, player);
            if (languages.length >= 1) {
                gameApplication.assignedLanguage = languages.shift();
                gameApplication.team = index <= 2 ? 0 : 1;
            }

            this.gameApplications.push(gameApplication);
        }

        this.playersLoaded = true;
        return this;
    }

    /**
     * Includes generated players within the game based the number (amount)
     * provided.
     * @param amount The amount of generated players to be added.
     */
    public async withGeneratedPlayers(amount = 6): Promise<GameSeeding> {
        const players = [];

        for (let index = 0; index < amount; index++) {
            const player = await UserSeeding.default().save();
            players.push(player);
        }

        return await this.withPlayers(players);
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
        game = await game.withGeneratedPlayers(6);

        return game;
    }

    /**
     * Creates the given game in the database and returns the given game after
     * it has been created, this is where the game schedule will be created if
     * specified within the construction.
     */
    public async save(): Promise<Game> {
        const game = await this.game.save();

        for (const application of this.gameApplications) {
            application.game = game;
            await application.save();
        }

        return game;
    }
}
