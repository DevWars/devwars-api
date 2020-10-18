import { EntityRepository, Repository } from 'typeorm';
import Badge from '../models/badge.model';

@EntityRepository(Badge)
export default class BadgeRepository extends Repository<Badge> {}
