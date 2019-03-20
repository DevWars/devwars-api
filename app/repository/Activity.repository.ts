import Activity from '../models/Activity';
import User from '../models/User';

export default class ActivityRepository {
    public static forUser(user: User): Promise<Activity[]> {
        return Activity.find({ where: { user } });
    }
}
