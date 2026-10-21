/**
 * Real SMTP delivery through Nodemailer. Credentials come from server/.env.
 * Outside production, EMAIL_ALLOWED_RECIPIENTS must list an address the
 * developer controls (TC-MAIL-04). Never log SMTP_PASS.
 */
import nodemailer from 'nodemailer';
import { formatDate, formatTaxRate, formatUsdFromCents } from '../../../shared/format.js';
import { getVisibleCustomFields } from '../../../shared/customFields.js';
import { InvoiceValidationError } from '../../../shared/invoiceMath.js';

/** Escape invoice fields before they are placed in HTML email. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function multilineHtml(value) {
  return escapeHtml(value).replace(/\r\n|\n|\r/g, '<br />');
}

export function getAllowedRecipients() {
  return String(process.env.EMAIL_ALLOWED_RECIPIENTS || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function assertRecipientAllowed(email) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    return;
  }

  const allowed = getAllowedRecipients();
  if (allowed.length === 0) {
    throw new InvoiceValidationError([{
      field: 'to',
      message: 'EMAIL_ALLOWED_RECIPIENTS is not configured. Add a developer-controlled address to server/.env before sending email.',
    }]);
  }

  if (!allowed.includes(email.toLowerCase())) {
    throw new InvoiceValidationError([{
      field: 'to',
      message: 'This recipient is not on the development allowlist. Use an address from EMAIL_ALLOWED_RECIPIENTS.',
    }]);
  }
}

export function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM?.trim() || user;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';

  return { host, user, pass, from, port, secure };
}

export function isSmtpConfigured() {
  const { host, user, pass, from } = getSmtpConfig();
  return Boolean(host && user && pass && from);
}

export function assertSmtpConfigured() {
  if (isSmtpConfigured()) {
    return;
  }
  const error = new Error(
    'SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, and SMTP_FROM in server/.env. For Google Workspace, SMTP_PASS must be a Google App Password, not your normal login password.',
  );
  error.statusCode = 503;
  throw error;
}

export function createTransport(overrides = {}) {
  const config = { ...getSmtpConfig(), ...overrides };
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
}

export function buildInvoiceEmail({ invoice, to, from }) {
  const visibleFields = getVisibleCustomFields(invoice.customFields);
  const lineRows = invoice.lineItems.map((item) => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #d9dde3;">${escapeHtml(item.description)}</td>
      <td style="padding:8px;border-bottom:1px solid #d9dde3;text-align:right;">${escapeHtml(item.quantity)}</td>
      <td style="padding:8px;border-bottom:1px solid #d9dde3;text-align:right;">${formatUsdFromCents(item.unitPriceCents)}</td>
      <td style="padding:8px;border-bottom:1px solid #d9dde3;text-align:right;">${formatUsdFromCents(item.lineTotalCents)}</td>
    </tr>
  `).join('');

  const customRows = visibleFields.map((field) => `
    <tr>
      <td style="padding:6px 0;color:#4b5563;">${escapeHtml(field.label)}</td>
      <td style="padding:6px 0;text-align:right;">${escapeHtml(field.value)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:Georgia,Times,serif;color:#1f2937;max-width:640px;margin:0 auto;">
      <h1 style="font-size:24px;margin-bottom:8px;">Invoice ${escapeHtml(invoice.invoiceNumber)}</h1>
      <p style="margin:0 0 16px;color:#4b5563;">
        Issued ${escapeHtml(formatDate(invoice.issueDate))} · Due ${escapeHtml(formatDate(invoice.dueDate))}
      </p>
      <p style="margin:0 0 4px;"><strong>${escapeHtml(invoice.businessDetails.name)}</strong></p>
      ${invoice.businessDetails.email ? `<p style="margin:0 0 16px;">${escapeHtml(invoice.businessDetails.email)}</p>` : ''}
      <p style="margin:0 0 4px;">Bill to <strong>${escapeHtml(invoice.customerDetails.name)}</strong></p>
      ${invoice.customerDetails.companyName ? `<p style="margin:0 0 16px;">${escapeHtml(invoice.customerDetails.companyName)}</p>` : ''}
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <thead>
          <tr>
            <th align="left" style="padding:8px;border-bottom:2px solid #111827;">Description</th>
            <th align="right" style="padding:8px;border-bottom:2px solid #111827;">Qty</th>
            <th align="right" style="padding:8px;border-bottom:2px solid #111827;">Unit price</th>
            <th align="right" style="padding:8px;border-bottom:2px solid #111827;">Line total</th>
          </tr>
        </thead>
        <tbody>${lineRows}</tbody>
      </table>
      <table style="width:100%;max-width:280px;margin-left:auto;border-collapse:collapse;">
        <tr><td style="padding:4px 0;">Subtotal</td><td style="text-align:right;">${formatUsdFromCents(invoice.subtotalCents)}</td></tr>
        <tr><td style="padding:4px 0;">Discount</td><td style="text-align:right;">${formatUsdFromCents(invoice.discountAmountCents)}</td></tr>
        <tr><td style="padding:4px 0;">Tax (${escapeHtml(formatTaxRate(invoice.taxRate))})</td><td style="text-align:right;">${formatUsdFromCents(invoice.taxAmountCents)}</td></tr>
        <tr><td style="padding:8px 0;font-weight:bold;">Grand total</td><td style="text-align:right;font-weight:bold;">${formatUsdFromCents(invoice.grandTotalCents)}</td></tr>
      </table>
      ${customRows ? `<table style="width:100%;margin-top:16px;border-collapse:collapse;">${customRows}</table>` : ''}
      ${invoice.notes ? `<p style="margin-top:20px;">${multilineHtml(invoice.notes)}</p>` : ''}
    </div>
  `;

  return {
    to,
    from: from || getSmtpConfig().from,
    subject: `Invoice ${invoice.invoiceNumber} from ${invoice.businessDetails.name}`,
    text: [
      `Invoice ${invoice.invoiceNumber}`,
      `Issue date: ${invoice.issueDate}`,
      `Due date: ${invoice.dueDate}`,
      `Subtotal: ${formatUsdFromCents(invoice.subtotalCents)}`,
      `Discount: ${formatUsdFromCents(invoice.discountAmountCents)}`,
      `Tax: ${formatUsdFromCents(invoice.taxAmountCents)}`,
      `Grand total: ${formatUsdFromCents(invoice.grandTotalCents)}`,
    ].join('\n'),
    html,
  };
}

export async function sendInvoiceEmail({ invoice, to, transporter }) {
  assertRecipientAllowed(to);
  assertSmtpConfigured();

  const message = buildInvoiceEmail({ invoice, to, from: getSmtpConfig().from });
  const result = await (transporter || createTransport()).sendMail(message);

  return {
    accepted: result.accepted || [],
    rejected: result.rejected || [],
    messageId: result.messageId || '',
  };
}
