import { Response } from 'express';
import { IContactRequest } from '../request/IRequest';
import { sendContactUsEmail } from '../services/Mail.service';

/**
 * @api {post} /contact Endpoint for contact us forms to be posted too.
 * @apiVersion 1.0.0
 * @apiName ContactUs
 * @apiGroup Contact
 *
 * @apiParam {string} name The name of the requesting contact us person.
 * @apiParam {string} email The email of the contact us person who will be getting the reply.
 * @apiParam {string} message The message in the contact us request.
 *
 *  * @apiParamExample {json} Request-Example:
 *    {
 *     "name": "John Doe",
 *     "email": "example@example.com",
 *     "message": "Hi, I was wondering if you could help me... "
 *    }
 */
export async function handleContactPost(request: IContactRequest, response: Response) {
    const { name, email, message } = request.body;

    await sendContactUsEmail(name, email, message);
    return response.send();
}
