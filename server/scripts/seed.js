/**
 * Upsert fictional Harbor Lane Studio invoices, including the $99.00 example.
 * Requires a reachable MONGODB_URI (not the ephemeral test database).
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAMPLE_INVOICES } from '../../shared/invoiceDefaults.js';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { Invoice } from '../src/models/Invoice.js';
import { buildInvoiceDocument } from '../src/services/invoiceCalculationService.js';
import { normalizeInvoiceInput } from '../src/validators/invoiceValidator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function seed() {
  await connectDatabase();

  for (const sample of SAMPLE_INVOICES) {
    const document = buildInvoiceDocument(normalizeInvoiceInput(sample));
    await Invoice.findOneAndUpdate(
      { invoiceNumber: document.invoiceNumber },
      document,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    console.log(`Seeded ${document.invoiceNumber}`);
  }

  await disconnectDatabase();
}

seed().catch(async (error) => {
  console.error(error.message);
  await disconnectDatabase();
  process.exit(1);
});
