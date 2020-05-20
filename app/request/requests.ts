import { Request } from 'express';

import User from '../models/user.model';
import Game, { GameMode, GameStatus } from '../models/game.model';
import { GameEditorTemplates } from '../types/common';

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
        // The start time the game is going to take place.
        startTime: Date;

        // The season the game that is being created will be associated with.
        season: number;

        // The the mode the game is going to be played as, e.g Classic.
        mode: GameMode;

        // The title of the game that is being created.
        title: string;

        // The video url of the game that is being created.
        videoUrl?: string;

        // The status the game is going to be in on the creation of the game.
        status?: GameStatus;

        // The related templates for the given game.
        templates?: GameEditorTemplates;
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
