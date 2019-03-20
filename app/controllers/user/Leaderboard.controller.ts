import { Request, Response } from 'express';
import User from '../../models/User';

export async function leaderboards(request: Request, response: Response) {
    const users = await User.createQueryBuilder('user')
        .orderBy('statisticsXp', 'DESC')
        .limit(10)
        .offset(request.query.page || 0)
        .getMany();

    response.json({
        count: await User.count(),
        users,
    });
}
