import AWS = require('aws-sdk');
import { ManagedUpload, PutObjectRequest } from 'aws-sdk/clients/s3';
import Game from '../models/Game';
import firebase from '../utils/firebase';

const firebaseGame = firebase.database().ref('game');

export default class GameService {
    public static async all() {
        return [
            {
                name: 'Zen Garden',
            },
            {
                name: 'Classic',
            },
            {
                name: 'Blitz',
            },
        ];
    }

    // public static async backupGame(game: Game) {
    //     const files = ['index.html', 'game.css', 'game.js'];

    //     const editorGame = await getValueAtPath(process.env.EDITOR_PATH);

    //     for (const player of editorGame.players) {
    //         const language = files[player.id % 3];
    //         const path = `game/${game.id}/${player.team}/${language}`;

    //         const editor = editorGame.editors[player.editorId];
    //         console.log(editor);

    //         if (!editor) {
    //             continue;
    //         }

    //         const params: PutObjectRequest = {
    //             Body: editor.text,
    //             Bucket: process.env.AWS_BUCKET_NAME,
    //             Key: path,
    //         };

    //         const s3 = new AWS.S3();

    //         await new Promise<ManagedUpload.SendData>((resolve, reject) => {
    //             s3.upload(params, (err: Error, data: ManagedUpload.SendData) => {
    //                 if (err) {
    //                     reject(err);
    //                 }

    //                 resolve(data);
    //             });
    //         });
    //     }
    // }

    // public static async endGame(game: Game, winner: GameTeam) {
    //     // Mark the game as inactive
    //     game.active = false;

    //     // Set the display status to "Ended"
    //     game.status = GameStatus.ENDED;

    //     await game.save();

    //     const teams = await GameTeamRepository.forGame(game);

    //     for (const team of teams) {
    //         // Mark whether or not the current team won
    //         team.winner = team.id === winner.id;

    //         for (const player of await PlayerRepository.forTeam(team)) {
    //             // Winners get 600 coins, losers get 200 coins
    //             const coins = team.winner ? 600 : 200;

    //             // Winners get 300 xp, losers get 50 xp
    //             const xp = team.winner ? 300 : 50;

    //             player.user.statistics.xp += xp;
    //             player.user.statistics.coins += coins;

    //             // Increment their wins / losses
    //             if (team.winner) {
    //                 player.user.statistics.wins += 1;
    //             } else {
    //                 player.user.statistics.losses += 1;
    //             }

    //             await player.user.save();
    //         }

    //         await team.save();
    //     }
    // }

    public static async setPlayersToFirebase(game: any) {
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

        await firebaseGame
            .child('teams')
            .child('blue')
            .child('players')
            .set(bluePlayers);
        await firebaseGame
            .child('teams')
            .child('red')
            .child('players')
            .set(redPlayers);
    }

    public static async sendGameToFirebase(game: any) {
        await this.setPlayersToFirebase(game);

        const objectives = Object.values(game.storage.objectives).map((obj: any) => {
            return {
                number: obj.id,
                description: obj.description,
            };
        });

        const newGame = {
            id: game.id,
            name: game.mode,
            theme: game.storage.title,
            objectives,
        };

        await firebaseGame.update(newGame);
    }
}
