import { Entity, ManyToOne } from 'typeorm';

import BaseModel from './BaseModel';

import GameSchedule from './GameSchedule';
import User from './User';

@Entity('game_application')
export default class GameApplication extends BaseModel {
    @ManyToOne((type) => GameSchedule, (schedule) => schedule.applications)
    public schedule: GameSchedule;

    @ManyToOne((type) => User, (user) => user.applications)
    public user: User;
}
