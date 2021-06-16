import * as _ from 'lodash';
import * as assert from 'assert';
import { Repository, MoreThan, LessThan, FindOneOptions } from 'typeorm';
import { parseISO } from 'date-fns';

export interface PageCursor {
    next: string | null;
    previous: string | null;
}

export default class PaginationService {
    public static async pageRepository<T = any>(
        repository: Repository<T>,
        first: number,
        after: string | null | undefined,
        before: string | null | undefined,
        pointerKey: string | keyof T,
        reverse = false,
        relations: string[] = [],
        extraWhere: FindOneOptions<T>['where'] = {}
    ) {
        // parse out the paging next and previous that was provided, this could
        // be not defined since the user is not paging yet.
        const next = PaginationService.decodeCursorProperties(after);
        const previous = PaginationService.decodeCursorProperties(before);

        const where: any = {};
        const order: FindOneOptions<T>['order'] = {};

        // we are paging forward if previous is not set or previous is set but also
        // first is set, taking priority with going forward rather than paging
        // backwards.
        const forward = _.isNil(previous) || (!_.isNil(next) && !_.isNil(previous));
        const anySet = !_.isNil(previous) || !_.isNil(next);

        // Its important that if we are paging backward, we order in the reverse
        // order, otherwise out paging implementation will be stuck in a loop.
        //
        // Support for reverse requires flipping the ordering when we perform
        // the queries, this supports cases in which you want to order by the
        // newer value rather than the older at the top, e.g recent games list.
        if (!reverse) {
            order[pointerKey as keyof T] = forward ? 'ASC' : 'DESC';
        } else if (reverse) {
            order[pointerKey as keyof T] = forward ? 'DESC' : 'ASC';
        }

        // If we are paging forward, ensure to look at anything more than the
        // last value of the previous query otherwise look less than our
        // previous (which should be our current first value since we got 1+ to
        // ensure forward paging). Flip for reverse ordering.
        if (!reverse) {
            if (forward && !_.isNil(next)) where[pointerKey] = MoreThan(next);
            else if (!_.isNil(previous)) where[pointerKey] = LessThan(previous);
        } else {
            if (forward && !_.isNil(next)) where[pointerKey] = LessThan(next);
            else if (!_.isNil(previous)) where[pointerKey] = MoreThan(previous);
        }

        // We ensure to grab 1 more than we are expecting, this ensures if we
        // are moving forward we *do* have another page and should setup the
        // forward page, and if are going back that we do have another page
        // backwards to setup.
        let data = await repository.find({
            where: Object.assign(where, extraWhere),
            take: first + 1,
            relations,
            order,
        });

        const pagination = PaginationService.generateCursorFromResult(
            data,
            first,
            pointerKey as string,
            !anySet,
            forward
        );

        // Ensure to order before removing our extra value or returning, since
        // when paging backwards, our lookup is going to be the reverse of what
        // we expect, putting the order out.
        data = _.orderBy(data, pointerKey as string, [reverse ? 'desc' : 'asc']);

        // since we have gathered one more additional value, if we still have
        // that additional value (e.g paging in that direction is valid) then we
        // must go and remove it.
        if (forward && _.size(data) === first + 1) data.pop();
        else if (!forward && _.size(data) === first + 1) data.shift();

        return { data, pagination };
    }

    /**
     * Decodes a given string cursor to get the value that will be used in the paging.
     * @param cursor The cursor that is being decoded.
     * @param isDate If the decoded cursor is a date (iso) or not.
     */
    private static decodeCursorProperties(cursor: string | null | undefined, isDate = false): string | Date | null {
        if (!_.isNil(cursor) && _.isString(cursor)) {
            const decodedNext = Buffer.from(cursor, 'base64').toString();

            if (_.includes(decodedNext, '__')) {
                const value = decodedNext.split('__')[1];

                if (isDate) return parseISO(value);
                else return value;
            }
        }

        return null;
    }

    /**
     * Generates the a cursor for paging for the first result in a query, one
     * that does not have a cursor.
     * @param result The result of the first query.
     * @param limit The limit that was being used for the given query.
     * @param pointerKey The pointer key that will be used on the query, this is
     * a property on a record.
     * @param first If this is the first page, (previous will be null)
     * @param forward If this page is going forward.
     */
    private static generateCursorFromResult(
        result: any[],
        limit: number,
        pointerKey: string,
        first: boolean,
        forward: boolean
    ): PageCursor {
        const cursor: PageCursor = { next: null, previous: null };

        assert(!_.isNil(result), 'cursor paging cannot be implemented for a undefined result');
        if (_.isEmpty(result)) return cursor;

        // The first and last result object must have a defined property as a name of the given key.
        assert(!_.isNil(_.first(result)[pointerKey]), 'property must exist on the result object as pointerKey.');
        assert(!_.isNil(_.last(result)[pointerKey]), 'property must exist on the result object as pointerKey.');

        // There will exist another page after this current one (forward)
        if (forward && _.size(result) - 1 === limit) {
            let pointerValue: string | Date = result[limit - 1][pointerKey];

            // if we are using a date time object, then ensure we are in ISO
            // format. Otherwise it will not be in a good format for a cursor.
            if (pointerValue instanceof Date) pointerValue = pointerValue.toISOString();

            cursor.next = Buffer.from(`next__${pointerValue}`).toString('base64');
        } else if (!forward) {
            let pointerValue: string | Date = _.first(result)[pointerKey];

            // if we are using a date time object, then ensure we are in ISO
            // format. Otherwise it will not be in a good format for a cursor.
            if (pointerValue instanceof Date) pointerValue = pointerValue.toISOString();

            cursor.next = Buffer.from(`next__${pointerValue}`).toString('base64');
        }

        // There will exist another page after this current one (backward)
        if (!forward && _.size(result) - 1 === limit) {
            let pointerValue: string | Date = result[limit - 1][pointerKey];

            // if we are using a date time object, then ensure we are in ISO
            // format. Otherwise it will not be in a good format for a cursor.
            if (pointerValue instanceof Date) pointerValue = pointerValue.toISOString();

            cursor.previous = Buffer.from(`prev__${pointerValue}`).toString('base64');
        }

        if (forward && !first && !_.isEmpty(result)) {
            let pointerValue: string | Date  = _.first(result)[pointerKey];

            // if we are using a date time object, then ensure we are in ISO
            // format. Otherwise it will not be in a good format for a cursor.
            if (pointerValue instanceof Date) pointerValue = pointerValue.toISOString();

            cursor.previous = Buffer.from(`prev__${pointerValue}`).toString('base64');
        }

        return cursor;
    }
}
