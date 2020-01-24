import { EntityRepository, Repository } from 'typeorm';
import Game from '../models/Game';
import GameSchedule, { GameStatus } from '../models/GameSchedule';

@EntityRepository(GameSchedule)
export default class GameScheduleRepository extends Repository<GameSchedule> {
    public all(): Promise<GameSchedule[]> {
        return this.find({ order: { startTime: 'DESC' }, relations: ['game'] });
    }

    /**
     *  Returns a given game schedule by the identifier, ensuring that the identifier is a number
     *  before attempting to gather. Additionally gathers the related game if it exists.
     *  @param identifier The identifier of the game schedule being found.
     */
    public async findById(identifier: string | number): Promise<GameSchedule> {
        if (isNaN(Number(identifier))) return null;

        return this.findOne({ where: { id: identifier }, relations: ['game'] });
    }

    public latest(): Promise<GameSchedule> {
        return this.findOne({ order: { startTime: 'DESC' }, relations: ['game'] });
    }

    public findAllByStatus(status: GameStatus): Promise<GameSchedule[]> {
        return this.find({ where: { status }, relations: ['game'] });
    }

    public findByGame(game: Game): Promise<GameSchedule> {
        return this.findOne({ where: { game }, relations: ['game'] });
    }
}
