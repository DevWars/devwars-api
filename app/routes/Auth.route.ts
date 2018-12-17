import * as express from "express";
import {AuthController} from "../controllers/user/Auth.controller";

export const AuthRoute: express.Router = express.Router()
    .get("/user", AuthController.currentUser)
    .post("/login", AuthController.login)
    .post("/logout", AuthController.logout)
    .post("/register", AuthController.register)
    .get("/verify", AuthController.verify)
    .post("/re-verify", AuthController.reVerify);
