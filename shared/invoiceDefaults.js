/**
 * Fictional Harbor Lane Studio sample data for new invoices and `npm run seed`.
 * Not real businesses or customers. Invoice numbers are unique suggestions;
 * the user may edit them before save.
 */

export const DEMO_BUSINESS = {
  name: 'Harbor Lane Studio',
  email: 'billing@harborlanestudio.example',
  phone: '(415) 555-0142',
  address: '184 Harbor Lane, Suite 12\nSan Francisco, CA 94107',
  website: 'https://harborlanestudio.example',
  taxId: 'TAX-HL-88421',
};

export const EMPTY_CUSTOMER = {
  name: '',
  email: '',
  phone: '',
  billingAddress: '',
  companyName: '',
  taxId: '',
};

export function todayDateString(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDateString(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  const nextYear = date.getUTCFullYear();
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getUTCDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export function generateInvoiceNumber(now = new Date()) {
  const stamp = todayDateString(now).replaceAll('-', '');
  const suffix = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `INV-${stamp}-${suffix}`;
}

export function createEmptyLineItem() {
  return {
    description: '',
    quantity: 1,
    unitPrice: '0.00',
  };
}

export function createBlankInvoice(now = new Date()) {
  const issueDate = todayDateString(now);
  return {
    invoiceNumber: generateInvoiceNumber(now),
    issueDate,
    dueDate: addDaysToDateString(issueDate, 15),
    notes: 'Thank you for working with Harbor Lane Studio. Payment is due within 15 days.',
    businessDetails: { ...DEMO_BUSINESS },
    customerDetails: { ...EMPTY_CUSTOMER },
    lineItems: [createEmptyLineItem()],
    discountAmount: '0.00',
    taxRate: '0',
    customFields: [],
  };
}

export const SAMPLE_INVOICES = [
  {
    invoiceNumber: 'INV-20261021-0099',
    issueDate: '2026-10-21',
    dueDate: '2026-11-05',
    notes: 'Required calculation example: $100.00 − $10.00 + 10% tax = $99.00.',
    businessDetails: { ...DEMO_BUSINESS },
    customerDetails: {
      name: 'Avery Chen',
      email: 'avery.chen@northwind.example',
      phone: '(206) 555-0178',
      billingAddress: '88 Pine Street, Floor 4\nSeattle, WA 98101',
      companyName: 'Northwind Labs',
      taxId: 'NW-441902',
    },
    lineItems: [
      { description: 'Website Development', quantity: 2, unitPrice: '50.00' },
    ],
    discountAmount: '10.00',
    taxRate: '10',
    customFields: [
      { label: 'Purchase Order', value: 'PO-2026-1001', visible: true },
      { label: 'Department', value: 'Engineering', visible: true },
      { label: 'Internal Code', value: 'WEB-2026', visible: false },
    ],
  },
  {
    invoiceNumber: 'INV-20261018-0142',
    issueDate: '2026-10-18',
    dueDate: '2026-11-02',
    notes: 'Brand identity package delivered on October 16.',
    businessDetails: { ...DEMO_BUSINESS },
    customerDetails: {
      name: 'Jordan Patel',
      email: 'jordan.patel@lumenandco.example',
      phone: '(312) 555-0194',
      billingAddress: '520 West Madison, Suite 800\nChicago, IL 60661',
      companyName: 'Lumen & Co.',
      taxId: '',
    },
    lineItems: [
      { description: 'Logo design', quantity: 1, unitPrice: '420.00' },
      { description: 'Brand guidelines booklet', quantity: 1, unitPrice: '180.00' },
      { description: 'Social template set', quantity: 3, unitPrice: '45.00' },
    ],
    discountAmount: '0.00',
    taxRate: '8.25',
    customFields: [
      { label: 'Payment Terms', value: 'Net 15', visible: true },
      { label: 'Project Code', value: 'BRAND-441', visible: true },
    ],
  },
];
