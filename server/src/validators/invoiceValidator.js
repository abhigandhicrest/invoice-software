/**
 * Sanitize and validate inbound invoice JSON. Generates an invoice number
 * only when the client omitted one. Totals on the body are ignored here
 * and recalculated in invoiceCalculationService.
 */
import { generateInvoiceNumber } from '../../../shared/invoiceDefaults.js';
import { InvoiceValidationError } from '../../../shared/invoiceMath.js';
import {
  FIELD_LIMITS,
  isValidEmail,
  sanitizeString,
  validateInvoice,
} from '../../../shared/validation.js';
import { normalizeCustomFields } from '../../../shared/customFields.js';

export function normalizeInvoiceInput(body = {}) {
  const business = body.businessDetails || {};
  const customer = body.customerDetails || {};

  return {
    invoiceNumber: sanitizeString(body.invoiceNumber || generateInvoiceNumber(), FIELD_LIMITS.invoiceNumber),
    issueDate: sanitizeString(body.issueDate, 10),
    dueDate: sanitizeString(body.dueDate, 10),
    notes: sanitizeString(body.notes, FIELD_LIMITS.notes, { allowNewlines: true }),
    businessDetails: {
      name: sanitizeString(business.name, FIELD_LIMITS.name),
      email: sanitizeString(business.email, FIELD_LIMITS.email),
      phone: sanitizeString(business.phone, FIELD_LIMITS.phone),
      address: sanitizeString(business.address, FIELD_LIMITS.address, { allowNewlines: true }),
      website: sanitizeString(business.website, FIELD_LIMITS.website),
      taxId: sanitizeString(business.taxId, FIELD_LIMITS.taxId),
    },
    customerDetails: {
      name: sanitizeString(customer.name, FIELD_LIMITS.name),
      email: sanitizeString(customer.email, FIELD_LIMITS.email),
      phone: sanitizeString(customer.phone, FIELD_LIMITS.phone),
      billingAddress: sanitizeString(customer.billingAddress, FIELD_LIMITS.address, { allowNewlines: true }),
      companyName: sanitizeString(customer.companyName, FIELD_LIMITS.name),
      taxId: sanitizeString(customer.taxId, FIELD_LIMITS.taxId),
    },
    lineItems: Array.isArray(body.lineItems)
      ? body.lineItems.map((item) => ({
        description: sanitizeString(item?.description, FIELD_LIMITS.description),
        quantity: item?.quantity,
        unitPrice: item?.unitPrice ?? (item?.unitPriceCents !== undefined ? Number(item.unitPriceCents) / 100 : item?.unitPrice),
      }))
      : [],
    discountAmount: body.discountAmount ?? (body.discountAmountCents !== undefined ? Number(body.discountAmountCents) / 100 : 0),
    taxRate: body.taxRate ?? 0,
    customFields: normalizeCustomFields(body.customFields).map((field) => ({
      label: sanitizeString(field.label, FIELD_LIMITS.customLabel),
      value: sanitizeString(field.value, FIELD_LIMITS.customValue),
      visible: field.visible !== false,
    })),
  };
}

export function validateInvoicePayload(body, options = {}) {
  const invoice = normalizeInvoiceInput(body);
  const errors = validateInvoice(invoice, { requireLineItems: true, ...options });
  if (errors.length > 0) {
    throw new InvoiceValidationError(errors);
  }
  return invoice;
}

export function validateRecipientEmail(value) {
  const email = sanitizeString(value, FIELD_LIMITS.email).toLowerCase();
  if (!email) {
    throw new InvoiceValidationError([{ field: 'to', message: 'A recipient email address is required.' }]);
  }
  if (!isValidEmail(email)) {
    throw new InvoiceValidationError([{ field: 'to', message: 'Recipient email must be a valid email address.' }]);
  }
  return email;
}
