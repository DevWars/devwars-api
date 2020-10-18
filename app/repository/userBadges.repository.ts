import { EntityRepository, Repository } from 'typeorm';
import UserBadges from '../models/userBadges.model';

@EntityRepository(UserBadges)
export default class UserBadgesRepository extends Repository<UserBadges> {}
