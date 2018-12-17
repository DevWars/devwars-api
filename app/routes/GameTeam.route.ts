import * as express from "express";
import {GameTeamController} from "../controllers/game/GameTeam.controller";

export const GameTeamRoute: express.Router = express.Router()
    .get("/:game/teams", GameTeamController.forGame);
