import { EntityRepository, Repository } from 'typeorm';
import Game from '../models/Game';
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

    public findByGame(game: Game): Promise<GameSchedule> {
        return GameSchedule.findOne({ where: { game } });
    }
}
