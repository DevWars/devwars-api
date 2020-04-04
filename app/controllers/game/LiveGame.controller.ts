import { getManager, getCustomRepository } from 'typeorm';
import { Response } from 'express';
import { isNil } from 'lodash';

import UserRepository from '../../repository/User.repository';
import { IGameRequest, IRequest } from '../../request/IRequest';
import GameService from '../../services/Game.service';
import { GameStatus } from '../../models/GameSchedule';
import { flattenGame } from './Game.controller';
import ApiError from '../../utils/apiError';

/**
 * @api {get} /games/:game/player Assign player to team.
 * @apiVersion 1.0.0
 * @apiName AddPlayerToTeamRole
 * @apiDescription Assigns the player to the given team with the given language.
 * Ensuring to update firebase with the game is active.
 * @apiGroup LiveGame
 *
 * @apiParam {number} game The id of the game the player is being added too.
 *
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * { }
 *
 * @apiError UserDoesNotExist The user does not exist in the database by the id.
 * @apiError PlayerCannotChangeTeam The player has already been assigned to other team, ensure to remove first.
 * @apiError PlayerAlreadyAssignedLanguage The player has already been assigned that language for that team (e.g html).
 */
export async function addPlayer(request: IRequest & IGameRequest, response: Response) {
    const { player, team } = request.body;

    if (!request.game.storage.players) request.game.storage.players = {};
    const players = request.game.storage.players;

    const existingPlayer = players[player.id];

    if (existingPlayer && existingPlayer.team !== team.id) {
        response.status(409).json({ error: "Can't change player's team." });
        return;
    }

    const usersRepository = getCustomRepository(UserRepository);
    const user = await usersRepository.findById(player?.id);

    if (isNil(user)) {
        throw new ApiError({
            code: 400,
            error: 'The given user does not exist by the provided id.',
        });
    }

    const { username, id, avatarUrl } = user;
    players[id] = { avatarUrl, id, team: team.id, username };

    if (!request.game.storage.editors) request.game.storage.editors = {};

    const editors = request.game.storage.editors;
    const nextEditorId = Object.keys(editors).length;

    for (const editor of Object.values(editors) as any) {
        if (editor.player === id && editor.language === player.language) {
            throw new ApiError({
                error: 'Player already assigned to that language.',
                code: 409,
            });
        }
    }
    editors[nextEditorId] = {
        id: nextEditorId,
        player: id,
        team: team.id,
        language: player.language,
    };

    request.game.storage.teams = {
        '0': {
            id: 0,
            name: 'blue',
        },
        '1': {
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
