/**
 * Apply shared invoiceMath to a sanitized payload and map cents to API JSON.
 * Client-supplied subtotal / tax / grand total are discarded (TC-API-13).
 */
import { calculateInvoice } from '../../../shared/invoiceMath.js';
import { centsToDollarNumber } from '../../../shared/format.js';
import { normalizeCustomFields } from '../../../shared/customFields.js';

export function buildInvoiceDocument(normalizedInput) {
  const totals = calculateInvoice(normalizedInput, { requireLineItems: true });

  return {
    invoiceNumber: normalizedInput.invoiceNumber,
    businessDetails: normalizedInput.businessDetails,
    customerDetails: normalizedInput.customerDetails,
    issueDate: normalizedInput.issueDate,
    dueDate: normalizedInput.dueDate,
    notes: normalizedInput.notes,
    lineItems: totals.lineItems.map((item, index) => ({
      description: normalizedInput.lineItems[index].description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
    })),
    discountAmountCents: totals.discountAmountCents,
    taxRate: totals.taxRate,
    customFields: normalizeCustomFields(normalizedInput.customFields).map(({ label, value, visible }) => ({
      label,
      value,
      visible,
    })),
    subtotalCents: totals.subtotalCents,
    taxAmountCents: totals.taxAmountCents,
    grandTotalCents: totals.grandTotalCents,
  };
}

export function toInvoiceResponse(document) {
  const invoice = typeof document.toObject === 'function' ? document.toObject() : document;
  const discountedSubtotalCents = invoice.subtotalCents - invoice.discountAmountCents;

  return {
    id: invoice._id ? String(invoice._id) : invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    businessDetails: invoice.businessDetails,
    customerDetails: invoice.customerDetails,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    notes: invoice.notes,
    lineItems: invoice.lineItems.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: centsToDollarNumber(item.unitPriceCents),
      unitPriceCents: item.unitPriceCents,
      lineTotal: centsToDollarNumber(item.lineTotalCents),
      lineTotalCents: item.lineTotalCents,
    })),
    discountAmount: centsToDollarNumber(invoice.discountAmountCents),
    discountAmountCents: invoice.discountAmountCents,
    taxRate: invoice.taxRate,
    customFields: invoice.customFields,
    subtotal: centsToDollarNumber(invoice.subtotalCents),
    subtotalCents: invoice.subtotalCents,
    discountedSubtotal: centsToDollarNumber(discountedSubtotalCents),
    discountedSubtotalCents,
    taxAmount: centsToDollarNumber(invoice.taxAmountCents),
    taxAmountCents: invoice.taxAmountCents,
    grandTotal: centsToDollarNumber(invoice.grandTotalCents),
    grandTotalCents: invoice.grandTotalCents,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

export function toInvoiceListItem(document) {
  const invoice = typeof document.toObject === 'function' ? document.toObject() : document;
  return {
    id: String(invoice._id),
    invoiceNumber: invoice.invoiceNumber,
    customerName: invoice.customerDetails?.name || '',
    issueDate: invoice.issueDate,
    grandTotal: centsToDollarNumber(invoice.grandTotalCents),
    grandTotalCents: invoice.grandTotalCents,
    updatedAt: invoice.updatedAt,
  };
}
