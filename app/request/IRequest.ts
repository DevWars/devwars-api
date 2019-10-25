import { Request } from 'express';

import User from '../models/User';

/**
 * Extends the default express request to contain a localized object of the devwars user, this will
 * be pushed on during the authentication process. And accessible if required.
 */
export interface IRequest extends Request {
    user: User;
}
