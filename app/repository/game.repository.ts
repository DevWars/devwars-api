import { EntityRepository, Repository } from 'typeorm';
import * as _ from 'lodash';

import Game from '../models/game.model';

@EntityRepository(Game)
export default class GameRepository extends Repository<Game> {
    /**
     * Attempts to find all the games that have a title..
     *
     * @param title  The title of the game being looked up.j
     * @param limit The upper limit of the number of games.
     */
    public async getGamesLikeTitle(title: string, limit = 50, relations: string[] = []): Promise<Game[]> {
        let query = this.createQueryBuilder('game');

        if (!_.isEmpty(title))
            query = query.where('LOWER(game.title) LIKE :title', { title: `%${title.toLowerCase()}%` });

        _.forEach(relations, (relation) => (query = query.leftJoinAndSelect(`game.${relation}`, relation)));
        return query.take(limit).getMany();
    }
}
