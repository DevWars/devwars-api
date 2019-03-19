import { Column, Entity, ManyToOne } from 'typeorm';
import BaseModel from './BaseModel';
import User from './User';

@Entity('email_verifications')
export default class EmailVerification extends BaseModel {
    @Column({ default: '' })
    public token: string;

    @ManyToOne((type) => User, (user) => user.verifications, { eager: true })
    public user: User;
}
