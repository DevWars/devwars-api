import * as express from "express";
import {GameController} from "../controllers/game/Game.controller";
import {mustBeRole} from "../middlewares";
import {UserRole} from "../models";

export const GameRoute: express.Router = express.Router()
    .get("/", GameController.all)
    .get("/latest", GameController.latest)
    .get("/:id", GameController.show)
    .put("/:id", mustBeRole(UserRole.ADMIN), GameController.update)
    .get("/season/:season", GameController.bySeason)
    .get("/status/:status", GameController.byStatus);
