import { Entity, ManyToOne } from 'typeorm';

import BaseModel from './BaseModel';

import Game from './Game';
import User from './User';

@Entity()
export default class GameApplication extends BaseModel {
    @ManyToOne((type) => Game, (game) => game.userApplications)
    public game: Game;

    @ManyToOne((type) => User, (user) => user.gameApplications)
    public user: User;
}
