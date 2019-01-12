import * as express from "express";

import {mustBeAuthenticated, mustBeCompetitor} from "../middlewares";

import {GameApplicationController} from "../controllers/game/GameApplication.controller";

export const GameApplicationRoute: express.Router = express.Router()
    .get("/applications/mine", mustBeAuthenticated, GameApplicationController.mine)
    .get("/entered/mine", mustBeAuthenticated, GameApplicationController.entered)
    .get("/:game/applications", GameApplicationController.forGame)
    .post("/:game/applications", mustBeAuthenticated, mustBeCompetitor, GameApplicationController.apply);
