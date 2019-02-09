import {Request, Response} from "express";
import {GameRepository, UserRepository} from "../../repository";
import {GameApplicationFactory} from "../../factory/GameApplication.factory";

export class GameApplicationController {
    /**
     * @api {post} /game/:game/applications Apply the signed in user to a game
     * @apiVersion 1.0.0
     * @apiName apply
     * @apiGroup GameApplication
     *
     * @apiParam {Number} Game ID
     *
     * @apiSuccess {String} message Registration success message
     * @apiError {String} message Registration error message
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *         message: "You have successfully applied to the game"
     *     }
     * @apiErrorExample Error-Response:
     *     HTTP/1.1 409 Forbidden
     *     {
     *         message: "You are already applied to this game"
     *     }
     */
    public static async apply(request: Request, response: Response) {
        const user = await UserRepository.userForToken(request.cookies.auth);
        const game = await GameRepository.byId(request.params.game);

        if (!game) {
            return response.status(400).send("Game not found");
        }

        await GameApplicationFactory.withGameAndUser(game, user).save();

        return response.json(game);
    }

    public static async applyByUsername(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.game);
        const user = await UserRepository.byUsername(request.params.username);

        if (!game || !user) {
            return response.status(400).json({
                message: "Either game or user did not exist",
            });
        }

        await GameApplicationFactory.withGameAndUser(game, user).save();

        response.json({
            message: "Applied",
        });
    }

    public static async forGame(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.game);

        if (!game) {
            return response.status(400).send("Game not found");
        }

        response.json(await UserRepository.byAppliedGame(game));
    }

    public static async mine(request: Request, response: Response) {
        const user = await UserRepository.userForToken(request.cookies.auth);

        response.json(await GameRepository.byUserApplication(user));
    }

    public static async entered(request: Request, response: Response) {
        const user = await UserRepository.userForToken(request.cookies.auth);

        response.json(await user.playedGames);
    }
}
