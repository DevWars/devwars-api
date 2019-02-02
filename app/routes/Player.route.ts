import * as express from "express";
import {PlayerController} from "../controllers/game/Player.controller";
import {mustBeRole} from "../middlewares";
import {UserRole} from "../models";

export const PlayerRoute: express.Router = express.Router()
    .post("/team/:team/players", mustBeRole(UserRole.ADMIN), PlayerController.addPlayer)
    .get("/:game/team/:team/players", PlayerController.forTeam);
