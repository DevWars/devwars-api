import { getCustomRepository, Not, IsNull } from 'typeorm';
import { Response } from 'express';
import * as _ from 'lodash';

import GameApplicationRepository from '../repository/gameApplication.repository';
import UserGameStatsRepository from '../repository/userGameStats.repository';
import UserRepository from '../repository/user.repository';

import { sendGameApplicationApplyingEmail, SendGameApplicationResignEmail } from '../services/mail.service';
import GameService from '../services/game.service';

import GameApplication from '../models/gameApplication.model';
import { GameStatus } from '../models/game.model';

import { GameRequest, AuthorizedRequest, UserRequest } from '../request/requests';
import { flattenGame } from './game.controller';
import ApiError from '../utils/apiError';

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
    game.status = GameStatus.ENDED;

    // Update the results on the object of the game.
    const results = await GameService.getCompletedGameResult();

    game.storage.meta = {
        bets: results.bets || {},
        winningTeam: results.winner === 'blue' ? 0 : 1,
        teamScores: { '0': { bets: 0, id: 0, ui: 0, ux: 0 }, '1': { bets: 0, id: 0, ui: 0, ux: 0 } },
        tie: results.winner === 'tie',
    };

    const objectivesForTeam = (team: string) => {
        const result: any = {};

        _.forEach(results.objectives, (o: any) => {
            result[o.id] = o[team];
        });

        return result;
    };

    game.storage.meta.teamScores[0].objectives = objectivesForTeam('blue');
    game.storage.meta.teamScores[0].ui = results?.votes?.ui.blue || 0;
    game.storage.meta.teamScores[0].ux = results?.votes?.ux.blue || 0;

    game.storage.meta.teamScores[1].objectives = objectivesForTeam('red');
    game.storage.meta.teamScores[1].ui = results?.votes?.ui.red || 0;
    game.storage.meta.teamScores[1].ux = results?.votes?.ux.red || 0;

    if (!_.isNil(results)) {
        const winnerTeamId = game.storage.meta.winningTeam;
        const losingTeamId = winnerTeamId === 1 ? 0 : 1;

        const gameStatsRepository = getCustomRepository(UserGameStatsRepository);
        const gameApplicationRepository = getCustomRepository(GameApplicationRepository);

        const winners = await gameApplicationRepository.getAssignedPlayersForTeam(game, winnerTeamId, ['user']);
        const losers = await gameApplicationRepository.getAssignedPlayersForTeam(game, losingTeamId, ['user']);

        // Increment all the winners wins by one.
        if (!_.isNil(winners) && _.size(winners) > 0) {
            await gameStatsRepository.incrementUsersWinsByIds(_.map(winners, (winner) => winner.user.id));
        }

        // Increment all the losers loses by one.
        if (!_.isNil(losers) && _.size(losers) > 0) {
            await gameStatsRepository.incrementUsersLosesByIds(_.map(losers, (loser) => loser.user.id));
        }
    }

    await game.save();
    return response.status(200).send();
}

/*******************************
 *  Players
 ******************************/

/**
 * @api {get} /games/:game/players Get all game assigned players.
 * @apiVersion 1.0.0
 *
 * @apiName GetGameAssignedPlayers
 * @apiDescription Get all the players who have been assigned to the given game.
 *
 * @apiGroup LiveGame
 *
 * @apiParam {number} game The id of the game.
 */
export async function GetAllGameAssignedPlayers(request: GameRequest, response: Response) {
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);

    const result = await gameApplicationRepository.find({
        where: {
            game: request.game,
            team: Not(IsNull()),
        },
        relations: ['user'],
    });

    return response.json(result);
}

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
export async function assignPlayerToGame(request: AuthorizedRequest & GameRequest, response: Response) {
    const { id, language, team }: { id: number; language: string; team: number } = request.body.player;

    const applicationRepository = getCustomRepository(GameApplicationRepository);
    const usersRepository = getCustomRepository(UserRepository);
    const user = await usersRepository.findById(id);

    if (_.isNil(user)) {
        throw new ApiError({
            code: 400,
            error: 'The given user does not exist by the provided id.',
        });
    }

    const application = await applicationRepository.findByUserAndGame(user, request.game);

    if (_.isNil(application)) {
        throw new ApiError({
            message: 'The specified user is not applied to the specified game.',
            code: 400,
        });
    }

    const alreadyAssigned = await applicationRepository.isPlayerAlreadyAssigned(user, request.game);
    if (alreadyAssigned) {
        throw new ApiError({
            error: 'The given user is already assigned to a team.',
            code: 409,
        });
    }

    const alreadyLanguageAssigned = await applicationRepository.isGameLanguageAssigned(request.game, team, language);
    if (alreadyLanguageAssigned) {
        throw new ApiError({
            error: 'The given language is already assigned within the team',
            code: 409,
        });
    }

    await applicationRepository.assignUserToGame(user, request.game, team, language);

    if (request.game.status === GameStatus.ACTIVE) {
        await GameService.sendGamePlayersToFirebase(request.game);
    }

    return response.status(201).json(flattenGame(request.game));
}

