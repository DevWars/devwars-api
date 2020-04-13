import * as _ from 'lodash';

import Game from '../models/Game';
import GameApplication from '../models/GameApplication';
import { default as firebase, available } from '../utils/firebase';
import { IGameStoragePlayer } from '../types/game';

const firebaseGame = available ? firebase.database().ref('game') : null;

export default class GameService {
    /**
     * Auto assigns players to the given game based on the users related
     * properties, including the users wins, loses, last played, and xp / level.
     * By doing so reduces the amount of work and bias on the moderators.
     * @param game The game that is being used to auto assign players.
     * @param applications The applications for the given game.
     */
    public static autoAssignPlayersForGame(game: Game, applications: GameApplication[]): Game {
        return game;
    }

    /**
     * Sends the updated players to the firebase database, these will be
     * rendered on the related editor screen with the players information and
     * data.
     * @param game The game with the updated players.
     */
    public static async sendGamePlayersToFirebase(game: Game) {
        const bluePlayers: Array<{ team: number; language: string; user: any }> = [];
        const redPlayers: Array<{ team: number; language: string; user: any }> = [];

        for (const editor of Object.values(game.storage.editors)) {
            const player: IGameStoragePlayer = game.storage.players[editor.player];

            // if the player index exists but is null or undefined, just
            // continue with the other players.
            if (_.isNil(player)) continue;

            const playerArr = player.team === 0 ? bluePlayers : redPlayers;
            const { id, username, team, avatarUrl } = player;

            playerArr.push({
                team,
                language: editor.language,
                user: { id, username, avatarUrl: _.defaultTo(avatarUrl, null) },
            });
        }

        await firebaseGame?.child('teams').child('blue').child('players').set(bluePlayers);
        await firebaseGame?.child('teams').child('red').child('players').set(redPlayers);
    }

    /**
     * Updates firebase with the latest game information.
     * @param game The game that is being updated in firebase.
     */
    public static async sendGameToFirebase(game: Game) {
        const { storage, id, mode: name } = game;
        const { title: theme } = storage;

        let objectives: Array<{ number: number; description: string }> = [];
        if (!_.isNil(storage.editors)) await this.sendGamePlayersToFirebase(game);

        objectives = Object.values(game.storage.objectives).map((obj) => {
            return {
                number: obj.id,
                description: obj.description,
            };
        });

        await firebaseGame?.update({ id, theme, name, objectives, templates: game.storage?.templates || {} });
    }

    /**
     * Gets results for the current completed game from the live frame, this
     * will include gathering the games betting, live votes for both ui, ux and
     * objective results.
     */
    public static async getCompletedGameResult(): Promise<any> {
        const result: any = {};

        if (!available) return result;

        const frame = firebase.database().ref('frame');
        const liveGame = firebase.database().ref('liveGame');

        // Gather the betting results and bind it into the response of the game
        // result. Ensuring to include the tie.
        const bettingResponse = await frame.child('betting').once('value');
        const bettingValue = bettingResponse.val();

        if (!_.isNil(bettingValue)) {
            result.bets = {
                red: bettingValue.red || 0,
                blue: bettingValue.blue || 0,
                tie: bettingValue.tie || 0,
            };
        }

        // Gather the love voting results for ui, ux and tie breakers (tie
        // breakers are not always going to exist).
        const liveVotingResponse = await frame.child('liveVoting').once('value');
        const liveVotingValue = liveVotingResponse.val();

        if (!_.isNil(liveVotingValue)) {
            result.votes = {
                tiebreaker: {
                    blue: liveVotingValue.tiebreaker?.blue || 0,
                    red: liveVotingValue.tiebreaker?.red || 0,
                },
                ui: {
                    blue: liveVotingValue.ui?.blue || 0,
                    red: liveVotingValue.ui?.red || 0,
                },
                ux: {
                    blue: liveVotingValue.ux?.blue || 0,
                    red: liveVotingValue.ux?.red || 0,
                },
            };
        }

        const completed = { red: 0, blue: 0 };

        // Gather the results for the given objectives.
        const objectivesResponse = await liveGame.child('objectives').once('value');
        const objectives = objectivesResponse.val() || [];

        result.objectives = objectives.map((obj: any, key: string) => {
            if (obj.blueState === 'complete') completed.blue += 1;
            if (obj.redState === 'complete') completed.red += 1;

            return {
                id: Number(key) + 1,
                bonus: Boolean(obj.isBonus),
                blue: obj.blueState || 'incomplete',
                red: obj.redState || 'incomplete',
            };
        });

        // Mark the winner based on the total number of objectives completed.
        result.winner = completed.blue === completed.red ? 'tie' : completed.blue > completed.red ? 'blue' : 'red';

        return result;
    }
}
