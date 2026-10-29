import mongoose from "mongoose";

let cached = global.mongooseCache || globalThis.__rd_mongoose || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
  globalThis.__rd_mongoose = cached;
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
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

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
