import { Request, Response } from 'express';

// tslint:disable-next-line: no-var-requires
const packageJson = require('../../package');

/**
 * @api {get} /health Health status of server & its current version.
 * @apiVersion 1.0.0
 * @apiName Health
 * @apiGroup Health
 *
 * @apiSuccess {string} health.status   Status of the server
 * @apiSuccess {string} health.version   The current server api version.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "status": "Healthy",
 *       "version": "0.1.0",
 *     }
 */
export function index(request: Request, response: Response) {
    return response.status(200).json({
        status: 'Healthy',
        version: packageJson.version,
    });
}
