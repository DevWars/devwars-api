import * as express from "express";
import {GameController} from "../controllers/game/Game.controller";

export const GameRoute: express.Router = express.Router()
    .get("/", GameController.all)
    .get("/latest", GameController.latest)
    .get("/:id", GameController.show)
    .get("/season/:season", GameController.bySeason)
    .get("/status/:status", GameController.byStatus);
