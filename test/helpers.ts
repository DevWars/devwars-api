import User from '../app/models/User';
import { AuthService } from '../app/services/Auth.service';
import { isNumber, isNil } from 'lodash';

export const cookieForUser = async (user: User): Promise<string> => {
    return `token=${await AuthService.newToken(user)}`;
};

/**
 * Takes in a possible int value, ensures its a number and within a given bound. Returning the
 * parsed number if so otherwise the fallback default value (default: 0). Used during the parsing of
 * possible numerical values within a query.
 *
 * @param possible The possible value to be parsed.
 * @param def The fallback default value.
 * @param lower The lower bounds of the value.
 * @param upper The upper bounds of the value.
 */
export const parseIntWithDefault = (possible: any, def: number = 0, lower?: number, upper?: number): number => {
    if (isNil(possible) || !isNumber(Number(possible))) {
        return def;
    }

    const result = Number(possible);

    if (!isNil(lower) && result < lower) return def;
    if (!isNil(upper) && result > upper) return def;

    return result;
};
