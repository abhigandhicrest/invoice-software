/**
 * POST /api/invoices/:id/send-email
 * Loads the saved invoice, recalculates totals, then sends HTML via SMTP.
 * Success means the SMTP server accepted the message, not that the inbox
 * received it (TC-MAIL-08).
 */
import { Invoice } from '../models/Invoice.js';
import { validateRecipientEmail } from '../validators/invoiceValidator.js';
import { toInvoiceResponse } from '../services/invoiceCalculationService.js';
import { calculateInvoice } from '../../../shared/invoiceMath.js';
import { sendInvoiceEmail } from '../services/emailService.js';

export async function sendInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      const error = new Error('Invoice not found.');
      error.statusCode = 404;
      throw error;
    }

    const recipient = validateRecipientEmail(req.body?.to || invoice.customerDetails?.email);
    const response = toInvoiceResponse(invoice);
    calculateInvoice({
      lineItems: response.lineItems.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      discountAmount: response.discountAmount,
      taxRate: response.taxRate,
    }, { requireLineItems: true });

    const result = await sendInvoiceEmail({ invoice: response, to: recipient });

    res.json({
      success: true,
      data: {
        acceptedBySmtp: true,
        to: recipient,
        messageId: result.messageId,
        notice: `The SMTP server accepted the invoice email for ${recipient}. This does not confirm that the inbox received it.`,
      },
    });
  } catch (error) {
    if (error.code === 'ECONNECTION' || error.code === 'EAUTH' || error.command) {
      const smtpError = new Error('The invoice email could not be sent. Check the SMTP settings and try again.');
      smtpError.statusCode = 502;
      return next(smtpError);
    }
    next(error);
  }
}
