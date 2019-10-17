import { Request, Response, NextFunction } from 'express';

export const asyncErrorHandler = (fn: any) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch((err) => {
        if (process.env.NODE_ENV === 'production') {
            return res.sendStatus(500).json({ error: 'Internal server error, something went wrong.' });
        }

        res.status(500).json({ error: err.message, stack: err.stack });
    });
};
