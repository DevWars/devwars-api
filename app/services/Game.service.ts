import AWS = require('aws-sdk');
import { default as firebase, available } from '../utils/firebase';

const firebaseGame = available ? firebase.database().ref('game') : null;

export default class GameService {
    public static async sendGamePlayersToFirebase(game: any) {
        const bluePlayers: any[] = [];
        const redPlayers: any[] = [];

        for (const editor of Object.values(game.storage.editors) as any) {
            const player = game.storage.players[editor.player];
            if (!player) continue;

            const playerArr = player.team === 0 ? bluePlayers : redPlayers;

            playerArr.push({
                team: player.team,
                language: editor.language,
                user: {
                    id: player.id,
                    username: player.username,
                },
            });
        }

        await firebaseGame?.child('teams').child('blue').child('players').set(bluePlayers);
        await firebaseGame?.child('teams').child('red').child('players').set(redPlayers);
    }

    public static async sendGameToFirebase(game: any) {
        if (game.editor) {
            await this.sendGamePlayersToFirebase(game);
        }

        const objectives = Object.values(game.storage.objectives).map((obj: any) => {
            return {
                number: obj.id,
                description: obj.description,
            };
        });

        const newGame = {
            id: game.id,
            name: game.mode,
            objectives,
            theme: game.storage.title,
        };

        await firebaseGame?.update(newGame);
    }
}
