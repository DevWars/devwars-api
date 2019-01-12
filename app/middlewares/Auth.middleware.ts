import {NextFunction, Request, Response} from "express";

import {UserRole} from "../models";
import {UserRepository} from "../repository";

export const mustBeRole = (role: UserRole) => async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies.auth;
    const user = await UserRepository.userForToken(token);

    if (user && role >= user.role) {
        return next();
    }

    response.status(403).json({
        error: "Unauthenticated",
    });
}

export const mustBeAuthenticated = async (request: Request, response: Response, next: NextFunction) => {
    const token = request.cookies.auth;
    const user = await UserRepository.userForToken(token);

    if (user) {
        return next();
    }

    response.status(403).json({
        error: "Unauthenticated",
    });
};
