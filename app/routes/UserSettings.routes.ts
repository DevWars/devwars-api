import * as express from "express";
import {SettingsController} from "../controllers/user/Settings.controller";
import {mustOwnUser} from "../middlewares/OwnsUser";

export const UserSettingsRoute: express.Router = express.Router()
    .post("/:user/settings", mustOwnUser, SettingsController.update);
