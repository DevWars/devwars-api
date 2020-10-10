import { EntityRepository, Repository, LessThanOrEqual } from 'typeorm';
import Rank from '../models/rank.model';

@EntityRepository(Rank)
export default class RankRepository extends Repository<Rank> {
    /**
     * Locate the closet rank to a given experience (closest min)
     * @param experience The experience to locate the rank.k
     */
    public async getRankFromExperience(experience: number) {
        return this.findOne({
            select: ['level', 'name'],
            where: { totalExperience: LessThanOrEqual(experience) },
            order: { totalExperience: 'DESC' },
        });
    }
}
