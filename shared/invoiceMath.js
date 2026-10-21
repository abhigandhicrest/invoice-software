/**
 * Integer-cent invoice calculations shared by the React preview and Express API.
 *
 * Why cents + BigInt: ordinary IEEE floats cannot represent 0.1 exactly, so
 * money math must not multiply floats and then round at the end.
 *
 * Scales:
 * - money: integer cents (2 decimal places)
 * - quantity: 4 decimal places (QUANTITY_SCALE = 10000)
 * - tax rate: 4 decimal places (TAX_RATE_SCALE = 10000)
 *
 * Sequence (required by the product spec):
 * 1. lineTotal = roundHalfUp(quantity × unitPrice)
 * 2. subtotal = sum of those rounded line totals
 * 3. discountedSubtotal = subtotal − discount (discount cannot exceed subtotal)
 * 4. taxAmount = roundHalfUp(discountedSubtotal × taxRate / 100)
 * 5. grandTotal = discountedSubtotal + taxAmount
 *
 * Required fixture: 2 × $50.00 − $10.00 + 10% tax = $99.00 (TC-CALC-02).
 */

export const QUANTITY_SCALE = 10000;
export const TAX_RATE_SCALE = 10000;
export const MAX_MONEY_CENTS = 1_000_000_000; // $10,000,000.00
export const MAX_QUANTITY = 1_000_000;

export class InvoiceValidationError extends Error {
  constructor(errors) {
    const list = Array.isArray(errors) ? errors : [{ field: 'invoice', message: String(errors) }];
    super(list[0]?.message || 'Validation failed');
    this.name = 'InvoiceValidationError';
    this.errors = list;
  }
}

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

function finiteNumberToDecimalString(value, field) {
  if (!isFiniteNumber(value)) {
    throw new InvoiceValidationError([{ field, message: `${field} must be a finite number.` }]);
  }
  const asString = value.toString();
  if (/e/i.test(asString)) {
    throw new InvoiceValidationError([{
      field,
      message: `${field} is too large or too small to represent precisely.`,
    }]);
  }
  return asString;
}

export function normalizeDecimalString(value, field) {
  if (value === '' || value === null || value === undefined) {
    throw new InvoiceValidationError([{ field, message: `${field} is required.` }]);
  }

  if (typeof value === 'number') {
    return finiteNumberToDecimalString(value, field);
  }

  const text = String(value).trim();
  if (!text) {
    throw new InvoiceValidationError([{ field, message: `${field} is required.` }]);
  }
  if (/e/i.test(text) || !/^-?\d+(\.\d+)?$/.test(text)) {
    throw new InvoiceValidationError([{ field, message: `${field} must be a valid number.` }]);
  }
  return text;
}

/**
 * Convert a decimal value into a scaled integer (e.g. 2.5 at scale 10000 => 25000).
 */
export function parseToScaledInteger(value, scale, field, options = {}) {
  const {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
    allowNegative = false,
    maxFractionDigits = Math.round(Math.log10(scale)),
  } = options;

  const text = normalizeDecimalString(value, field);
  const negative = text.startsWith('-');
  if (negative && !allowNegative) {
    throw new InvoiceValidationError([{ field, message: `${field} cannot be negative.` }]);
  }

  const unsigned = negative ? text.slice(1) : text;
  const [wholePart, fractionPart = ''] = unsigned.split('.');

  if (fractionPart.length > maxFractionDigits) {
    throw new InvoiceValidationError([{
      field,
      message: `${field} cannot have more than ${maxFractionDigits} decimal place${maxFractionDigits === 1 ? '' : 's'}.`,
    }]);
  }

  const paddedFraction = fractionPart.padEnd(maxFractionDigits, '0');
  const scaled = BigInt(wholePart || '0') * BigInt(scale) + BigInt(paddedFraction || '0');
  const signed = negative ? -scaled : scaled;

  if (signed > BigInt(Number.MAX_SAFE_INTEGER) || signed < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new InvoiceValidationError([{ field, message: `${field} is out of range.` }]);
  }

  const numeric = Number(signed) / scale;
  if (numeric < min) {
    throw new InvoiceValidationError([{ field, message: `${field} must be at least ${min}.` }]);
  }
  if (numeric > max) {
    throw new InvoiceValidationError([{ field, message: `${field} cannot exceed ${max}.` }]);
  }

  return signed;
}

export function parseMoneyToCents(value, field) {
  const cents = parseToScaledInteger(value, 100, field, {
    min: 0,
    max: MAX_MONEY_CENTS / 100,
    maxFractionDigits: 2,
  });
  return Number(cents);
}

export function parseQuantityScaled(value, field) {
  return parseToScaledInteger(value, QUANTITY_SCALE, field, {
    min: Number(1) / QUANTITY_SCALE,
    max: MAX_QUANTITY,
    maxFractionDigits: 4,
  });
}

export function parseDiscountCents(value, field = 'discountAmount') {
  if (value === '' || value === null || value === undefined) {
    return 0;
  }
  return parseMoneyToCents(value, field);
}

export function parseTaxRateScaled(value, field = 'taxRate') {
  if (value === '' || value === null || value === undefined) {
    return 0n;
  }
  return parseToScaledInteger(value, TAX_RATE_SCALE, field, {
    min: 0,
    max: 100,
    maxFractionDigits: 4,
  });
}

