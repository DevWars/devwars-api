import Game from '../models/Game';
import GameApplication from '../models/GameApplication';
import User from '../models/User';

export default class GameApplicationFactory {
    public static withGameAndUser(game: Game, user: User): GameApplication {
        const application = new GameApplication();

        application.game = game;
        application.user = user;

        return application;
    }
}
