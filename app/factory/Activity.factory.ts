import { date, random } from 'faker';
import Activity from '../models/Activity';
import User from '../models/User';

export class ActivityFactory {
    public static default(): Activity {
        const activity = new Activity();

        Object.assign(activity, {
            coins: random.number(20000),
            createdAt: date.past(),
            description: random.words(5),
            updatedAt: date.past(),
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
