import {Column, Entity, ManyToOne} from 'typeorm';
import BaseModel from './BaseModel';
import {User} from './User';

import {randomString} from '../utils/random';

@Entity('password_resets')
export class PasswordReset extends BaseModel {
    @Column({default: ''})
    public token: string;

    @ManyToOne((type) => User, (user) => user.passwordResets)
    public user: User;

    constructor(user: User) {
        super();

        this.user = user;
        this.token = randomString(32);
    }
}
