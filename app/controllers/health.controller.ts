import { Request, Response } from 'express';
import * as fs from 'fs';

import { canAccessPath, pathExists } from '../../test/helpers';
import path = require('path');

// eslint-disable-next-line @typescript-eslint/no-var-requires
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
export function getBasicServerHealth(request: Request, response: Response): Response {
    return response.status(200).json({
        status: 'Healthy',
        version: packageJson.version,
    });
}

/**
 * @api {get} /logs Gets the server standard logs
 * @apiVersion 1.0.0
 * @apiName ServerLogs
 * @apiGroup Health
 * @apiPermission Moderator, Admin
 *
 * @apiSuccess {string[]} logs The standard logs of the server.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "logs": [...]
 *     }
 */
export function getAllServerLogs(request: Request, response: Response): Response {
    const allLogsPath = path.resolve(__dirname, '../../logs/all.log');

    const logs: { logs: string[] } = { logs: [] };

    if (pathExists(allLogsPath) && canAccessPath(allLogsPath, fs.constants.R_OK)) {
        logs.logs = fs.readFileSync(allLogsPath).toString().split('\n');
    }

    return response.json(logs);
}

/**
 * @api {get} /logs/error Gets the server error logs
 * @apiVersion 1.0.0
 * @apiName ServerErrorLogs
 * @apiGroup Health
 * @apiPermission Moderator, Admin
 *
 * @apiSuccess {string[]} logs The error logs of the server.
 *
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *       "logs": [...]
 *     }
 */
export function getErrorServerLogs(request: Request, response: Response): Response {
    const errorLogsPath = path.resolve(__dirname, '../../logs/error.log');

    const logs: { logs: string[] } = { logs: [] };

    if (pathExists(errorLogsPath) && canAccessPath(errorLogsPath, fs.constants.R_OK)) {
        logs.logs = fs.readFileSync(errorLogsPath).toString().split('\n');
    }

    return response.json(logs);
}
