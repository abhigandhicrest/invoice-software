/**
 * Persisted invoice. Monetary inputs are stored in cents.
 * subtotalCents / taxAmountCents / grandTotalCents are server-calculated
 * snapshots for listing; they are recomputed on every create/update.
 * invoiceNumber is unique so duplicates return HTTP 409 (TC-API-07).
 */
import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  website: { type: String, default: '' },
  taxId: { type: String, default: '' },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  billingAddress: { type: String, required: true },
  companyName: { type: String, default: '' },
  taxId: { type: String, default: '' },
}, { _id: false });

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitPriceCents: { type: Number, required: true, min: 0 },
  lineTotalCents: { type: Number, required: true, min: 0 },
}, { _id: false });

const customFieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  value: { type: String, default: '' },
  visible: { type: Boolean, default: true },
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    trim: true,
  },
  businessDetails: { type: businessSchema, required: true },
  customerDetails: { type: customerSchema, required: true },
  issueDate: { type: String, required: true },
  dueDate: { type: String, required: true },
  notes: { type: String, default: '' },
  lineItems: {
    type: [lineItemSchema],
    required: true,
    validate: [(items) => items.length > 0, 'At least one line item is required.'],
  },
  discountAmountCents: { type: Number, required: true, min: 0, default: 0 },
  taxRate: { type: Number, required: true, min: 0, default: 0 },
  customFields: { type: [customFieldSchema], default: [] },
  subtotalCents: { type: Number, required: true, min: 0 },
  taxAmountCents: { type: Number, required: true, min: 0 },
  grandTotalCents: { type: Number, required: true, min: 0 },
}, { timestamps: true });

invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ createdAt: -1 });

export const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
