/** Automated custom-field cases TC-CF-01 … TC-CF-08. */
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createCustomField, getVisibleCustomFields, normalizeCustomFields } from '@shared/customFields.js';
import { tryCalculateInvoice } from '@shared/invoiceMath.js';
import InvoicePreview from '../components/InvoicePreview.jsx';

describe('custom fields', () => {
  it('adds, edits, hides, shows, and removes custom fields', () => {
    let fields = [createCustomField({ label: 'Purchase Order', value: 'PO-1' })];
    expect(fields).toHaveLength(1);

    fields = fields.map((field) => (
      field.label === 'Purchase Order'
        ? { ...field, label: 'PO Number', value: 'PO-2026-1001' }
        : field
    ));
    expect(fields[0]).toMatchObject({ label: 'PO Number', value: 'PO-2026-1001', visible: true });

    fields = fields.map((field) => ({ ...field, visible: false }));
    expect(getVisibleCustomFields(fields)).toHaveLength(0);

    fields = fields.map((field) => ({ ...field, visible: true }));
    expect(getVisibleCustomFields(fields)).toHaveLength(1);

    fields = [];
    expect(normalizeCustomFields(fields)).toHaveLength(0);
  });

  it('excludes hidden fields from the preview without deleting their values', () => {
    const invoice = {
      invoiceNumber: 'INV-CF-1',
      issueDate: '2026-10-21',
      dueDate: '2026-11-05',
      businessDetails: { name: 'Harbor Lane Studio' },
      customerDetails: { name: 'Avery Chen', billingAddress: '88 Pine Street' },
      lineItems: [{ description: 'Website Development', quantity: 2, unitPrice: 50 }],
      discountAmount: 10,
      taxRate: 10,
      customFields: [
        { label: 'Purchase Order', value: 'PO-2026-1001', visible: true },
        { label: 'Internal Code', value: 'WEB-2026', visible: false },
      ],
    };

    render(<InvoicePreview invoice={invoice} />);
    expect(screen.getByText('Purchase Order')).toBeInTheDocument();
    expect(screen.getByText('PO-2026-1001')).toBeInTheDocument();
    expect(screen.queryByText('Internal Code')).not.toBeInTheDocument();
    expect(screen.queryByText('WEB-2026')).not.toBeInTheDocument();
    expect(invoice.customFields[1].value).toBe('WEB-2026');
  });

  it('never changes invoice totals', () => {
    const base = tryCalculateInvoice({
      lineItems: [{ quantity: 2, unitPrice: 50 }],
      discountAmount: 10,
      taxRate: 10,
    });
    const withFields = tryCalculateInvoice({
      lineItems: [{ quantity: 2, unitPrice: 50 }],
      discountAmount: 10,
      taxRate: 10,
      customFields: [
        { label: 'Purchase Order', value: '99999', visible: true },
        { label: 'Hidden extra', value: 'should not matter', visible: false },
      ],
    });
    expect(withFields.grandTotalCents).toBe(base.grandTotalCents);
    expect(withFields.grandTotalCents).toBe(9900);
  });

  it('preserves visibility when fields are normalized after retrieval', () => {
    const restored = normalizeCustomFields([
      { label: 'Department', value: 'Engineering', visible: true },
      { label: 'Internal Code', value: 'WEB-2026', visible: false },
    ]);
    expect(restored[0].visible).toBe(true);
    expect(restored[1].visible).toBe(false);
    expect(getVisibleCustomFields(restored).map((field) => field.label)).toEqual(['Department']);
  });
});
