import { NextFunction, Request, Response } from 'express';
import { IContactRequest } from '../request/IRequest';
import { sendContactUsEmail } from '../services/Mail.service';

/**
 * @api {post} /contact Endpoint for contact us forms to be posted too.
 * @apiVersion 1.0.0
 * @apiName ContactUs
 * @apiGroup Contact
 */
export async function handleContactPost(request: Request, response: Response) {
    const { name, email, message } = request.body as IContactRequest;

    await sendContactUsEmail(name, email, message);

    return response.json();
}
