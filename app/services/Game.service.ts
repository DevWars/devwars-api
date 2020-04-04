import * as _ from 'lodash';

import Game from '../models/Game';
import GameApplication from '../models/GameApplication';
import { default as firebase, available } from '../utils/firebase';
import { IGameStoragePlayer, IGameStorageEditor } from '../types/game';

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
            const { id, username, team } = player;

            playerArr.push({ team, language: editor.language, user: { id, username } });
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

        await firebaseGame?.update({ id, theme, name, objectives, ...storage });
    }
}
