import * as express from "express";
import {ObjectiveController} from "../controllers/game/Objective.controller";

export const ObjectiveRoute: express.Router = express.Router()
    .get("/:game/objectives", ObjectiveController.forGame)
    .post("/:game/objectives", ObjectiveController.store);
