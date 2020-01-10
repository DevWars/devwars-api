import { getManager, getCustomRepository } from 'typeorm';
import { Response } from 'express';
import { isNil } from 'lodash';

import { IGameRequest, IRequest } from '../../request/IRequest';
import GameRepository from '../../repository/Game.repository';
import GameService from '../../services/Game.service';
import { GameStatus } from '../../models/GameSchedule';
import { flattenGame } from './Game.controller';
import ApiError from '../../utils/apiError';

export async function addPlayer(request: IRequest & IGameRequest, response: Response) {
    const { player, team } = request.body;

    if (!request.game.storage.players) request.game.storage.players = {};
    const players = request.game.storage.players;

    const existingPlayer = players[player.id];
    if (existingPlayer && existingPlayer.team !== team.id) {
        response.status(409).json({ error: "Can't change player's team." });
        return;
    }
    players[player.id] = {
        id: player.id,
        username: player.username,
        team: team.id,
    };

    if (!request.game.storage.editors) request.game.storage.editors = {};
    const editors = request.game.storage.editors;
    const nextEditorId = Object.keys(editors).length;

    for (const editor of Object.values(editors) as any) {
        if (editor.player === player.id && editor.language === player.language) {
            throw new ApiError({
                error: 'Player already assigned to that language.',
                code: 409,
            });
        }
    }
    editors[nextEditorId] = {
        id: nextEditorId,
        team: team.id,
        player: player.id,
        language: player.language,
    };

    request.game.storage.teams = {
        0: {
            id: 0,
            name: 'blue',
        },
        1: {
            id: 1,
            name: 'red',
        },
    };

    await request.game.save();

    if (request.game.status === GameStatus.ACTIVE) {
        await GameService.sendGamePlayersToFirebase(request.game);
    }

    return response.status(201).json(flattenGame(request.game));
}

export async function removePlayer(request: IRequest & IGameRequest, response: Response) {
    const { player } = request.body;

    delete request.game.storage.players[player.id];

    for (const editor of Object.values(request.game.storage.editors) as any) {
        if (editor.player === player.id) {
            delete request.game.storage.editors[editor.id];
        }
    }

    await request.game.save();

    if (request.game.status === GameStatus.ACTIVE) await GameService.sendGamePlayersToFirebase(request.game);
    return response.status(201).json(flattenGame(request.game));
}

export async function end(request: IRequest & IGameRequest, response: Response) {
    if (!isNil(request.game.schedule)) request.game.schedule.status = GameStatus.ENDED;
    request.game.status = GameStatus.ENDED;

    await getManager().transaction(async (transaction) => {
        await transaction.save(request.game.schedule);
        await transaction.save(request.game);
    });

    return response.json(flattenGame(request.game));
}
