/**
 * Automated calculation cases TC-CALC-01 … TC-CALC-17.
 * The required product fixture is TC-CALC-02: grand total must be exactly $99.00.
 */
import { describe, expect, it } from 'vitest';
import { calculateInvoice, InvoiceValidationError, tryCalculateInvoice } from '@shared/invoiceMath.js';
import { formatUsdFromCents } from '@shared/format.js';

function calc(overrides = {}) {
  return calculateInvoice({
    lineItems: [{ description: 'Website Development', quantity: 2, unitPrice: 50 }],
    discountAmount: 10,
    taxRate: 10,
    ...overrides,
  });
}

describe('invoice calculations', () => {
  it('TC-CALC-01: calculates 2 × $50.00 as a $100.00 subtotal', () => {
    const result = calc({ discountAmount: 0, taxRate: 0 });
    expect(result.subtotalCents).toBe(10000);
    expect(formatUsdFromCents(result.subtotalCents)).toBe('$100.00');
  });

  it('TC-CALC-02: produces exactly $99.00 for the required example', () => {
    const result = calc();
    expect(result.subtotalCents).toBe(10000);
    expect(result.discountAmountCents).toBe(1000);
    expect(result.taxAmountCents).toBe(900);
    expect(result.grandTotalCents).toBe(9900);
    expect(formatUsdFromCents(result.grandTotalCents)).toBe('$99.00');
  });

  it('TC-CALC-03: supports zero tax', () => {
    const result = calc({ taxRate: 0 });
    expect(result.taxAmountCents).toBe(0);
    expect(result.grandTotalCents).toBe(9000);
  });

  it('TC-CALC-04: supports zero discount', () => {
    const result = calc({ discountAmount: 0 });
    expect(result.discountAmountCents).toBe(0);
    expect(result.taxAmountCents).toBe(1000);
    expect(result.grandTotalCents).toBe(11000);
  });

  it('TC-CALC-16: rejects unit prices with more than two decimal places', () => {
    expect(() => calculateInvoice({
      lineItems: [{ quantity: 1, unitPrice: '10.005' }],
      discountAmount: 0,
      taxRate: 0,
    })).toThrow(InvoiceValidationError);
  });

  it('TC-CALC-05: adds multiple valid line items', () => {
    const result = calculateInvoice({
      lineItems: [
        { quantity: 1, unitPrice: 20 },
        { quantity: 3, unitPrice: 15 },
        { quantity: 2, unitPrice: 7.5 },
      ],
      discountAmount: 0,
      taxRate: 0,
    });
    expect(result.subtotalCents).toBe(2000 + 4500 + 1500);
  });

  it('TC-CALC-06: supports decimal quantities and unit prices', () => {
    const result = calculateInvoice({
      lineItems: [{ quantity: 1.5, unitPrice: '12.25' }],
      discountAmount: 0,
      taxRate: 0,
    });
    expect(result.lineItems[0].lineTotalCents).toBe(1838);
    expect(result.subtotalCents).toBe(1838);
  });

  it('TC-CALC-07: allows a discount equal to the subtotal', () => {
    const result = calc({ discountAmount: 100, taxRate: 10 });
    expect(result.discountedSubtotalCents).toBe(0);
    expect(result.taxAmountCents).toBe(0);
    expect(result.grandTotalCents).toBe(0);
  });

  it('TC-CALC-08: rejects a discount greater than the subtotal', () => {
    expect(() => calc({ discountAmount: 100.01 })).toThrow(InvoiceValidationError);
  });

  it('TC-CALC-09: rejects a negative quantity', () => {
    expect(() => calc({ lineItems: [{ quantity: -1, unitPrice: 50 }] })).toThrow(InvoiceValidationError);
  });

  it('TC-CALC-10: rejects a negative unit price', () => {
    expect(() => calc({ lineItems: [{ quantity: 1, unitPrice: -1 }] })).toThrow(InvoiceValidationError);
  });

  it('TC-CALC-11: rejects a negative discount', () => {
    expect(() => calc({ discountAmount: -1 })).toThrow(InvoiceValidationError);
  });

  it('TC-CALC-12: rejects a negative tax rate', () => {
    expect(() => calc({ taxRate: -1 })).toThrow(InvoiceValidationError);
  });

  it('TC-CALC-13: rounds line totals to two decimal places using half-up', () => {
    const result = calculateInvoice({
      lineItems: [{ quantity: 1.5, unitPrice: '0.01' }],
      discountAmount: 0,
      taxRate: 0,
    });
    expect(result.subtotalCents).toBe(2);
  });

  it('TC-CALC-14: returns zero totals for an empty invoice', () => {
    const result = calculateInvoice({ lineItems: [], discountAmount: 0, taxRate: 0 });
    expect(result.subtotalCents).toBe(0);
    expect(result.grandTotalCents).toBe(0);
  });

  it('TC-CALC-15: rejects invalid numeric values', () => {
    expect(() => calc({ lineItems: [{ quantity: Number.NaN, unitPrice: 10 }] })).toThrow(InvoiceValidationError);
    expect(() => calc({ lineItems: [{ quantity: 1, unitPrice: Number.POSITIVE_INFINITY }] })).toThrow(InvoiceValidationError);
    expect(() => calc({ discountAmount: 'abc' })).toThrow(InvoiceValidationError);
  });

  it('TC-CALC-17: does not let custom fields change totals in lenient preview mode', () => {
    const input = {
      lineItems: [{ quantity: 2, unitPrice: 50 }],
      discountAmount: 10,
      taxRate: 10,
    };
    const withoutFields = tryCalculateInvoice(input);
    const withFields = tryCalculateInvoice({
      ...input,
      customFields: [{ label: 'PO', value: '1', visible: true }],
    });
    expect(withFields.grandTotalCents).toBe(withoutFields.grandTotalCents);
    expect(withFields.grandTotalCents).toBe(9900);
  });
});
