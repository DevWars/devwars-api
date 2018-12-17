import * as express from "express";
import {BadgeController} from "../controllers/Badge.controller";

export const BadgeRoute: express.Router = express.Router()
    .get("/", BadgeController.all);
