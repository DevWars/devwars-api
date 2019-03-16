import {Competitor, User} from '../models';

export class CompetitorRepository {

    public static forUser(user: User): Promise<Competitor> {
        return Competitor.findOne({where: {user}});
    }

}