/**
 * Half-up rounding for an exact BigInt ratio (0.5 cents rounds away from zero
 * toward the next cent). Used for line totals and tax.
 */
export function divideRoundHalfUp(numerator, denominator) {
  if (denominator === 0n) {
    throw new InvoiceValidationError([{ field: 'totals', message: 'Cannot divide by zero.' }]);
  }

  const negative = (numerator < 0n) !== (denominator < 0n);
  const n = numerator < 0n ? -numerator : numerator;
  const d = denominator < 0n ? -denominator : denominator;
  const quotient = n / d;
  const remainder = n % d;
  const rounded = remainder * 2n >= d ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

export function scaledToNumber(scaled, scale) {
  const negative = scaled < 0n;
  const absolute = negative ? -scaled : scaled;
  const whole = absolute / BigInt(scale);
  const fraction = absolute % BigInt(scale);
  const digits = String(scale).length - 1;
  const text = `${negative ? '-' : ''}${whole.toString()}.${fraction.toString().padStart(digits, '0')}`;
  return Number(text);
}

function collectError(errors, fn) {
  try {
    return { value: fn(), error: null };
  } catch (error) {
    if (error instanceof InvoiceValidationError) {
      errors.push(...error.errors);
      return { value: null, error };
    }
    throw error;
  }
}

/**
 * Calculate invoice totals from user-facing decimal inputs.
 *
 * lineTotal = roundToCents(quantity × unitPrice)
 * subtotal = sum of rounded line totals
 * discountedSubtotal = subtotal - discount
 * taxAmount = roundToCents(discountedSubtotal × taxRate / 100)
 * grandTotal = discountedSubtotal + taxAmount
 */
export function calculateInvoice(input = {}, options = {}) {
  const { requireLineItems = false, lenient = false } = options;
  const errors = [];
  const items = Array.isArray(input.lineItems) ? input.lineItems : [];

  if (requireLineItems && items.length === 0) {
    errors.push({ field: 'lineItems', message: 'Add at least one line item.' });
  }

  const calculatedItems = items.map((item, index) => {
    const prefix = `lineItems.${index}`;
    const quantityResult = collectError(errors, () => parseQuantityScaled(item?.quantity, `${prefix}.quantity`));
    const priceResult = collectError(errors, () => parseMoneyToCents(item?.unitPrice, `${prefix}.unitPrice`));

    if (quantityResult.value === null || priceResult.value === null) {
      return {
        description: item?.description ?? '',
        quantity: item?.quantity,
        unitPriceCents: 0,
        lineTotalCents: 0,
        valid: false,
      };
    }

    const lineTotal = divideRoundHalfUp(
      quantityResult.value * BigInt(priceResult.value),
      BigInt(QUANTITY_SCALE),
    );

    if (lineTotal > BigInt(MAX_MONEY_CENTS)) {
      errors.push({ field: `${prefix}.lineTotal`, message: 'Line total exceeds the maximum allowed amount.' });
    }

    return {
      description: item?.description ?? '',
      quantity: scaledToNumber(quantityResult.value, QUANTITY_SCALE),
      quantityScaled: quantityResult.value,
      unitPriceCents: priceResult.value,
      lineTotalCents: Number(lineTotal),
      valid: true,
    };
  });

  const validItems = calculatedItems.filter((item) => item.valid);
  const subtotalCents = validItems.reduce((sum, item) => sum + item.lineTotalCents, 0);

  const discountResult = collectError(errors, () => parseDiscountCents(input.discountAmount, 'discountAmount'));
  const taxResult = collectError(errors, () => parseTaxRateScaled(input.taxRate, 'taxRate'));

  const discountAmountCents = discountResult.value ?? 0;
  const taxRateScaled = taxResult.value ?? 0n;

  if (discountResult.value !== null && discountAmountCents > subtotalCents) {
    errors.push({
      field: 'discountAmount',
      message: 'Discount cannot exceed the subtotal.',
    });
  }

  if (errors.length > 0 && !lenient) {
    throw new InvoiceValidationError(errors);
  }

  const safeDiscount = discountResult.value === null || discountAmountCents > subtotalCents
    ? 0
    : discountAmountCents;
  const discountedSubtotalCents = Math.max(0, subtotalCents - safeDiscount);
  const taxAmountCents = taxResult.value === null
    ? 0
    : Number(divideRoundHalfUp(
      BigInt(discountedSubtotalCents) * taxRateScaled,
      100n * BigInt(TAX_RATE_SCALE),
    ));
  const grandTotalCents = discountedSubtotalCents + taxAmountCents;

  return {
    lineItems: calculatedItems,
    subtotalCents,
    discountAmountCents: discountResult.value ?? 0,
    discountedSubtotalCents,
    taxRate: taxResult.value === null ? 0 : scaledToNumber(taxRateScaled, TAX_RATE_SCALE),
    taxAmountCents,
    grandTotalCents,
    errors,
  };
}

export function tryCalculateInvoice(input, options = {}) {
  try {
    return calculateInvoice(input, { ...options, lenient: true });
  } catch (error) {
    if (error instanceof InvoiceValidationError) {
      return {
        lineItems: [],
        subtotalCents: 0,
        discountAmountCents: 0,
        discountedSubtotalCents: 0,
        taxRate: 0,
        taxAmountCents: 0,
        grandTotalCents: 0,
        errors: error.errors,
      };
    }
    throw error;
  }
}
