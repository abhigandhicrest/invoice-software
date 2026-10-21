/**
 * Central JSON error shape: { success: false, message, errors? }.
 * Duplicate-key (11000) becomes 409. Production 500s omit stacks and secrets.
 */
import { InvoiceValidationError } from '../../../shared/invoiceMath.js';

export function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    message: 'The requested resource was not found.',
  });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof InvoiceValidationError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'An invoice with this invoice number already exists.',
      errors: [{ field: 'invoiceNumber', message: 'Invoice number must be unique.' }],
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Request body is not valid JSON.',
    });
  }

  if (err.status === 400 && err.expose) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const status = err.statusCode || err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = status >= 500 && isProduction
    ? 'An unexpected error occurred.'
    : err.message || 'An unexpected error occurred.';

  return res.status(status).json({
    success: false,
    message,
    ...(!isProduction && status >= 500 ? { errors: [{ field: 'server', message: err.message }] } : {}),
  });
}
