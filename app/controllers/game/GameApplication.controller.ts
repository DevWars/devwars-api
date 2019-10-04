import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express';

import GameApplicationFactory from '../../factory/GameApplication.factory';
import GameScheduleRepository from '../../repository/GameSchedule.repository';
import GameApplicationRepository from '../../repository/GameApplication.repository';
import GameRepository from '../../repository/Game.repository';
import UserRepository from '../../repository/User.repository';

import { AuthService } from '../../services/Auth.service';
import GameApplication from '../../models/GameApplication';
import { IRequest } from '../../request/IRequest';
import * as _ from 'lodash';

export async function mine(request: IRequest, response: Response) {
    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const applications = await gameApplicationRepository.findByUser(request.user);

    response.json(applications);
}

export async function apply(request: IRequest, response: Response) {
    const scheduleId = request.params.schedule;

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const application = await GameApplicationFactory.withScheduleAndUser(schedule, request.user).save();
    return response.json(application);
}

export async function resign(request: IRequest, response: Response) {
    const scheduleId = request.params.schedule;

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const gameApplicationRepository = getCustomRepository(GameApplicationRepository);
    const deleteApplication = await gameApplicationRepository.delete({ user: request.user, schedule });

    return response.json(deleteApplication);
}

export async function findBySchedule(request: Request, response: Response) {
    const scheduleId = request.params.schedule;

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findOne(scheduleId);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const userRepository = getCustomRepository(UserRepository);
    const applications = await userRepository.findApplicationsBySchedule(schedule);

    response.json(applications);
}

/**
 * @api {get} /applications/game/:gameId Gather a list of game applications
 * @apiDescription Finds a list of game applications for a given game, sending back the list of
 * users information for a given game, this will  be used for the assignment process of a given
 * game. The game must exist for any game applications to also exist.
 * @apiVersion 1.0.0
 * @apiName GameApplications
 * @apiGroup Applications
 *
 * @apiSuccess {User[]} A list of game applications for a given game id.
 *
 * @apiError GameIdNotDefined Invalid game id provided.
 * @apiError GameDoesNotExist A game does not exist by the provided gam id.
 *
 */
export async function findByGame(request: Request, response: Response) {
    const gameId = request.params.game;

    // Ensure that if the game id route was not setup correctly and the given game id was null or
    // undefined, return out and warn the user of the given action.
    if (_.isNil(gameId)) return response.status(400).json({ error: 'Invalid game id provided.' });

    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);

    // If a game does not exit by the provided id, ensure that we let the current moderator /
    // administrator aware. Likely to occur with out to date UI or direct api queries.
    if (_.isNil(game)) return response.status(404).json({ error: 'A game does not exist by the provided game id.' });

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findByGame(game);

    if (_.isNil(schedule))
        return response.sendStatus(404).json({
            error: 'A game schedule does not exist for the given id.',
        });

    const userRepository = getCustomRepository(UserRepository);
    let applications = (await userRepository.findApplicationsBySchedule(schedule)) || [];

    // Once we get the applications back from the given schedule, all private user information will
    // exist on the objects. Mapping through the sanitizer will remove key information and the
    // additional provided fields.
    const sanizationFields = ['updatedAt', 'createdAt', 'lastSignIn', 'email'];
    applications = applications.map((user) => AuthService.sanitizeUser(user, sanizationFields));

    response.json(applications);
}

export async function create(request: IRequest, response: Response) {
    const gameId = request.params.game;
    const username = request.params.username;

    const gameRepository = getCustomRepository(GameRepository);
    const game = await gameRepository.findOne(gameId);

    const gameScheduleRepository = getCustomRepository(GameScheduleRepository);
    const schedule = await gameScheduleRepository.findByGame(game);

    if (_.isNil(schedule)) return response.sendStatus(404);

    const userRepository = getCustomRepository(UserRepository);
    const user = await userRepository.findByUsername(username);

    if (_.isNil(user)) return response.sendStatus(404);

    const application = new GameApplication();
    application.schedule = schedule;
    application.user = user;

    await application.save();

    response.json(application);
}
