/**
 * MongoDB connection. Production requires MONGODB_URI.
 * Local development falls back to mongodb-memory-server so the editor can
 * save invoices when MongoDB is not installed; that data is lost on restart.
 */
import mongoose from 'mongoose';

let memoryServer = null;

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  mongoose.set('strictQuery', true);

  if (uri) {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
      return { uri, inMemory: false };
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      console.warn(`MongoDB at ${uri} is unavailable (${error.message}). Starting an in-memory database for local development.`);
    }
  } else if (process.env.NODE_ENV === 'production') {
    throw new Error('MONGODB_URI is not set. Copy server/.env.example to server/.env and add a MongoDB connection string.');
  } else {
    console.warn('MONGODB_URI is not set. Starting an in-memory database for local development.');
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const memoryUri = memoryServer.getUri();
  await mongoose.connect(memoryUri);
  return { uri: memoryUri, inMemory: true };
}

export function getDatabaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] || 'unknown';
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
