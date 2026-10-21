/**
 * Structural invoice validation used by both the editor and the API.
 * Numeric/total rules live in invoiceMath.js so they cannot drift.
 *
 * Dates are YYYY-MM-DD strings (not Date objects) to avoid timezone shifts.
 * Customer email is optional on save and required only when sending email.
 */
import { calculateInvoice, InvoiceValidationError } from './invoiceMath.js';
import { normalizeCustomFields } from './customFields.js';

export const INVOICE_NUMBER_PATTERN = /^[A-Za-z0-9-]{1,40}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const FIELD_LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  address: 500,
  website: 200,
  taxId: 60,
  invoiceNumber: 40,
  notes: 4000,
  description: 300,
  customLabel: 80,
  customValue: 300,
};

export function sanitizeString(value, maxLength = 2000, { allowNewlines = false } = {}) {
  if (value === null || value === undefined) {
    return '';
  }
  const text = String(value);
  const withoutControls = allowNewlines
    ? text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    : text.replace(/[\u0000-\u001F\u007F]/g, '');
  return withoutControls.trim().slice(0, maxLength);
}

export function isValidEmail(value) {
  const email = sanitizeString(value, FIELD_LIMITS.email);
  return EMAIL_PATTERN.test(email);
}

export function isValidDateString(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function compareDateStrings(left, right) {
  return left.localeCompare(right);
}

function pushIf(errors, condition, field, message) {
  if (condition) {
    errors.push({ field, message });
  }
}

function optionalEmailError(value, field, label) {
  const email = sanitizeString(value, FIELD_LIMITS.email);
  if (!email) {
    return null;
  }
  if (!isValidEmail(email)) {
    return { field, message: `${label} must be a valid email address.` };
  }
  return null;
}

/**
 * Structural validation for save and API requests.
 * Numeric and total rules come from calculateInvoice.
 */
export function validateInvoice(input = {}, options = {}) {
  const { requireLineItems = true, requireCustomerEmail = false } = options;
  const errors = [];

  const business = input.businessDetails || {};
  const customer = input.customerDetails || {};

  pushIf(errors, !sanitizeString(business.name, FIELD_LIMITS.name), 'businessDetails.name', 'Business name is required.');

  const businessEmailError = optionalEmailError(business.email, 'businessDetails.email', 'Business email');
  if (businessEmailError) {
    errors.push(businessEmailError);
  }

  pushIf(errors, !sanitizeString(customer.name, FIELD_LIMITS.name), 'customerDetails.name', 'Customer name is required.');
  pushIf(
    errors,
    !sanitizeString(customer.billingAddress, FIELD_LIMITS.address, { allowNewlines: true }),
    'customerDetails.billingAddress',
    'Customer billing address is required.',
  );

  const customerEmail = sanitizeString(customer.email, FIELD_LIMITS.email);
  if (requireCustomerEmail && !customerEmail) {
    errors.push({ field: 'customerDetails.email', message: 'Customer email is required to send this invoice.' });
  } else {
    const customerEmailError = optionalEmailError(customer.email, 'customerDetails.email', 'Customer email');
    if (customerEmailError) {
      errors.push(customerEmailError);
    }
  }

  const invoiceNumber = sanitizeString(input.invoiceNumber, FIELD_LIMITS.invoiceNumber);
  if (!invoiceNumber) {
    errors.push({ field: 'invoiceNumber', message: 'Invoice number is required.' });
  } else if (!INVOICE_NUMBER_PATTERN.test(invoiceNumber)) {
    errors.push({
      field: 'invoiceNumber',
      message: 'Invoice number may contain only letters, numbers, and hyphens (1–40 characters).',
    });
  }

  const issueDate = sanitizeString(input.issueDate, 10);
  const dueDate = sanitizeString(input.dueDate, 10);
  if (!isValidDateString(issueDate)) {
    errors.push({ field: 'issueDate', message: 'Issue date must be a valid date.' });
  }
  if (!isValidDateString(dueDate)) {
    errors.push({ field: 'dueDate', message: 'Due date must be a valid date.' });
  }
  if (isValidDateString(issueDate) && isValidDateString(dueDate) && compareDateStrings(dueDate, issueDate) < 0) {
    errors.push({ field: 'dueDate', message: 'Due date cannot be earlier than the issue date.' });
  }

  const items = Array.isArray(input.lineItems) ? input.lineItems : [];
  if (requireLineItems && items.length === 0) {
    errors.push({ field: 'lineItems', message: 'Add at least one line item.' });
  }

  items.forEach((item, index) => {
    const description = sanitizeString(item?.description, FIELD_LIMITS.description);
    if (!description) {
      errors.push({ field: `lineItems.${index}.description`, message: 'Line item description is required.' });
    }
  });

  const customFields = normalizeCustomFields(input.customFields);
  customFields.forEach((field, index) => {
    if (!sanitizeString(field.label, FIELD_LIMITS.customLabel)) {
      errors.push({ field: `customFields.${index}.label`, message: 'Custom field label is required.' });
    }
  });

  try {
    calculateInvoice(input, { requireLineItems });
  } catch (error) {
    if (error instanceof InvoiceValidationError) {
      errors.push(...error.errors);
    } else {
      throw error;
    }
  }

  const unique = [];
  const seen = new Set();
  errors.forEach((error) => {
    const key = `${error.field}:${error.message}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(error);
    }
  });

  return unique;
}

export function assertValidInvoice(input, options) {
  const errors = validateInvoice(input, options);
  if (errors.length > 0) {
    throw new InvoiceValidationError(errors);
  }
}

export function errorsToMap(errors = []) {
  return errors.reduce((map, error) => {
    if (!map[error.field]) {
      map[error.field] = error.message;
    }
    return map;
  }, {});
}
