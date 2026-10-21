/**
 * Process entry: load server/.env, connect MongoDB (or in-memory fallback
 * in development), then listen. SMTP credentials stay on the server.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { isSmtpConfigured } from './services/emailService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
// Reload this file after changing server/.env so Nodemailer picks up new settings.

const port = Number(process.env.PORT || 5000);

async function start() {
  const database = await connectDatabase();
  const app = createApp();
  app.listen(port, () => {
    console.log(`Invoice API listening on http://localhost:${port}`);
    if (database?.inMemory) {
      console.log('Using in-memory MongoDB. Saved invoices are cleared when this process stops.');
      console.log(`In-memory MongoDB URI (Compass / mongosh): ${database.uri}`);
    } else {
      console.log(`Connected to MongoDB: ${database.uri}`);
    }
    console.log(isSmtpConfigured()
      ? 'SMTP is configured.'
      : 'SMTP is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in server/.env.');
  });
}

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
