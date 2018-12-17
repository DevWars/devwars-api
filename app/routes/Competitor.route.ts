import * as express from "express";
import {CompetitorController} from "../controllers/user/Competitor.controller";
import {mustOwnUser} from "../middlewares/OwnsUser";

export const CompetitorRoute: express.Router = express.Router()
    .get("/:user/competitor", mustOwnUser, CompetitorController.forUser)
    .post("/:user/competitor", mustOwnUser, CompetitorController.create);
