/**
 * Automated email cases TC-MAIL-01 … TC-MAIL-05.
 * Nodemailer is mocked — these tests never send a real message.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { resetDatabase, startTestDatabase, stopTestDatabase, validInvoice } from './helpers.js';

const sendMail = vi.fn();

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({ sendMail })),
  },
}));

const app = createApp();

describe('invoice email API', () => {
  beforeAll(async () => {
    await startTestDatabase();
  });

  afterAll(async () => {
    await stopTestDatabase();
  });

  beforeEach(async () => {
    await resetDatabase();
    sendMail.mockReset();
    sendMail.mockResolvedValue({ messageId: 'test-message', accepted: ['dev@harborlanestudio.example'], rejected: [] });
    process.env.SMTP_HOST = 'smtp.test.local';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'billing@harborlanestudio.example';
    process.env.SMTP_PASS = 'not-a-real-password';
    process.env.SMTP_FROM = 'Harbor Lane Studio <billing@harborlanestudio.example>';
    process.env.EMAIL_ALLOWED_RECIPIENTS = 'dev@harborlanestudio.example';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.SMTP_FROM;
    delete process.env.EMAIL_ALLOWED_RECIPIENTS;
  });

  it('rejects invalid recipient addresses', async () => {
    const created = await request(app).post('/api/invoices').send(validInvoice({ invoiceNumber: 'INV-MAIL-1' }));
    const response = await request(app)
      .post(`/api/invoices/${created.body.data.id}/send-email`)
      .send({ to: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('explains missing SMTP configuration instead of crashing', async () => {
    delete process.env.SMTP_HOST;
    const created = await request(app).post('/api/invoices').send(validInvoice({ invoiceNumber: 'INV-MAIL-2' }));
    const response = await request(app)
      .post(`/api/invoices/${created.body.data.id}/send-email`)
      .send({ to: 'dev@harborlanestudio.example' });

    expect(response.status).toBe(503);
    expect(response.body.message).toMatch(/SMTP is not configured/i);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('returns a useful error when SMTP sending fails', async () => {
    sendMail.mockRejectedValue(Object.assign(new Error('auth failed'), { code: 'EAUTH' }));
    const created = await request(app).post('/api/invoices').send(validInvoice({ invoiceNumber: 'INV-MAIL-3' }));
    const response = await request(app)
      .post(`/api/invoices/${created.body.data.id}/send-email`)
      .send({ to: 'dev@harborlanestudio.example' });

    expect(response.status).toBe(502);
    expect(response.body.message).toMatch(/could not be sent/i);
  });

  it('TC-MAIL-04: rejects recipients that are not on the development allowlist', async () => {
    const created = await request(app).post('/api/invoices').send(validInvoice({ invoiceNumber: 'INV-MAIL-4' }));
    const response = await request(app)
      .post(`/api/invoices/${created.body.data.id}/send-email`)
      .send({ to: 'stranger@example.com' });

    expect(response.status).toBe(400);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends only to a controlled test address through the mocked transport', async () => {
    const created = await request(app).post('/api/invoices').send(validInvoice({ invoiceNumber: 'INV-MAIL-5' }));
    const response = await request(app)
      .post(`/api/invoices/${created.body.data.id}/send-email`)
      .send({ to: 'dev@harborlanestudio.example' });

    expect(response.status).toBe(200);
    expect(response.body.data.acceptedBySmtp).toBe(true);
    expect(response.body.data.notice).toMatch(/does not confirm/i);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe('dev@harborlanestudio.example');
    expect(sendMail.mock.calls[0][0].html).toContain('$99.00');
  });
});
