import {Request, Response} from "express";
import {GameRepository, UserRepository} from "../../repository";

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

        const appliedUsers = await game.appliedUsers;
        game.appliedUsers = Promise.resolve([...appliedUsers, user]);

        response.json(await game.save());
    }

    public static async mine(request: Request, response: Response) {
        const user = await UserRepository.userForToken(request.cookies.auth);

        response.json(await user.appliedGames);
    }

    public static async entered(request: Request, response: Response) {
        const user = await UserRepository.userForToken(request.cookies.auth);

        response.json(await user.playedGames);
    }
}
