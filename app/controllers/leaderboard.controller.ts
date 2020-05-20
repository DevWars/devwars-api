import { Request, Response } from 'express';

import User from '../models/user.model';
import { parseIntWithDefault } from '../../test/helpers';
import { DATABASE_MAX_ID } from '../constants';

export async function leaderboards(request: Request, response: Response) {
    const page: number = parseIntWithDefault(request.query.page, 0, 0, DATABASE_MAX_ID);

    const users = await User.createQueryBuilder('user')
        .orderBy('statisticsXp', 'DESC')
        .limit(10)
        .offset(page)
        .getMany();

    return response.json({ count: await User.count(), users });
}
