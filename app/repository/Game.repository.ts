import { EntityRepository, Repository } from 'typeorm';
import Game from '../models/Game';
import { GameStatus } from '../models/GameSchedule';

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

    public async findBySeasonWithPaging({
        first,
        after,
        season,
        orderBy = 'createdAt',
    }: {
        first: number;
        after: number;
        season: number;
        orderBy: string;
        relations: string[];
    }): Promise<Game[]> {
        return this.find({
            skip: after,
            take: first,
            where: {
                season,
            },
            order: {
                [orderBy]: 'DESC',
            },
        });
    }
}
