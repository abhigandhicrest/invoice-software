/**
 * Invoice CRUD. Create uses POST; later saves of the same document use PUT
 * so repeated clicks do not insert duplicates (TC-API-14).
 */
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { validateInvoicePayload } from '../validators/invoiceValidator.js';
import { buildInvoiceDocument, toInvoiceListItem, toInvoiceResponse } from '../services/invoiceCalculationService.js';

function notFound() {
  const error = new Error('Invoice not found.');
  error.statusCode = 404;
  return error;
}

export async function createInvoice(req, res, next) {
  try {
    const payload = validateInvoicePayload(req.body);
    const document = await Invoice.create(buildInvoiceDocument(payload));
    res.status(201).json({ success: true, data: toInvoiceResponse(document) });
  } catch (error) {
    next(error);
  }
}

export async function listInvoices(req, res, next) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Invoice.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('invoiceNumber customerDetails.name issueDate grandTotalCents updatedAt'),
      Invoice.countDocuments({}),
    ]);

    res.json({
      success: true,
      data: {
        items: items.map(toInvoiceListItem),
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      throw notFound();
    }
    res.json({ success: true, data: toInvoiceResponse(invoice) });
  } catch (error) {
    next(error);
  }
}

export async function updateInvoice(req, res, next) {
  try {
    const payload = validateInvoicePayload(req.body);
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      throw notFound();
    }

    invoice.set(buildInvoiceDocument(payload));
    const saved = await invoice.save();
    res.json({ success: true, data: toInvoiceResponse(saved) });
  } catch (error) {
    next(error);
  }
}

export async function deleteInvoice(req, res, next) {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      throw notFound();
    }
    res.json({
      success: true,
      data: { id: req.params.id, deleted: true },
    });
  } catch (error) {
    next(error);
  }
}

/** Raw MongoDB documents for the Heidi-style database viewer. */
export async function inspectDatabase(_req, res, next) {
  try {
    const documents = await Invoice.find({}).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: {
        engine: 'MongoDB',
        database: mongoose.connection.name || 'unknown',
        host: mongoose.connection.host || 'unknown',
        port: mongoose.connection.port || null,
        collection: Invoice.collection.collectionName,
        count: documents.length,
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
}
