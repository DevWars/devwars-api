import * as express from "express";

import {mustBeAuthenticated, mustBeCompetitor, mustBeRole} from "../middlewares";

import {GameApplicationController} from "../controllers/game/GameApplication.controller";
import {UserRole} from "../models";

export const GameApplicationRoute: express.Router = express.Router()
    .get("/applications/mine", mustBeAuthenticated, GameApplicationController.mine)
    .get("/entered/mine", mustBeAuthenticated, GameApplicationController.entered)
    .get("/:game/applications", GameApplicationController.forGame)
    .post("/:game/applications/:username", mustBeRole(UserRole.ADMIN), GameApplicationController.applyByUsername)
    .post("/:game/applications", mustBeAuthenticated, mustBeCompetitor, GameApplicationController.apply);
