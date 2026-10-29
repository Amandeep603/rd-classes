import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || (globalThis as any).__rd_mongoose || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
  (globalThis as any).__rd_mongoose = cached;
}

export async function connectDB(): Promise<typeof mongoose> {
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
