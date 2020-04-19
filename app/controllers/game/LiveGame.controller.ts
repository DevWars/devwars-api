import { getManager, getCustomRepository } from 'typeorm';
import { Response } from 'express';
import * as _ from 'lodash';

import UserGameStatsRepository from '../../repository/userGameStats.repository';
import UserRepository from '../../repository/User.repository';
import { GameRequest, AuthorizedRequest } from '../../request/IRequest';
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
export async function addPlayer(request: AuthorizedRequest & GameRequest, response: Response) {
    const { player } = request.body;

    if (!request.game.storage.players) request.game.storage.players = {};
    const players = request.game.storage.players;

    const existingPlayer = players[player.id];

    if (existingPlayer && existingPlayer.team !== player.team) {
        return response.status(409).json({ error: "Can't change player's team." });
    }

    const usersRepository = getCustomRepository(UserRepository);
    const user = await usersRepository.findById(player?.id);

    if (_.isNil(user)) {
        throw new ApiError({
            code: 400,
            error: 'The given user does not exist by the provided id.',
        });
    }

    const { username, id, avatarUrl } = user;
    players[id] = { avatarUrl, id, team: player.team, username };

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
        team: player.team,
        language: player.language,
    };

    await request.game.save();

    if (request.game.status === GameStatus.ACTIVE) {
        await GameService.sendGamePlayersToFirebase(request.game);
    }

    return response.status(201).json(flattenGame(request.game));
}

export async function removePlayer(request: AuthorizedRequest & GameRequest, response: Response) {
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

/**
 * @api {post} /games/:game/end Ends a game by a given id.
 * @apiVersion 1.0.0
 * @apiName EndGame
 * @apiDescription Ends a game by the given id, ensuring to gather results from
 * firebase, store them while additionally updating the related users wins and
 * loses (based on the results).
 * @apiGroup LiveGame
 *
 * @apiParam {number} game The id of the game.
 *
 * @apiSuccessExample Success-Response: HTTP/1.1 200 OK
 * { }
 *
 * @apiError GameAlreadyEnded The given game has already ended.
 */
export async function end(request: AuthorizedRequest & GameRequest, response: Response) {
    if (request.game.status === GameStatus.ENDED) {
        throw new ApiError({
            error: 'The game is already in a end state.',
            code: 400,
        });
    }

    const { game } = request;

    if (!_.isNil(game.schedule)) game.schedule.status = GameStatus.ENDED;
    game.status = GameStatus.ENDED;

    // Update the results on the object of the game.
    const results = await GameService.getCompletedGameResult();

    game.storage.meta = {
        teamScores: [
            {
                ui: results?.votes?.ui.blue || 0,
                ux: results?.votes?.ux.blue || 0,
                tie: results.winner === 'tie',
                objectives: _.filter(results.objectives, (o) => o.blue === 'complete').length,
            },
            {
                ui: results?.votes?.ui.red || 0,
                ux: results?.votes?.ux.red || 0,
                tie: results.winner === 'tie',
                objectives: _.filter(results.objectives, (o) => o.red === 'complete').length,
            },
        ],
        bets: results.bets || {},
        winningTeam: results.winner === 'blue' ? 0 : 1,
    };

    const objectivesForTeam = (team: string) => {
        const result: any = {};

        _.forEach(results.objectives, (o: any) => {
            result[o.id] = o[team];
        });

        return result;
    };

    game.storage.teams[0].objectives = objectivesForTeam('blue');
    game.storage.teams[0].votes = {
        ui: results?.votes?.ui.blue || 0,
        ux: results?.votes?.ui.blue || 0,
        tie: results.winner === 'tie',
    };

    game.storage.teams[1].objectives = objectivesForTeam('red');
    game.storage.teams[1].votes = {
        ui: results?.votes?.ui.red || 0,
        ux: results?.votes?.ui.red || 0,
        tie: results.winner === 'tie',
    };

    if (!_.isNil(results)) {
        const winnerTeamId = results.winner === 'blue' ? 0 : 1;
        const gameStatsRepository = getCustomRepository(UserGameStatsRepository);

        const winners = _.filter(game.storage.players, (player) => player.team === winnerTeamId);
        const losers = _.filter(game.storage.players, (player) => player.team !== winnerTeamId);

        // Increment all the winners wins by one.
        if (!_.isNil(winners) && _.size(winners) > 0) {
            await gameStatsRepository.incrementUsersWinsByIds(_.map(winners, (winner) => winner.id));
        }

        // Increment all the losers loses by one.
        if (!_.isNil(losers) && _.size(losers) > 0) {
            await gameStatsRepository.incrementUsersLosesByIds(_.map(losers, (loser) => loser.id));
        }
    }

    await getManager().transaction(async (transaction) => {
        if (!_.isNil(game.schedule)) {
            await transaction.save(game.schedule);
        }

        await transaction.save(game);
    });

    return response.status(200).send();
}
