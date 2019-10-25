import GameSchedule from '../models/GameSchedule';
import GameApplication from '../models/GameApplication';
import User from '../models/User';

export default class GameApplicationSeeding {
    public static default(): GameApplication {
        const schedule = new GameApplication();

        schedule.schedule = null;
        schedule.user = null;

        return schedule;
    }

    public static withScheduleAndUser(schedule: GameSchedule, user: User): GameApplication {
        const application = this.default();

        application.schedule = schedule;
        application.user = user;

        return application;
    }
}
