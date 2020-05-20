import GameApplication from '../models/gameApplication.model';
import Game from '../models/game.model';
import User from '../models/user.model';

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
