import {Game, GameApplication, User} from "../models";

export class GameApplicationFactory {
    public static withGameAndUser(game: Game, user: User): GameApplication {
        const application = new GameApplication();

        application.game = game;
        application.user = user;

        return application;
    }
}
