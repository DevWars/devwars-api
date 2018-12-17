import {Activity, User} from "../models";

export class ActivityRepository {

    public static forUser(user: User): Promise<Activity[]> {
        return Activity.find({where: {user}});
    }
}
