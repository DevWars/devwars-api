import { Request, Response, NextFunction } from 'express';

export const asyncErrorHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    return Promise
        .resolve(fn(req, res, next))
        .catch(err => {
            res.status(500).json({ message: err.message || "" })
        });
};
