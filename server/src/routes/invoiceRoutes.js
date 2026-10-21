/**
 * Invoice REST routes. ObjectIds are validated before GET/PUT/DELETE/email.
 */
import { Router } from 'express';
import {
  createInvoice,
  deleteInvoice,
  getInvoice,
  listInvoices,
  updateInvoice,
} from '../controllers/invoiceController.js';
import { sendInvoice } from '../controllers/emailController.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

export const invoiceRoutes = Router();

invoiceRoutes.post('/', createInvoice);
invoiceRoutes.get('/', listInvoices);
invoiceRoutes.get('/:id', validateObjectId(), getInvoice);
invoiceRoutes.put('/:id', validateObjectId(), updateInvoice);
invoiceRoutes.delete('/:id', validateObjectId(), deleteInvoice);
invoiceRoutes.post('/:id/send-email', validateObjectId(), sendInvoice);
