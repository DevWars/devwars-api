import { Request, Response } from "express";

export class HealthController {

    /**
     * @api {get} /health Health status of server
     * @apiVersion 1.0.0
     * @apiName Health
     * @apiGroup Health
     *
     * @apiSuccess {String} health.status   Status of the server
     *
     * @apiSuccessExample Success-Response:
     *     HTTP/1.1 200 OK
     *     {
     *       "status": "Healthy",
     *     }
     */

    public static index(request: Request, response: Response) {
        response
            .status(200)
            .json({status: "Healthy"});
    }
}
