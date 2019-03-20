import { EntityRepository, Repository } from 'typeorm';
import Activity from '../models/Activity';
import User from '../models/User';

@EntityRepository(Activity)
export default class ActivityRepository extends Repository<Activity> {
    public findByUser(user: User): Promise<Activity[]> {
        return Activity.find({ where: { user } });
    }
}
