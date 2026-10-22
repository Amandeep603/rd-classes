import "server-only";
import mongoose from "mongoose";
import { env } from "../env.js";

let cached = globalThis.__rd_mongoose;

if (!cached) {
  cached = globalThis.__rd_mongoose = { conn: null, promise: null };
}

export async function connectDB(uriOverride) {
  const uri = uriOverride || env.MONGODB_URI;

  if (cached.conn && cached.conn.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 8000,
      autoIndex: process.env.NODE_ENV !== "production",
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
