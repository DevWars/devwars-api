import { getCustomRepository, Not, IsNull } from 'typeorm';
import { Response } from 'express';
import * as _ from 'lodash';

import GameApplicationRepository from '../repository/gameApplication.repository';
import UserGameStatsRepository from '../repository/userGameStats.repository';
import UserRepository from '../repository/user.repository';

import { sendGameApplicationApplyingEmail, SendGameApplicationResignEmail } from '../services/mail.service';
import GameService from '../services/game.service';

import GameApplication from '../models/gameApplication.model';
import Game, { GameStatus } from '../models/game.model';

import { GameRequest, AuthorizedRequest, UserRequest } from '../request/requests';
import { EndGameRequest } from '../request/endGameRequest';

import { flattenGame } from './game.controller';
import ApiError from '../utils/apiError';
import User from '../models/user.model';
import RankingService from '../services/ranking.service';
import { BadgeService } from '../services/badge.service';
import { GameStorageMetaTeamScore } from '../types/game';

async function handleWinnersForGame(game: Game, winningTeamId: number, winners: GameApplication[]) {
    const gameStatsRepository = getCustomRepository(UserGameStatsRepository);

    const winningUsers = _.map(winners, (e) => e.user);

    const teamObjectives = Object.values(game.storage.meta.teamScores[winningTeamId].objectives);
    const totalCompleteTeamObjectives = teamObjectives.filter((e) => e === 'complete').length;

    // If the given winning team completed all objectives, since if all
    // objectives have been complete all users get a bonus about of
    // xp.
    if (_.size(game.storage.objectives) === totalCompleteTeamObjectives)
        await RankingService.assignObjectiveCompletionExperienceToUsers(winningUsers);

    await Promise.all([
        await gameStatsRepository.incrementUsersWinsByIds(winningUsers),
        await RankingService.assignWinningExperienceToUsers(winningUsers),
        await BadgeService.assignGameWinningBadgesForUsers(winningUsers),
    ]);
}

async function handleLosersForGame(game: Game, losingTeamId: number, losers: GameApplication[]) {
    const gameStatsRepository = getCustomRepository(UserGameStatsRepository);

    const losingUsers = _.map(losers, (e) => e.user);

    const teamObjectives = Object.values(game.storage.meta.teamScores[losingTeamId].objectives);
    const totalCompleteTeamObjectives = teamObjectives.filter((e) => e === 'complete').length;

    // If the given losing team completed all objectives, since if all
    // objectives have been complete all users get a bonus about of
    // xp.
    if (_.size(game.storage.objectives) === totalCompleteTeamObjectives)
        await RankingService.assignObjectiveCompletionExperienceToUsers(losingUsers);

    await Promise.all([
        await gameStatsRepository.incrementUsersLosesByIds(losingUsers),
        await RankingService.assignLosingExperienceToUsers(losingUsers),
    ]);
}

