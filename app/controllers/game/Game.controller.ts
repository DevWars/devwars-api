import {Request, Response} from "express";

import {Game, GameStatus, GameTeam} from "../../models";

import {getConnection} from "typeorm";
import {GameFactory, GameTeamFactory} from "../../factory";
import {GameRepository, GameTeamRepository} from "../../repository";
import {IUpdateGameRequest} from "../../request/IUpdateGameRequest";
import GameService from "../../services/Game.service";

export class GameController {
    /**
     * @api {get} /game Get games
     * @apiVersion 1.0.0
     * @apiName all
     * @apiGroup Game
     *
     * @apiSuccess {Date} game.createdAt     Time created
     * @apiSuccess {Date} game.updatedAt     Time updated
     * @apiSuccess {Boolean} game.active     Toggle for whether or not the game is active
     * @apiSuccess {Number} game.status      Status of game by enum
     * @apiSuccess {Date} game.startTime     Start time of game
     * @apiSuccess {Number} game.season      Season number game was broadcasted
     * @apiSuccess {String} game.name        Type of game mode
     * @apiSuccess {String} game.theme       Short description for what this game is about
     * @apiSuccess {String} game.videoUrl  Link to the video recording for this game
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     [
     *       {
     *         "id": 1,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "active": false,
     *         "status": 0,
     *         "startTime": "2018-03-11T06:53:40.352Z",
     *         "season": 3,
     *         "name": "Blitz",
     *         "theme": "Online Chat",
     *         "videoUrl": "https://www.youtube.com/watch?v=RItASROFU0Y"
     *       }
     *     ]
     */

    public static async all(request: Request, response: Response) {
        const games = await GameRepository.all();

        response.json(games);
    }

    /**
     * @api {get} /game/:id Get game
     * @apiVersion 1.0.0
     * @apiName show
     * @apiGroup Game
     *
     * @apiParam {Number} Game ID
     *
     * @apiSuccess {Date} game.createdAt     Time created
     * @apiSuccess {Date} game.updatedAt     Time updated
     * @apiSuccess {Boolean} game.active     Toggle for whether or not the game is active
     * @apiSuccess {Number} game.status      Status of game by enum
     * @apiSuccess {Date} game.startTime     Start time of game
     * @apiSuccess {Number} game.season      Season number game was broadcasted
     * @apiSuccess {String} game.name        Type of game mode
     * @apiSuccess {String} game.theme       Short description for what this game is about
     * @apiSuccess {String} game.videoUrl  Link to the video recording for this game
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "id": 1,
     *       "createdAt": "2018-10-21T21:45:45.000Z",
     *       "updatedAt": "2018-10-21T21:45:45.000Z",
     *       "active": false,
     *       "status": 0,
     *       "startTime": "2018-03-11T06:53:40.352Z",
     *       "season": 3,
     *       "name": "Blitz",
     *       "theme": "Online Chat",
     *       "videoUrl": "https://www.youtube.com/watch?v=RItASROFU0Y"
     *     }
     */

    public static async show(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.game);

        if (!game) {
            return response.status(404).send("No game for this ID");
        }

