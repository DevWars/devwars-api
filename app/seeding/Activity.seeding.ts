import { random } from 'faker';
import Activity from '../models/Activity';
import User from '../models/User';

export default class ActivitySeeding {
    public static default(): Activity {
        const activity = new Activity();

        Object.assign(activity, {
            description: random.words(5),
            coins: random.number(20000),
            xp: random.number(20000),
        });

        return activity;
    }

    public static withUser(user: User): Activity {
        const activity = this.default();

        activity.user = user;

        return activity;
    }
}
