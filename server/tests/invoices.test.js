/** Automated API cases TC-API-01 … TC-API-13. Uses an in-memory MongoDB. */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Invoice } from '../src/models/Invoice.js';
import { resetDatabase, startTestDatabase, stopTestDatabase, validInvoice } from './helpers.js';

const app = createApp();

describe('invoice API', () => {
  beforeAll(async () => {
    await startTestDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('reports health status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.mongodb).toBe('connected');
  });

  it('TC-API-02: creates an invoice and recalculates the $99.00 example on the server', async () => {
    const response = await request(app)
      .post('/api/invoices')
      .send(validInvoice({
        invoiceNumber: 'INV-CALC-0099',
        lineItems: [{ description: 'Website Development', quantity: 2, unitPrice: 50 }],
        discountAmount: 10,
        taxRate: 10,
      }));

    expect(response.status).toBe(201);
    expect(response.body.data.subtotal).toBe(100);
    expect(response.body.data.discountAmount).toBe(10);
    expect(response.body.data.taxAmount).toBe(9);
    expect(response.body.data.grandTotal).toBe(99);
    expect(response.body.data.grandTotalCents).toBe(9900);
  });

  it('ignores client-supplied totals', async () => {
    const response = await request(app)
      .post('/api/invoices')
      .send({
        ...validInvoice({ invoiceNumber: 'INV-IGNORE-TOTALS' }),
        grandTotal: 1,
        subtotal: 1,
        taxAmount: 1,
      });

    expect(response.status).toBe(201);
    expect(response.body.data.grandTotal).toBe(99);
  });

  it('retrieves, updates, and deletes an invoice', async () => {
    const created = await request(app).post('/api/invoices').send(validInvoice({ invoiceNumber: 'INV-CRUD-1' }));
    const id = created.body.data.id;

    const fetched = await request(app).get(`/api/invoices/${id}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.invoiceNumber).toBe('INV-CRUD-1');
    expect(fetched.body.data.customFields).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Internal Code', visible: false }),
    ]));

    const updated = await request(app)
      .put(`/api/invoices/${id}`)
      .send(validInvoice({
        invoiceNumber: 'INV-CRUD-1',
        notes: 'Updated notes',
        taxRate: 0,
        discountAmount: 0,
      }));
    expect(updated.status).toBe(200);
    expect(updated.body.data.notes).toBe('Updated notes');
    expect(updated.body.data.grandTotal).toBe(100);

    const deleted = await request(app).delete(`/api/invoices/${id}`);
    expect(deleted.status).toBe(200);

    const missing = await request(app).get(`/api/invoices/${id}`);
    expect(missing.status).toBe(404);
  });

  it('lists invoices with pagination fields', async () => {
    await request(app).post('/api/invoices').send(validInvoice({ invoiceNumber: 'INV-LIST-1' }));
    await request(app).post('/api/invoices').send(validInvoice({
      invoiceNumber: 'INV-LIST-2',
      customerDetails: {
        name: 'Riley Stone',
        email: 'riley.stone@example.test',
        billingAddress: '1 Market Street',
      },
    }));

    const response = await request(app).get('/api/invoices?page=1&limit=10');
    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe(2);
    expect(response.body.data.items[0]).toEqual(expect.objectContaining({
      invoiceNumber: expect.any(String),
      customerName: expect.any(String),
      issueDate: expect.any(String),
      grandTotal: expect.any(Number),
    }));
  });

  it('TC-API-07: rejects duplicate invoice numbers without overwriting the original', async () => {
    await request(app).post('/api/invoices').send(validInvoice({ invoiceNumber: 'INV-DUP-1' }));
    const duplicate = await request(app)
      .post('/api/invoices')
      .send(validInvoice({
        invoiceNumber: 'INV-DUP-1',
        notes: 'Should not replace the first invoice',
      }));

    expect(duplicate.status).toBe(409);
    const count = await Invoice.countDocuments({ invoiceNumber: 'INV-DUP-1' });
    expect(count).toBe(1);
    const stored = await Invoice.findOne({ invoiceNumber: 'INV-DUP-1' });
    expect(stored.notes).not.toBe('Should not replace the first invoice');
  });

  it('rejects invalid invoice data', async () => {
    const response = await request(app).post('/api/invoices').send({
      ...validInvoice(),
      customerDetails: { name: '', email: 'not-an-email', billingAddress: '' },
      lineItems: [{ description: '', quantity: -1, unitPrice: -5 }],
    });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects a discount greater than the subtotal and a negative tax rate', async () => {
    const discount = await request(app).post('/api/invoices').send(validInvoice({
      invoiceNumber: 'INV-BAD-DISC',
      discountAmount: 150,
    }));
    expect(discount.status).toBe(400);

    const tax = await request(app).post('/api/invoices').send(validInvoice({
      invoiceNumber: 'INV-BAD-TAX',
      taxRate: -3,
    }));
    expect(tax.status).toBe(400);
  });

  it('rejects invalid MongoDB ids and missing invoices', async () => {
    const badId = await request(app).get('/api/invoices/not-an-id');
    expect(badId.status).toBe(400);

    const missing = await request(app).get('/api/invoices/64b0f0f0f0f0f0f0f0f0f0f0');
    expect(missing.status).toBe(404);
  });

  it('handles database failures when listing invoices', async () => {
    const spy = vi.spyOn(Invoice, 'find').mockImplementation(() => {
      throw new Error('database unavailable');
    });

    const response = await request(app).get('/api/invoices');
    expect(response.status).toBe(500);
    spy.mockRestore();
  });

  it('rejects malformed JSON', async () => {
    const response = await request(app)
      .post('/api/invoices')
      .set('Content-Type', 'application/json')
      .send('{"invoiceNumber":');
    expect(response.status).toBe(400);
  });
});
