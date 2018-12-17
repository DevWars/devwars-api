import * as express from "express";
import {PlayerController} from "../controllers/game/Player.controller";

export const PlayerRoute: express.Router = express.Router()
    .get("/:game/team/:team/players", PlayerController.forTeam);
