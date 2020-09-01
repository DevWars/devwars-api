import { EntityRepository, Repository } from 'typeorm';
import Activity from '../models/activity.model';
import User from '../models/user.model';

@EntityRepository(Activity)
export default class ActivityRepository extends Repository<Activity> {
    public findByUser(user: User): Promise<Activity[]> {
        return this.find({ where: { user } });
    }
}
