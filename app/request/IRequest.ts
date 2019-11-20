import { Request } from 'express';

import User from '../models/User';
import GameSchedule from '../models/GameSchedule';
import Game from '../models/Game';

/**
 * Extends the default express request to contain a localized object of the DevWars user, this will
 * be pushed on during the authentication process. And accessible if required.
 */
export interface IRequest extends Request {
    user: User;
}

/**
 * Extends the default express request to contain a localized object of the DevWars user, this will
 * be pushed on during the binding middleware stage when specified as a middleware and the user param
 * is specified. process. And accessible if required.
 */
export interface IUserRequest extends Request {
    boundUser: User;
}

/**
 * Extends the default express request to contain a localized object of the DevWars game schedule, this will
 * be pushed on during the requests that specify the schedule id in the url. And accessible if required.
 */
export interface IScheduleRequest extends Request {
    schedule: GameSchedule;
}

/**
 * Extends the default express request to contain a localized object of the DevWars game, this will
 * be pushed on during the requests that specify the game id in the url. And accessible if required.
 */
export interface IGameRequest extends Request {
    game: Game;
}