export async function removePlayerFromGame(request: AuthorizedRequest & GameRequest, response: Response) {
    const { id } = request.body.player;

    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    await gameApplicationRepository.removeUserFromGame(id, request.game);

    if (request.game.status === GameStatus.ACTIVE) await GameService.sendGamePlayersToFirebase(request.game);
    return response.status(200).json(flattenGame(request.game));
}

/*******************************
 *  Applications
 ******************************/

/**
 * @api {get} /games/:game/applications Get all applications for the game.
 * @apiVersion 1.0.0
 *
 * @apiName GetApplicationsForGame
 * @apiDescription Gets all the game applications for the given game, requiring
 * that the given user is a moderator or higher.
 *
 * @apiGroup LiveGame
 *
 * @apiParam {number} game The id of the game.
 */
// export async function getAllGameApplications(request: AuthorizedRequest, response: Response) {
export async function getAllGameApplications(request: GameRequest, response: Response) {
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const result = await gameApplicationRepository.find({ game: request.game });

    return response.json(result);
}

/**
 * @api {post} /games/:game/applications?user=:user Apply to the given game for
 * the user.
 * @apiVersion 1.0.0
 *
 * @apiName ApplyApplicationsForGame
 * @apiDescription Apply for the given game by the given user. If the user who
 * is authenticated is not the applying user, then only allow it if the
 * authenticated user is a moderator or higher.
 *
 * @apiGroup LiveGame
 *
 * @apiParam {number} game The id of the game.
 * @apiParam {number} user The id of the user.
 */
export async function applyToGameWithApplication(request: GameRequest & UserRequest, response: Response) {
    const applicationRepository = getCustomRepository(GameApplicationRepository);

    const existingApplication = await applicationRepository.existsByUserAndGame(request.boundUser, request.game);

    if (existingApplication) {
        throw new ApiError({
            message: 'A application already exists for the specified game.',
            code: 409,
        });
    }

    const application = new GameApplication(request.game, request.boundUser);
    await application.save();

    await sendGameApplicationApplyingEmail(application);
    return response.json(application);
}

/**
 * @api {get} /games/:game/applications/:user Get a given application by the
 * user.
 * @apiVersion 1.0.0
 *
 * @apiName GetApplicationForGameByUser
 * @apiDescription Gets the game application for the current specified user,
 * this can only be the authenticated user if the authenticated user is not a
 * moderator or higher.
 *
 * @apiGroup LiveGame
 *
 * @apiParam {number} game The id of the game.
 * @apiParam {number} user The id of the user.
 */
export async function getApplicationByUser(request: GameRequest & UserRequest, response: Response) {
    const applicationRepository = getCustomRepository(GameApplicationRepository);

    const existingApplication = await applicationRepository.findByUserAndGame(request.boundUser, request.game);

    if (!existingApplication) {
        throw new ApiError({
            message: 'A application does not exists for the specified game.',
            code: 409,
        });
    }

    return response.json(existingApplication);
}

/**
 * @api {delete} /games/:game/applications/:user remove a given application by the
 * user.
 * @apiVersion 1.0.0
 *
 * @apiName RemoveApplicationForGameByUser
 * @apiDescription Removes the game application for the current specified user,
 * this can only be the authenticated user if the authenticated user is not a
 * moderator or higher.
 *
 * @apiGroup LiveGame
 *
 * @apiParam {number} game The id of the game.
 * @apiParam {number} user The id of the user.
 */
export async function deleteApplicationById(request: GameRequest & UserRequest, response: Response) {
    const applicationRepository = getCustomRepository(GameApplicationRepository);

    const existingApplication = await applicationRepository.existsByUserAndGame(request.boundUser, request.game);

    if (!existingApplication) {
        throw new ApiError({
            message: 'A application does not exists for the specified game.',
            code: 409,
        });
    }

    const application = await applicationRepository.findByUserAndGame(request.boundUser, request.game);
    application.user = request.boundUser;
    application.game = request.game;

    await application.remove();

    await SendGameApplicationResignEmail(application);
    return response.send();
}
