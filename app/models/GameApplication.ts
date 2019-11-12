import { Entity, ManyToOne } from 'typeorm';

import BaseModel from './BaseModel';

import GameSchedule from './GameSchedule';
import User from './User';

@Entity('game_application')
export default class GameApplication extends BaseModel {
    @ManyToOne(() => GameSchedule, (schedule) => schedule.applications, { onDelete: 'CASCADE' })
    public schedule: GameSchedule;

    @ManyToOne(() => User, (user) => user.applications)
    public user: User;

    /**
     * Creates a new instance of the game application instance.
     * @param gameSchedule The game schedule that the user is applying to.
     * @param user The user who is applying to the game schedule.
     */
    constructor(gameSchedule?: GameSchedule, user?: User) {
        super();

        this.schedule = gameSchedule;
        this.user = user;
    }
}
