/** Isolated MongoMemoryServer lifecycle for API tests. */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { SAMPLE_INVOICES } from '../../shared/invoiceDefaults.js';

let memoryServer;

export const exampleInvoice = {
  ...SAMPLE_INVOICES[0],
};

export function validInvoice(overrides = {}) {
  return {
    ...exampleInvoice,
    invoiceNumber: overrides.invoiceNumber || `INV-TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...overrides,
    businessDetails: {
      ...exampleInvoice.businessDetails,
      ...(overrides.businessDetails || {}),
    },
    customerDetails: {
      ...exampleInvoice.customerDetails,
      ...(overrides.customerDetails || {}),
    },
  };
}

export async function startTestDatabase() {
  memoryServer = await MongoMemoryServer.create();
  await mongoose.connect(memoryServer.getUri());
}

export async function stopTestDatabase() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}

export async function resetDatabase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}
