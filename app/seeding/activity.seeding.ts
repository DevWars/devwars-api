import * as faker from 'faker';
import Activity from '../models/activity.model';
import User from '../models/user.model';

export default class ActivitySeeding {
    public static default(): Activity {
        const activity = new Activity();

        Object.assign(activity, {
            description: faker.random.words(5),
            coins: faker.datatype.number(20000),
            xp: faker.datatype.number(20000),
        });

        return activity;
    }

    public static withUser(user: User): Activity {
        const activity = this.default();

        activity.user = user;

        return activity;
    }
}
