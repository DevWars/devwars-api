import * as fs from 'fs';
import { isNumber, isNil, isBoolean } from 'lodash';

import { AuthService } from '../app/services/Auth.service';
import User from '../app/models/User';

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
    if (isNil(possible) || !isNumber(Number(possible)) || isNaN(Number(possible))) {
        return def;
    }

    const result = Number(possible);

    if (!isNil(lower) && result < lower) return def;
    if (!isNil(upper) && result > upper) return def;

    return result;
};

/**
 * Parses any given object and attempts to form a boolean value. This includes 1,0 (number and strings),
 * @param possible The possible value to be parsed.
 * @param def The default value ot be returned otherwise if not a boolean.
 */
export const parseBooleanWithDefault = (possible: any, def: boolean = false): boolean => {
    if (isNil(possible)) return def;

    if (possible === 1 || possible === 0) return Boolean(possible);
    if (possible === '0' || possible === '1') return possible === '1';
    if (possible === 'true' || possible === 'false') return possible === 'true';

    return !isBoolean(possible) ? def : Boolean(possible);
};

/**
 * Returns true or false based on the existence of a file.
 * @param path The file path that will be checked for existence.
 */
export const pathExists = (path: string): boolean => {
    return fs.existsSync(path);
};

/**
 * Returns true or false based on the access of a file based on the provided mode (fs.constants).
 * @param path The file path that will be checked for access.
 * @param mode The mode to attempt to access, e.g read, write. (use fs.constants)
 */
export const canAccessPath = (path: string, mode?: number): boolean => {
    try {
        fs.accessSync(path, mode);
        return true;
    } catch (error) {
        return error.code === 'ENOENT';
    }
};