/**
 * @api {post} /games/:game/actions/end Ends a game by a given id.
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
export async function endGameById(request: EndGameRequest & AuthorizedRequest & GameRequest, response: Response) {
    if (request.game.status === GameStatus.ENDED) {
        throw new ApiError({
            error: 'The game is already in a end state.',
            code: 400,
        });
    }

    const { game } = request,
        endGameRequest: EndGameRequest = request.body || {},
        teamScores: { [index: string]: GameStorageMetaTeamScore } = {};

    let winner: any = null,
        tie = true;

    for (const team of _.defaultTo(endGameRequest.teams, [])) {
        const { total: uiTotal } = endGameRequest.teamVoteResults.filter((e) => e.category === 'design')[0],
            { total: uxTotal } = endGameRequest.teamVoteResults.filter((e) => e.category === 'function')[0];

        const completedObjectives = team.completeObjectives;

        const objectives = endGameRequest.objectives.reduce((acc, value) => {
            acc[`${value.id}`] = completedObjectives.includes(value.id) ? 'complete' : 'incomplete';
            return acc;
        }, {} as { [index: string]: 'complete' | 'incomplete' });

        const score = {
            id: team.id,
            objectives,
            ui: uiTotal,
            ux: uxTotal,
            bets: 0,
        };

        teamScores[`${team.id}`] = score;

        if (winner === null || score.ui + score.ux > winner.ui + winner.ux) {
            winner = score;
        }

        // Ensure to set the tie state for the winner plus the current team.
        // This will ensure to check all teams vs the current winner to check if
        // we are in tie state.
        tie = winner.ui + winner.ux === score.ui + score.ux;
    }

    winner = _.defaultTo(winner, { id: 0 });

    game.storage.meta = {
        winningTeam: winner,
        teamScores: teamScores,
        tie,
    };

    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);

    // Handle the logic for the winners
    const winners = await gameApplicationRepository.getAssignedPlayersForTeam(game, winner.id, ['user']);
    if (!_.isNil(winners) && _.size(winners) > 0) await handleWinnersForGame(game, winner.id, winners);

    const lowerApplications = [];

    // Handle the logic for the losers
    for (const losingTeam of endGameRequest.teams.filter((e) => e.id !== winner.id)) {
        const losers = await gameApplicationRepository.getAssignedPlayersForTeam(game, losingTeam.id, ['user']);
        if (!_.isNil(losers) && _.size(losers) > 0) await handleLosersForGame(game, losingTeam.id, losers);

        lowerApplications.push(...losers);
    }

    // regardless of who own or lost and the amount of objectives that have
    // been completed all users should get a fixed amount of experience for
    // participation within devwars.
    await RankingService.assignParticipationExperienceToUsers(
        _.concat(
            _.map(winners, (e) => e.user),
            _.map(lowerApplications, (e) => e.user)
        )
    );

    await game.save();
    return response.send();
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
export async function GetAllGameAssignedPlayersById(request: GameRequest, response: Response) {
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);

    const result = await gameApplicationRepository.find({
        where: {
            game: request.game,
            team: Not(IsNull()),
        },
        relations: ['user'],
    });

    // Since we are also pulling back the user, ensure to sanitize the email
    // from the response.
    result.forEach((result) => {
        const { id, username, avatarUrl } = result.user;
        result.user = { id, username, avatarUrl } as User;
    });

    return response.json(result);
}

/**
 * @api {get} /games/:game/players Assign player to team.
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
export async function assignPlayerToGameById(request: AuthorizedRequest & GameRequest, response: Response) {
    // eslint-disable-next-line no-debugger
    debugger;

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

    const alreadyAssigned = await applicationRepository.isPlayerAlreadyAssignedToAnotherTeam(user, request.game, team);
    if (alreadyAssigned) {
        throw new ApiError({
            error: 'The given user is assigned to another team.',
            code: 409,
        });
    }

    const alreadyLanguageAssigned = await applicationRepository.isGameLanguageAssigned(
        request.game,
        team,
        language.toLowerCase()
    );

    if (alreadyLanguageAssigned) {
        throw new ApiError({
            error: 'The given language is already assigned within the team',
            code: 409,
        });
    }

    // Update the list of languages for the given user and append it the newly
    // assigned one. This will then be updated within the database.
    if (_.isNil(application.assignedLanguages)) application.assignedLanguages = [];

    application.assignedLanguages.push(language);

    await applicationRepository.assignUserToGame(user, request.game, team, application.assignedLanguages);

    if (request.game.status === GameStatus.ACTIVE) {
        await GameService.sendGamePlayersToFirebase(request.game);
    }

    return response.status(201).json(flattenGame(request.game));
}
/**
 * @api {delete} /games/:game/players/:user Remove the assigned player to the given game.
 * @apiName RemoveAssignedPlayerFromGame
 * @apiGroup Games
 * @apiPermission admin
 *
 * @apiParam {Number} user The users id being removed.
 * @apiParam {Number} game The games id which the player has been assigned.
 */
export async function removePlayerFromGameById(request: AuthorizedRequest & GameRequest, response: Response) {
    const { id } = request.body.player;

    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    await gameApplicationRepository.removeUserFromGame({ id } as User, request.game);

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
export async function getAllGameApplicationsById(request: GameRequest, response: Response) {
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);

    const result = await gameApplicationRepository.find({
        where: { game: request.game },
        relations: ['user', 'user.profile', 'user.gameStats'],
    });

    return response.json(
        result.map((application) => {
            const skills = application.user.profile.skills;
            const { wins, loses } = application.user.gameStats;

            delete application.user.profile;
            delete application.user.gameStats;

            return { skills, ...application, statistics: { wins, loses } };
        })
    );
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
export async function applyToGameWithApplicationByIdAndGameId(request: GameRequest & UserRequest, response: Response) {
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
export async function getApplicationByUserIdAndGameId(request: GameRequest & UserRequest, response: Response) {
    const applicationRepository = getCustomRepository(GameApplicationRepository);

    const existingApplication = await applicationRepository.findByUserAndGame(request.boundUser, request.game, [
        'user',
        'user.profile',
        'user.gameStats',
    ]);

    if (!existingApplication) {
        throw new ApiError({
            message: 'A application does not exists for the specified game.',
            code: 409,
        });
    }

    const skills = existingApplication.user.profile.skills;
    const { wins, loses } = existingApplication.user.gameStats;

    delete existingApplication.user.profile;
    delete existingApplication.user.gameStats;

    return response.json({ skills, ...existingApplication, statistics: { wins, loses } });
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
