import * as express from "express";
import {ResetController} from "../controllers/user/Reset.controller";
import {mustOwnUser} from "../middlewares/OwnsUser";

export const ResetRoute: express.Router = express.Router()
    .post("/:user/reset/email", mustOwnUser, ResetController.email)
    .put("/:user/reset/password", mustOwnUser, ResetController.password);
