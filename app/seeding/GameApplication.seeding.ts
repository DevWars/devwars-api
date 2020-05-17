import Game from '../models/Game';
import GameApplication from '../models/GameApplication';
import User from '../models/User';

export default class GameApplicationSeeding {
    public static default(): GameApplication {
        const schedule = new GameApplication();

        schedule.game = null;
        schedule.user = null;

        return schedule;
    }

    public static withGameAndUser(game: Game, user: User): GameApplication {
        const application = this.default();

        application.game = game;
        application.user = user;

        return application;
    }
}
