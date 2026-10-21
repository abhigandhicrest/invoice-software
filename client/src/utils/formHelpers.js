/**
 * Map API invoices (cents) to form values (decimal strings) and apply the
 * shared validator to React Hook Form field paths.
 */
import { createCustomField, normalizeCustomFields } from '@shared/customFields.js';
import { centsToDollarInput } from '@shared/format.js';
import { createBlankInvoice, createEmptyLineItem } from '@shared/invoiceDefaults.js';
import { errorsToMap, validateInvoice } from '@shared/validation.js';

export function invoiceToFormValues(invoice) {
  if (!invoice) {
    return createBlankInvoice();
  }

  return {
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    notes: invoice.notes || '',
    businessDetails: {
      name: invoice.businessDetails?.name || '',
      email: invoice.businessDetails?.email || '',
      phone: invoice.businessDetails?.phone || '',
      address: invoice.businessDetails?.address || '',
      website: invoice.businessDetails?.website || '',
      taxId: invoice.businessDetails?.taxId || '',
    },
    customerDetails: {
      name: invoice.customerDetails?.name || '',
      email: invoice.customerDetails?.email || '',
      phone: invoice.customerDetails?.phone || '',
      billingAddress: invoice.customerDetails?.billingAddress || '',
      companyName: invoice.customerDetails?.companyName || '',
      taxId: invoice.customerDetails?.taxId || '',
    },
    lineItems: (invoice.lineItems || []).map((item) => ({
      description: item.description || '',
      quantity: item.quantity,
      unitPrice: item.unitPriceCents !== undefined
        ? centsToDollarInput(item.unitPriceCents)
        : Number(item.unitPrice || 0).toFixed(2),
    })),
    discountAmount: invoice.discountAmountCents !== undefined
      ? centsToDollarInput(invoice.discountAmountCents)
      : Number(invoice.discountAmount || 0).toFixed(2),
    taxRate: invoice.taxRate === undefined || invoice.taxRate === null ? '0' : String(invoice.taxRate),
    customFields: normalizeCustomFields(invoice.customFields),
  };
}

export function applyValidationErrors(setError, values, options) {
  const errors = validateInvoice(values, options);
  errors.forEach((error) => {
    setError(error.field, { type: 'manual', message: error.message });
  });
  return errors;
}

export function firstErrorField(errors) {
  return errors[0]?.field || null;
}

export { createBlankInvoice, createCustomField, createEmptyLineItem, errorsToMap };
