import { EntityRepository, Repository } from 'typeorm';
import * as _ from 'lodash';

import Game, { GameStatus } from '../models/game.model';

@EntityRepository(Game)
export default class GameRepository extends Repository<Game> {
    public latest(): Promise<Game> {
        return this.findOne({ order: { createdAt: 'DESC' } });
    }

    public active(relations: string[]): Promise<Game> {
        return this.findOne({ where: { status: GameStatus.ACTIVE }, relations });
    }

    public findAllBySeason(season: number): Promise<Game[]> {
        return this.find({ where: { season }, order: { createdAt: 'DESC' } });
    }

    /**
     * Gather all related games to a given season with the option to filter by
     * game status and support paging.
     *
     * @param {number} season The season the games will be gathered within.
     * @param {GameStatus} status The optional status to query by.
     * @param {number} first The number of games to return in the paging.
     * @param {number} after The position in the query to take from.
     * @param {string} orderBy The query to order the games by.
     */
    public async findBySeasonWithPaging({
        first,
        after,
        season,
        status,
        orderBy = 'createdAt',
    }: {
        first: number;
        after: number;
        season: number;
        orderBy?: string;
        status?: GameStatus;
    }): Promise<Game[]> {
        const where: any = { season };

        // if the status is provided then use it in the where clause, otherwise
        // continue as if it was not provided.
        if (!_.isNil(status)) where.status = status;

        return this.find({
            skip: after,
            take: first,
            where,
            order: {
                [orderBy]: 'DESC',
            },
        });
    }
}