        response.json(game);
    }

    public static async update(request: Request, response: Response) {
        const id = request.params.id;
        const params = request.body as IUpdateGameRequest;

        let game = await GameRepository.byId(id);

        Object.assign(game, params);
        game.startTime = new Date(params.startTime);

        game.teams = undefined;
        game.objectives = undefined;

        await game.save();

        const isActive = game.status === GameStatus.ACTIVE;

        game = await GameRepository.byId(game.id);

        if (game.status === GameStatus.ACTIVE) {
            await GameService.sendGameToFirebase(game);
        }

        response.json(game);
    }

    public static async end(request: Request, response: Response) {
        const game = await GameRepository.byId(request.params.id);
        const winner = await GameTeamRepository.byId(request.query.winner);

        if (!game) {
            return response.status(404).send("No game for this ID");
        }

        await GameService.backupGame(game);
        await GameService.endGame(game, winner);

        response.json({
            message: "Success",
        });
    }

    /**
     * @api {get} /game/latest Get latest game
     * @apiVersion 1.0.0
     * @apiName latest
     * @apiGroup Game
     *
     * @apiSuccess {Date} game.createdAt     Time created
     * @apiSuccess {Date} game.updatedAt     Time updated
     * @apiSuccess {Boolean} game.active     Toggle for whether or not the game is active
     * @apiSuccess {Number} game.status      Status of game by enum
     * @apiSuccess {Date} game.startTime     Start time of game
     * @apiSuccess {Number} game.season      Season number game was broadcasted
     * @apiSuccess {String} game.name        Type of game mode
     * @apiSuccess {String} game.theme       Short description for what this game is about
     * @apiSuccess {String} game.videoUrl  Link to the video recording for this game
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "id": 1,
     *       "createdAt": "2018-10-21T21:45:45.000Z",
     *       "updatedAt": "2018-10-21T21:45:45.000Z",
     *       "active": false,
     *       "status": 0,
     *       "startTime": "2018-03-11T06:53:40.352Z",
     *       "season": 3,
     *       "name": "Blitz",
     *       "theme": "Online Chat",
     *       "videoUrl": "https://www.youtube.com/watch?v=RItASROFU0Y"
     *     }
     */

    public static async latest(request: Request, response: Response) {
        const game = await GameRepository.latest();

        if (!game) {
            return response.status(404).send("There is not latest game to be found");
        }

        response.json(game);
    }

    /**
     * @api {get} /game/season/:season Get games from season
     * @apiVersion 1.0.0
     * @apiName bySeason
     * @apiGroup Game
     *
     * @apiParam {Number} Season number
     *
     * @apiSuccess {Date} game.createdAt     Time created
     * @apiSuccess {Date} game.updatedAt     Time updated
     * @apiSuccess {Boolean} game.active     Toggle for whether or not the game is active
     * @apiSuccess {Number} game.status      Status of game by enum
     * @apiSuccess {Date} game.startTime     Start time of game
     * @apiSuccess {Number} game.season      Season number game was broadcasted
     * @apiSuccess {String} game.name        Type of game mode
     * @apiSuccess {String} game.theme       Short description for what this game is about
     * @apiSuccess {String} game.videoUrl  Link to the video recording for this game
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     [
     *       {
     *         "id": 1,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "active": false,
     *         "status": 0,
     *         "startTime": "2018-03-11T06:53:40.352Z",
     *         "season": 3,
     *         "name": "Blitz",
     *         "theme": "Online Chat",
     *         "videoUrl": "https://www.youtube.com/watch?v=RItASROFU0Y"
     *       }
     *     ]
     */

    public static async bySeason(request: Request, response: Response) {
        const season = request.params.season;

        const games = await GameRepository.bySeason(season);

        response.json(games);
    }

    /**
     * @api {get} /game/status/:status Get games from status
     * @apiVersion 1.0.0
     * @apiName byStatus
     * @apiGroup Game
     *
     * @apiParam {Number} Status Enum
     *
     * @apiSuccess {Date} game.createdAt     Time created
     * @apiSuccess {Date} game.updatedAt     Time updated
     * @apiSuccess {Boolean} game.active     Toggle for whether or not the game is active
     * @apiSuccess {Number} game.status      Status of game by enum
     * @apiSuccess {Date} game.startTime     Start time of game
     * @apiSuccess {Number} game.season      Season number game was broadcasted
     * @apiSuccess {String} game.name        Type of game mode
     * @apiSuccess {String} game.theme       Short description for what this game is about
     * @apiSuccess {String} game.videoUrl  Link to the video recording for this game
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     [
     *       {
     *         "id": 1,
     *         "createdAt": "2018-10-21T21:45:45.000Z",
     *         "updatedAt": "2018-10-21T21:45:45.000Z",
     *         "active": false,
     *         "status": 0,
     *         "startTime": "2018-03-11T06:53:40.352Z",
     *         "season": 3,
     *         "name": "Blitz",
     *         "theme": "Online Chat",
     *         "videoUrl": "https://www.youtube.com/watch?v=RItASROFU0Y"
     *       }
     *     ]
     */

    public static async byStatus(request: Request, response: Response) {
        const toEnum: string = (request.params.status || "").toUpperCase();
        const status: GameStatus = (GameStatus as any)[toEnum];

        const games = await GameRepository.byStatus(status);

        response.json(games);
    }

    public static async createGame(request: Request, response: Response) {
        const {name, timestamp} = request.body;

        let game = new Game();

        game.name = name;
        game.startTime = new Date(timestamp);
        await game.save();

        for (const teamName of ["blue", "red"]) {
            const team = new GameTeam();

            team.name = teamName;
            team.game = game;

            await team.save();
        }

        game = await GameRepository.byId(game.id);

        response.json(game);
    }

    // TO-DO: past() games with the status of ENDED
}
