import { Entity, ManyToOne, JoinColumn } from 'typeorm';

import Badge from './badge.model';
import User from './user.model';
import BaseModel from './base.model';

@Entity('user_badges_badge')
export default class UserBadges extends BaseModel {
    // ------------------------------------------------------------
    // Relations
    // ------------------------------------------------------------

    @ManyToOne(() => Badge, (badge) => badge.id)
    @JoinColumn({ name: 'badgeId' })
    public badge: Badge;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'userId' })
    public user: User;

    constructor(user: User, badge: Badge) {
        super();

        this.user = user;
        this.badge = badge;
    }
}
