import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import { flattenGame } from './Game.controller';
import GameRepository from '../../repository/Game.repository';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import GameService from '../../services/Game.service';
import { GameStatus } from '../../models/GameSchedule';

export async function addPlayer(request: Request, response: Response) {
    const gameId = request.params.id;
    const { player, team } = request.body;

    const gameRepository = await getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);
    if (!game) return response.sendStatus(404);

    const gameScheduleRepository = await getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findByGame(game);
    if (!schedule) return response.sendStatus(404);

    if (!game.storage.players) game.storage.players = {};
    const players = game.storage.players;

    const existingPlayer = players[player.id];
    if (existingPlayer && existingPlayer.team !== team.id) {
        response.status(409).json({ message: "Can't change player's team" });
        return;
    }
    players[player.id] = {
        id: player.id,
        username: player.username,
        team: team.id,
    };

    if (!game.storage.editors) game.storage.editors = {};
    const editors = game.storage.editors;

    const nextEditorId = Object.keys(editors).length;
    for (const editor of Object.values(editors) as any) {
        if (editor.player === player.id && editor.language === player.language) {
            response.status(409).json({ message: 'Player already assigned to that language' });
            return;
        }
    }
    editors[nextEditorId] = {
        id: nextEditorId,
        team: team.id,
        player: player.id,
        language: player.language,
    };

    game.storage.teams = {
        0: {
            id: 0,
            name: 'blue',
        },
        1: {
            id: 1,
            name: 'red',
        },
    };

    // if (Object.values(editors).length > 0) {
    //     for (const { keys, value } of Object.entries(editors)) {

    //     }
    // }

    // "editors": {
    //     "0": {
    //       "id": 0,
    //       "team": 0,
    //       "player": 2,
    //       "language": "html"
    //     },
    // }

    // for (const editor of Object.values(game.storage.editors) as any) {
    //     if (editor.language === language && editor.team === team.id) {
    //         editor.player = player.id;
    //     }
    // }

    // for (const existingPlayer of Object.values(game.storage.players) as any) {
    //     let hasEditor = false;

    //     for (const editor of Object.values(game.storage.editors) as any) {
    //         if (editor.player === existingPlayer.id) {
    //             hasEditor = true;
    //             break;
    //         }
    //     }

    //     if (!hasEditor) {
    //         delete game.storage.players[existingPlayer.id];
    //     }
    // }

    await game.save();

    if (game.status === GameStatus.ACTIVE) {
        await GameService.sendGamePlayersToFirebase(game);
    }

    response.status(201).json(flattenGame(game));
}

export async function removePlayer(request: Request, response: Response) {
    const gameId = request.params.id;
    const { player } = request.body;

    const gameRepository = await getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);

    const gamePlayer = gameRepository.findByPlayer(player);
    if (!gamePlayer) return response.sendStatus(404);

    delete game.storage.players[player.id];

    for (const editor of Object.values(game.storage.editors) as any) {
        if (editor.player === player.id) {
            delete game.storage.editors[editor.id];
        }
    }

    await game.save();

    if (game.status === GameStatus.ACTIVE) {
        await GameService.sendGamePlayersToFirebase(game);
    }

    response.status(201).json(flattenGame(game));
}

export async function end(request: Request, response: Response) {
    const gameId = request.params.id;
    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);
    if (!game) return response.sendStatus(404);

    // Get winner
    // const winner = await TeamRepository.byId(request.query.winner);

    // await GameService.backupGame(game);
    // await GameService.endGame(game, winner);

    // response.json({ game, winner });
}
