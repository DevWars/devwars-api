import { EntityRepository, Repository } from 'typeorm';
import GameSchedule, { GameStatus } from '../models/GameSchedule';
import GameApplication from '../models/GameApplication';
import User from '../models/User';

@EntityRepository(GameSchedule)
export default class GameScheduleRepository extends Repository<GameSchedule> {
    public all(): Promise<GameSchedule[]> {
        return GameSchedule.find({
            order: {
                startTime: 'DESC',
            },
        });
    }

    public latest(): Promise<GameSchedule> {
        return GameSchedule.findOne({ order: { startTime: 'DESC' } });
    }

    public findAllByStatus(status: GameStatus): Promise<GameSchedule[]> {
        return GameSchedule.find({ where: { status } });
    }

    public async findApplicationsByUser(user: User): Promise<GameSchedule[]> {
        return GameSchedule.createQueryBuilder('game_schedule')
            .where((qb) => {
                const subQuery = qb
                    .subQuery()
                    .select('application.schedule_id')
                    .from(GameApplication, 'application')
                    .where('application.user_id = :user')
                    .getSql();

                return 'schedule.id in ' + subQuery;
            })
            .setParameter('user', user.id)
            .getMany();
    }
}
