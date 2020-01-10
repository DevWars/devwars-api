import * as express from 'express';

import { wrapAsync } from './handlers';
import * as contactController from '../controllers/contact.controller';
import { contactUsSchema } from './validators/contact.validator';
import { bodyValidation } from './validators';

const ContactRoute: express.Router = express.Router();

ContactRoute.post('/', [bodyValidation(contactUsSchema)], wrapAsync(contactController.handleContactPost));

export { ContactRoute };
