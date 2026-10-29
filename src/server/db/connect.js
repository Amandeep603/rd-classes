import "server-only";
import mongoose from "mongoose";
import { env } from "../env.js";

let cached = globalThis.__rd_mongoose || globalThis.mongooseCache;

if (!cached) {
  cached = globalThis.__rd_mongoose = globalThis.mongooseCache = { conn: null, promise: null };
}

export async function connectDB(uriOverride) {
  const uri = uriOverride || env?.MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    };

    cached.promise = mongoose.connect(uri, opts).then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
