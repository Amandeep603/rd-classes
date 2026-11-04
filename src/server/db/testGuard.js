import mongoose from "mongoose";

/**
 * Asserts that the currently connected database or provided URI is strictly a test database.
 * Throws an immediate Error if the database name does not contain "test" or matches production.
 */
export function assertTestDatabase(customUri) {
  const uri = customUri || process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || "";
  
  // Extract database name from URI or connection
  let dbName = "";
  if (customUri) {
    try {
      const parsed = new URL(customUri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://"));
      dbName = parsed.pathname.replace(/^\//, "").split("?")[0];
    } catch {
      const match = customUri.match(/\/([^/?]+)(\?|$)/);
      if (match) dbName = match[1];
    }
  } else if (mongoose.connection && mongoose.connection.readyState === 1 && mongoose.connection.name) {
    dbName = mongoose.connection.name;
  } else if (uri) {
    try {
      const parsed = new URL(uri.replace("mongodb+srv://", "http://").replace("mongodb://", "http://"));
      dbName = parsed.pathname.replace(/^\//, "").split("?")[0];
    } catch {
      // Fallback regex
      const match = uri.match(/\/([^/?]+)(\?|$)/);
      if (match) dbName = match[1];
    }
  }

  const cleanDb = (dbName || "").toLowerCase();
  const prodDb = (process.env.MONGODB_URI_PROD_DB || "rd-classes").toLowerCase();

  if (!cleanDb.includes("test") || cleanDb === prodDb || cleanDb === "production" || cleanDb === "admin") {
    throw new Error(
      `[SECURITY_GUARD] Dangerous execution prevented! Database "${dbName}" is NOT a designated test database. Database name MUST contain "test".`
    );
  }

  return true;
}

