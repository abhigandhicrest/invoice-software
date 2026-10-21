/**
 * USD display helpers. Always format from integer cents so $99.00 cannot
 * become $98.999999 on screen.
 */

export function centsToDollarNumber(cents) {
  const value = Number(cents || 0);
  return Number((value / 100).toFixed(2));
}

export function centsToDollarInput(cents) {
  return (Number(cents || 0) / 100).toFixed(2);
}

export function formatUsdFromCents(cents) {
  const value = Number(cents || 0) / 100;
  const negative = value < 0;
  const absolute = Math.abs(value);
  const formatted = absolute.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${negative ? '-' : ''}$${formatted}`;
}

export function formatTaxRate(rate) {
  const numeric = Number(rate || 0);
  if (!Number.isFinite(numeric)) {
    return '0%';
  }
  const text = numeric.toFixed(4).replace(/\.?0+$/, '');
  return `${text}%`;
}

export function formatQuantity(quantity) {
  const numeric = Number(quantity);
  if (!Number.isFinite(numeric)) {
    return '';
  }
  return numeric.toString();
}

export function formatDate(dateValue) {
  if (!dateValue) {
    return '';
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateValue));
  if (!match) {
    return String(dateValue);
  }
  const [year, month, day] = [match[1], match[2], match[3]];
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}
