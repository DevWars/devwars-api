import { Entity, Column } from 'typeorm';
import BaseModel from './base.model';

export enum BadgeVariant {
    Bronze = 0,
    Silver = 1,
    Gold = 2,
    Diamond = 3,
}

@Entity('badge')
export default class Badge extends BaseModel {
    @Column({ name: 'badge_name' })
    public name: string;

    @Column({ name: 'badge_description' })
    public description: string;

    @Column({ name: 'badge_awarding_experience' })
    public awardingExperience: number;

    @Column({ name: 'badge_awarding_coins' })
    public awardingCoins: number;

    @Column({ name: 'badge_variant' })
    public variant: BadgeVariant;
}
