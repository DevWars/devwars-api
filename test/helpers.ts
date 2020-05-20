import * as fs from 'fs';
import * as _ from 'lodash';

import { AuthService } from '../app/services/Auth.service';
import User from '../app/models/user.model';

export const cookieForUser = async (user: User): Promise<string> => {
    return `token=${await AuthService.newToken(user)}`;
};

/**
 * Takes in a possible string value, ensures its a string and within a given length bound. Returning
 * the parsed string if so otherwise the fallback default value (default: null). Used during the
 * parsing of possible string values within a query.
 *
 * @param possible The possible value to be parsed.
 * @param def The fallback default value.
 * @param min The lower bounds of the value length.
 * @param max The upper bounds of the value length.
 */
export const parseStringWithDefault = (possible: any, def: any = null, min?: number, max?: number): string => {
    if (_.isNil(possible) || !_.isString(possible)) {
        return def;
    }

    const result = `${possible}`;

    if (!_.isNil(min) && result.length < min) return def;
    if (!_.isNil(max) && result.length > max) return def;

    return result;
};

/**
 * Takes in a express query parameter and attempts to parse it out as an array of strings. Removing
 * all duplicates, values that could not be parsed, and respecting the min and max length limits.
 *
 * @param parameter The array or single item that is being parsed into a int array.
 * @param min The lower limit of the possible length.
 * @param max The upper limit of the possible length.
 */
export const parseStringsFromQueryParameter = (parameter: any, min?: number, max?: number): string[] => {
    // If the given parameter is not an array but is a given single item (which express does) see if
    // we can parse it and return a single item, otherwise continue onward.
    if (!_.isArray(parameter) && parseStringWithDefault(parameter, null, min, max) !== null) {
        return [parseStringWithDefault(parameter, null, min, max)];
    }

    // If we could not parse the single item and its not a array, then return a empty list back.
    if (!_.isArray(parameter)) return [];

    // Return compacted list of all the ids parsed, removing any that could not be parsed and any
    // duplicates that existed.
    return _.uniq(_.compact(_.map(parameter, (e) => parseStringWithDefault(e, null, min, max))));
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
export const parseIntWithDefault = (possible: any, def = 0, lower?: number, upper?: number): number => {
    if (_.isNil(possible) || !_.isNumber(Number(possible)) || isNaN(Number(possible))) {
        return def;
    }

    const result = Number(possible);

    if (!_.isNil(lower) && result < lower) return def;
    if (!_.isNil(upper) && result > upper) return def;

    return result;
};

/**
 * Takes in a possible enum value, ensures its a string and attempts to parse
 * the value into the enum.
 *
 * @param type The type of the enum being parsed.
 * @param possible The possible value to be parsed.
 * @param def The fallback default value.
 */
export function parseEnumFromValue<T>(type: T, possible: any, def: T[keyof T] | null): T[keyof T] | null {
    if (_.isNil(possible)) return def;

    if (_.isString(possible)) {
        const typed = possible as keyof T;
        if (!_.isNil(typed)) return type[typed] as T[keyof T];
    }

    return def;
}

/**
 * Parses any given object and attempts to form a boolean value. This includes 1,0 (number and strings),
 * @param possible The possible value to be parsed.
 * @param def The default value ot be returned otherwise if not a boolean.
 */
export const parseBooleanWithDefault = (possible: any, def = false): boolean => {
    if (_.isNil(possible)) return def;

    if (possible === 1 || possible === 0) return Boolean(possible);
    if (possible === '0' || possible === '1') return possible === '1';
    if (possible === 'true' || possible === 'false') return possible === 'true';

    return !_.isBoolean(possible) ? def : Boolean(possible);
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
