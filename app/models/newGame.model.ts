import { Column, Entity } from 'typeorm';

import { GameStorage } from '../types/newGame';
import BaseModel from './base.model';

@Entity('new_game')
export default class NewGame extends BaseModel {
    @Column()
    public title: string;

    @Column()
    public season: number;

    @Column()
    public mode: string;

    @Column({ nullable: true })
    public videoUrl: string;

    @Column({ type: 'jsonb', default: {} })
    public storage: GameStorage;
}
