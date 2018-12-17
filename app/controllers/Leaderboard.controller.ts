import {Request, Response} from "express";
import {User} from "../models";

export class LeaderboardController {

    public static async users(request: Request, response: Response) {
        response.json({
            count: await User.count(),
        });
    }

}
