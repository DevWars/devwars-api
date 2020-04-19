import { Request } from 'express';

import User from '../models/User';
import GameSchedule from '../models/GameSchedule';
import Game, { GameMode, GameStatus } from '../models/Game';
import { GameStorage } from '../types/game';

/**
 * Extends the default express request to contain a localized object of the DevWars user, this will
 * be pushed on during the authentication process. And accessible if required.
 */
export interface AuthorizedRequest extends Request {
    user: User;
}

/**
 * Extends the default express request to contain a localized object of the DevWars user, this will
 * be pushed on during the binding middleware stage when specified as a middleware and the user param
 * is specified. process. And accessible if required.
 */
export interface UserRequest extends Request {
    boundUser: User;
}

/**
 * Extends the default express request to contain a localized object of the DevWars game schedule, this will
 * be pushed on during the requests that specify the schedule id in the url. And accessible if required.
 */
export interface ScheduleRequest extends Request {
    schedule: GameSchedule;
}

/**
 * Extends the default express request to contain a localized object of the DevWars game, this will
 * be pushed on during the requests that specify the game id in the url. And accessible if required.
 */
export interface GameRequest extends Request {
    game: Game;
}

/**
 * Extends the default express request to contain the request information to
 * create a new game, this is contained on the body.
 */
export interface CreateGameRequest extends Omit<Request, 'body'> {
    body: {
        // The schedule id that the game is going to be kept too.
        schedule: number;

        // The season the game that is being created will be associated with.
        season: number;

        // The the mode the game is going to be played as, e.g Classic.
        mode: GameMode;

        // The title of the game that is being created.
        title: string;

        // The status the game is going to be in on the creation of the game.
        status?: GameStatus;

        // Any additional storage related information about the game that would
        // exist on the storage.
        storage?: GameStorage;
    };
}

/**
 * Extends the default express request to contain a localized object of the DevWars contact us request, this will
 * include the name, email and message the user is sending with the contact us page.
 */
export interface ContactRequest extends Omit<Request, 'body'> {
    body: {
        name: string;
        email: string;
        message: string;
    };
}
