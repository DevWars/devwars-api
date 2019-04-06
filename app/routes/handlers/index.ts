import { Request, Response, NextFunction } from 'express';

export const asyncErrorHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch((err) => {
        if (process.env.NODE_ENV === 'production') {
            return res.sendStatus(500);
        }

        res.status(500).json({ message: err.message, stack: err.stack });
    });
};
